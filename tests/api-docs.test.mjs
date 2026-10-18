import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const specs = ['es', 'en'].map((locale) => [locale, JSON.parse(
  readFileSync(new URL(`../public/openapi.${locale}.json`, import.meta.url), 'utf8'),
)]);
const base = '/transactions/direct-fiat';
const ref = (name) => `#/components/schemas/${name}`;
const jsonBody = (operation, status) => operation.responses[status].content['application/json'];
// Response values verified against survivors develop 495cb7ed serializers (not mocked API fixtures).
const transactionStatuses = ['Pending', 'Completed', 'Canceled', 'Paid', 'Processing', 'User Pending Action'];
const swapStatuses = ['WAITING_DEPOSIT', 'CONFIRMING', 'SENDING', 'COMPLETED', 'EXPIRED', 'REFUNDING', 'REFUNDED', 'FAILED'];
const reference = readFileSync(new URL('../docs/api_specs.md', import.meta.url), 'utf8');

function checkExampleStatuses(value) {
  if (Array.isArray(value)) {
    value.forEach(checkExampleStatuses);
  } else if (value && typeof value === 'object') {
    if (typeof value.transaction_id === 'string' && typeof value.status === 'string') {
      assert.ok(transactionStatuses.includes(value.status), `invalid Transaction.status: ${value.status}`);
    }
    if (value.kind === 'swap' && typeof value.status === 'string') {
      assert.ok(swapStatuses.includes(value.status), `invalid Swap.status: ${value.status}`);
    }
    Object.values(value).forEach(checkExampleStatuses);
  }
}

for (const [locale, spec] of specs) {
  const schemas = spec.components.schemas;
  const paths = spec.paths;

  test(`${locale}: purchase and existing payment requests have separate schemas`, () => {
    const request = paths[`${base}/tentatives`].post.requestBody.content['application/json'];
    assert.ok(request.schema.oneOf, 'separate payment and purchase requests are missing');
    assert.deepEqual(request.schema.oneOf.map((item) => item.$ref), [
      ref('CryptoPurchaseRequest'), ref('DirectFiatPaymentRequest'),
    ]);
    const purchase = schemas.CryptoPurchaseRequest;
    assert.deepEqual(purchase.required, ['type', 'payout_currency', 'payout_network', 'payout_address']);
    assert.deepEqual(purchase.properties.type.enum, ['crypto_purchase']);
    assert.ok(!purchase.required.includes('amount_ars'));
    assert.ok(!purchase.required.includes('funding_currency'));
    assert.ok(!Object.hasOwn(purchase.properties, 'external_reference'));
    assert.match(purchase.properties.payout_address.description, /BOLT11/);
    for (const field of ['amount_ars_cents', 'amount_out']) {
      assert.equal(purchase.properties[field].type, 'integer');
      assert.equal(purchase.properties[field].minimum, 1);
    }
    assert.deepEqual(purchase.oneOf.map((branch) => branch.required),
      [['amount_ars_cents'], ['amount_out']]);
    for (const branch of purchase.oneOf) {
      assert.deepEqual(branch.properties[branch.required[0]],
        purchase.properties[branch.required[0]]);
    }
    const examples = Object.values(request.examples).map((example) => example.value);
    assert.ok(examples.some((value) => value.type === 'fiat_transfer'));
    assert.ok(examples.some((value) => value.payout_network === 'LIGHTNING' && value.amount_out));
    assert.ok(examples.some((value) => value.payout_network === 'LIGHTNING' && value.amount_ars_cents));
    assert.deepEqual(schemas.DirectFiatPaymentRequest.properties.type.enum,
      ['fiat_transfer', 'fast_fiat_transfer']);
  });

  test(`${locale}: purchase quote query does not require payment-only parameters`, () => {
    const quote = paths[`${base}/quote`].get;
    const query = Object.fromEntries(quote.parameters.filter((p) => p.in === 'query').map((p) => [p.name, p]));
    assert.ok(query.type.schema.enum.includes('crypto_purchase'));
    for (const name of ['amount_ars', 'funding_currency', 'funding_network']) {
      assert.equal(query[name].required, false);
    }
    for (const name of ['payout_currency', 'payout_network', 'amount_ars_cents', 'amount_out']) {
      assert.ok(query[name]);
      assert.equal(query[name].required, false);
    }
    assert.ok(jsonBody(quote, '200').schema.oneOf.some((s) => s.$ref === ref('CryptoPurchaseQuote')));
    assert.ok(schemas.CryptoPurchaseQuote.properties.liquidity_ok);
    assert.ok(schemas.CryptoPurchaseQuote.properties.expiration_minutes);
  });

  test(`${locale}: orders use base units, public links and persisted deadlines`, () => {
    const order = schemas.CryptoPurchaseTentative;
    assert.ok(order, 'purchase order schema is missing');
    for (const name of ['amount_ars_cents', 'amount_out', 'network_fee_out', 'total_amount_usdt',
      'fee_amount_usdt', 'funding_amount_usdt']) {
      assert.equal(order.properties[name].type, 'integer');
    }
    for (const name of ['expiration_minutes', 'liquidity_ok', 'receiver_user_id',
      'receiver_account_id', 'payout_invoice', 'payout_idempotency_key', 'error_note']) {
      assert.ok(!Object.hasOwn(order.properties, name), `${name} must not be an order field`);
    }
    assert.equal(order.properties.expires_at.format, 'date-time');
    assert.equal(order.properties.watch_pending.type, 'boolean');
    for (const name of ['funding_transaction_id', 'executed_transaction_id']) {
      assert.equal(order.properties[name].format, 'uuid');
      assert.equal(order.properties[name].nullable, true);
    }
    assert.ok(order.properties.payout_status.enum.includes('review'));
    assert.ok(order.properties.payout_status.enum.includes('settled_to_balance'));
    assert.ok(order.properties.payment_hash);
    assert.ok(!order.required.includes('alias'));
    assert.ok(!order.required.includes('cvu'));
  });

  test(`${locale}: creation has no pending watch before bank instructions exist`, () => {
    const body = jsonBody(paths[`${base}/tentatives`].post, '201');
    const created = body.examples.ars_lightning.value;
    assert.equal(created.status, 'CREATED');
    assert.equal(created.watch_pending, false);
    assert.equal(created.funding_transaction_id, null);
    assert.ok(!Object.hasOwn(created, 'alias'));
    const funded = jsonBody(paths[`${base}/tentatives/{tentative_id}/funding`].post, '201');
    assert.equal(funded.examples.ars_lightning.value.watch_pending, true);
  });

  test(`${locale}: creation documents a changed network fee as a conflict`, () => {
    const conflict = paths[`${base}/tentatives`].post.responses['409'];
    assert.ok(conflict, 'creation can reject a changed fee before persisting the order');
    assert.equal(conflict.content['application/json'].schema.$ref, ref('Error'));
    assert.match(conflict.description, /cotiz|quote/i);
  });

  test(`${locale}: tracking, funding and listing document both directions`, () => {
    for (const [path, method, status] of [
      [`${base}/tentatives`, 'post', '201'],
      [`${base}/tentatives/{tentative_id}`, 'get', '200'],
      [`${base}/tentatives/{tentative_id}/funding`, 'post', '201'],
    ]) {
      assert.ok(jsonBody(paths[path][method], status).schema.oneOf, `${method} ${path} lacks purchase response`);
      assert.ok(jsonBody(paths[path][method], status).schema.oneOf.some(
        (s) => s.$ref === ref('CryptoPurchaseTentative'),
      ));
    }
    const list = paths[`${base}/tentatives`].get;
    assert.ok(list, 'list operation is missing');
    const items = jsonBody(list, '200').schema.properties.tentatives.items;
    assert.ok(items.oneOf.some((s) => s.$ref === ref('CryptoPurchaseTentative')));
    assert.ok(items.oneOf.some((s) => s.$ref === ref('DirectFiatTentativeStatus')));
    const funding = jsonBody(paths[`${base}/tentatives/{tentative_id}/funding`].post, '201');
    const issued = funding.examples.ars_lightning.value;
    assert.equal(issued.status, 'FUNDING_ISSUED');
    assert.ok(issued.alias && issued.cvu);
    assert.ok(!Object.hasOwn(issued, 'lightning_pr'));
  });

  test(`${locale}: all seven operations support authenticated B2B ownership`, () => {
    for (const [path, method] of [
      [`${base}/quote`, 'get'], [`${base}/tentatives`, 'post'],
      [`${base}/tentatives/{tentative_id}/funding`, 'post'],
      [`${base}/tentatives/{tentative_id}`, 'get'], [`${base}/tentatives`, 'get'],
      ['/transactions/{id}', 'get'], ['/transactions/my-transactions', 'get'],
    ]) {
      const operation = paths[path][method];
      assert.deepEqual(operation.security, [{ BearerAuth: [] }, { ApiKeyAuth: [] }]);
      assert.ok(operation.parameters, `${method} ${path} lacks B2B header parameters`);
      assert.ok(operation.parameters.map((p) => p.$ref
        ? spec.components.parameters[p.$ref.split('/').at(-1)] : p)
        .some((p) => p.name === 'X-Wapu-User-Id' && p.in === 'header'));
    }
  });

  test(`${locale}: history keeps legacy shape and adds typed pagination`, () => {
    const operation = paths['/transactions/my-transactions'].get;
    assert.ok(operation.parameters, 'pagination query parameters are missing');
    const params = Object.fromEntries(operation.parameters.filter((p) => !p.$ref).map((p) => [p.name, p]));
    assert.deepEqual(params.page.schema, { type: 'integer', minimum: 1, default: 1 });
    assert.deepEqual(params.per_page.schema, { type: 'integer', minimum: 1, maximum: 50, default: 7 });
    const body = jsonBody(operation, '200');
    assert.deepEqual(body.schema.oneOf.map((s) => s.$ref), [ref('TransactionList'), ref('PaginatedHistory')]);
    assert.ok(!Object.hasOwn(body.examples.legacy.value, 'pagination'));
    const paginated = body.examples.paginated.value;
    assert.equal(paginated.pagination.per_page, 7);
    assert.deepEqual(paginated.transactions.map((t) => t.kind), ['transaction', 'swap']);
    assert.deepEqual(schemas.Pagination.required, ['page', 'per_page', 'total', 'total_pages', 'has_next', 'has_prev']);
    assert.ok(operation.responses['400']);
  });

  test(`${locale}: transaction detail exposes tentative and Liquid navigation`, () => {
    const body = jsonBody(paths['/transactions/{id}'].get, '200');
    assert.ok(body.schema, 'transaction detail response schema is missing');
    assert.equal(body.schema.$ref, ref('TransactionDetail'));
    const extra = schemas.TransactionDetail.allOf[1].properties;
    assert.equal(extra.tentative_id.format, 'uuid');
    assert.equal(extra.asset_id.pattern, '^[0-9a-fA-F]{64}$');
    assert.equal(extra.blockchain_scan_url.format, 'uri');
    assert.ok(body.examples.ars_lightning.value.tentative_id);
  });

  test(`${locale}: docs do not add unrelated API surfaces`, () => {
    assert.ok(!Object.keys(paths).some((path) => path.startsWith('/swaps')));
    const purchaseText = JSON.stringify([
      ...Object.entries(paths).filter(([path]) => path.startsWith(base)),
      schemas.CryptoPurchaseRequest, schemas.CryptoPurchaseQuote, schemas.CryptoPurchaseTentative,
    ]);
    assert.ok(!purchaseText.includes('beta_version'));
    assert.ok(!/flag.{0,30}ramp_on|ramp_on.{0,30}flag/i.test(purchaseText));
  });

  test(`${locale}: purchase operations use the declared documentation group`, () => {
    const declared = spec.tags.map((tag) => tag.name);
    for (const [path, operations] of Object.entries(paths)) {
      if (!path.startsWith(base)) continue;
      for (const operation of Object.values(operations)) {
        for (const tag of operation.tags) assert.ok(declared.includes(tag), `undeclared tag: ${tag}`);
      }
    }
  });

  test(`${locale}: Scalar features ARS to Lightning examples without removing payment examples`, () => {
    for (const [path, method, status] of [
      [`${base}/quote`, 'get', '200'], [`${base}/tentatives`, 'post', '201'],
      [`${base}/tentatives/{tentative_id}`, 'get', '200'],
      [`${base}/tentatives/{tentative_id}/funding`, 'post', '201'],
    ]) {
      const examples = jsonBody(paths[path][method], status).examples;
      assert.equal(Object.keys(examples)[0], 'ars_lightning');
      assert.ok(examples.sat_lightning, 'existing crypto-to-ARS example must remain');
    }
  });

  test(`${locale}: transaction and swap response statuses use different contracts`, () => {
    assert.deepEqual(schemas.Transaction.properties.status.enum, transactionStatuses);
    assert.deepEqual(schemas.HistorySwap.properties.status.enum, swapStatuses);
    checkExampleStatuses(spec);
    // Do not globally rewrite the purchase lifecycle or its separate lowercase payout status.
    assert.ok(schemas.CryptoPurchaseTentative.properties.status.enum.includes('COMPLETED'));
    assert.ok(schemas.CryptoPurchaseTentative.properties.payout_status.enum.includes('completed'));
  });

  test(`${locale}: Lightning transaction detail describes display statuses`, () => {
    const description = paths['/transactions/{id}'].get.description;
    assert.doesNotMatch(description, /\b(?:PENDING|COMPLETED)\b/);
    assert.match(description, /Completed/);
  });

  test(`${locale}: ARS input descriptions do not instruct callers to use future funding`, () => {
    const purchase = schemas.CryptoPurchaseRequest;
    const inputDescriptions = [purchase.properties.amount_ars_cents.description,
      ...purchase.oneOf.filter((branch) => branch.properties.amount_ars_cents)
        .map((branch) => branch.properties.amount_ars_cents.description)];
    const query = paths[`${base}/quote`].get.parameters.find((p) => p.name === 'amount_ars_cents');
    inputDescriptions.push(query.description, query.schema.description);
    for (const description of inputDescriptions) {
      assert.doesNotMatch(description, /\/funding/);
      assert.match(description, locale === 'es' ? /centavos de ARS a gastar/i : /ARS cents to spend/i);
    }
    for (const name of ['CryptoPurchaseQuote', 'CryptoPurchaseTentative']) {
      assert.match(schemas[name].properties.amount_ars_cents.description, /\/funding/);
    }
  });

  test(`${locale}: history and quote validation errors are specific to their inputs`, () => {
    const historyError = paths['/transactions/my-transactions'].get.responses['400'].description;
    assert.match(historyError, /page/);
    assert.match(historyError, /per_page/);
    assert.doesNotMatch(historyError, /amount|monto|tentativ|expir|vencid/i);
    const quoteError = paths[`${base}/quote`].get.responses['400'].description;
    assert.match(quoteError, /amount_ars_cents/);
    assert.match(quoteError, /amount_out/);
    assert.doesNotMatch(quoteError, /expir|vencid/i);
    const createError = paths[`${base}/tentatives`].post.responses['400'].description;
    assert.doesNotMatch(createError, /expir|vencid/i);
    // Expiry is meaningful when issuing funding for an existing tentative.
    assert.match(paths[`${base}/tentatives/{tentative_id}/funding`].post.responses['400'].description,
      /expir|vencid/i);
  });
}

test('Markdown response examples distinguish transaction, swap and tentative status values', () => {
  const blocks = [...reference.matchAll(/```json\s*\n([\s\S]*?)\n```/g)];
  assert.ok(blocks.length > 0);
  for (const [, body] of blocks) checkExampleStatuses(JSON.parse(body));
  assert.doesNotMatch(reference, /Lightning deposit with `PENDING`|may return `COMPLETED`/);
  assert.doesNotMatch(reference, /Transaction object with[^\n]*status: "PENDING"/);
  assert.match(reference, /status=CANCELED/); // The existing PATCH request uses an enum name.
});

test('Spanish and English expose the same operations and structural schemas', () => {
  const structure = (value) => {
    if (Array.isArray(value)) return value.map(structure);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['description', 'summary', 'example', 'examples', 'tags'].includes(key))
      .map(([key, child]) => [key, structure(child)]));
    return value;
  };
  assert.deepEqual(structure(specs[0][1].paths), structure(specs[1][1].paths));
  assert.deepEqual(structure(specs[0][1].components), structure(specs[1][1].components));
});
