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
const fiat = ['PENDING', 'PAID', 'TAKEN', 'USER_PENDING', 'COMPLETED', 'CANCELED'];
const basic = ['PENDING', 'COMPLETED', 'CANCELED'];
const tentative = ['CREATED', 'FUNDING_ISSUED', 'EXECUTED', 'COMPLETED', 'CANCELED', 'EXPIRED',
  'SETTLED_TO_BALANCE', 'FAILED', 'PROCESSING_REFUND', 'REFUNDED'];
// Mirrors survivors app/services/webhook_catalog.py (CATALOG).
const webhookCatalog = {
  'transaction.fiat_transfer': fiat, 'transaction.fast_fiat_transfer': fiat,
  'transaction.deposit': basic, 'transaction.liquid_deposit': basic, 'transaction.withdraw': basic,
  'transaction.send_inner_transf': basic, 'transaction.receive_inner_transf': basic, 'transaction.refund': basic,
  'tentative.fiat_transfer': tentative, 'tentative.fast_fiat_transfer': tentative,
};
const webhookPaths = ['/webhook', '/webhook/subscriptions', '/webhook/test'];
const reference = readFileSync(new URL('../docs/api_specs.md', import.meta.url), 'utf8');

function checkExampleStatuses(value) {
  if (Array.isArray(value)) {
    value.forEach(checkExampleStatuses);
  } else if (value && typeof value === 'object') {
    if (typeof value.event_id === 'string' && typeof value.event_type === 'string') {
      // Webhook envelope: uppercase enum names validated against the catalog, not display statuses.
      assert.ok(webhookCatalog[value.event_type]?.includes(value.status),
        `invalid webhook pair: ${value.event_type} ${value.status}`);
      return;
    }
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

const jsonBlocks = (text) => [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((m) => JSON.parse(m[1]));

for (const [locale, spec] of specs) {
  const paths = spec.paths;
  const schemas = spec.components.schemas;
  const tag = spec.tags.find((item) => /Webhooks/.test(item.name));
  const requestExamples = (operation) => Object.values(operation.requestBody.content['application/json'].examples)
    .map((example) => example.value);

  test(`${locale}: webhook management uses /webhook and no /business/webhook path`, () => {
    assert.deepEqual(Object.keys(paths['/webhook']).sort(), ['delete', 'get', 'patch', 'post']);
    assert.deepEqual(Object.keys(paths['/webhook/subscriptions']).sort(), ['get', 'put']);
    assert.deepEqual(Object.keys(paths['/webhook/test']), ['post']);
    assert.ok(!Object.keys(paths).some((path) => path.startsWith('/business')));
    assert.doesNotMatch(JSON.stringify(spec), /\/business\/webhook/);
    assert.doesNotMatch(reference, /\/business\/webhook/);
    for (const path of webhookPaths) {
      for (const operation of Object.values(paths[path])) {
        assert.deepEqual(operation.security, [{ BearerAuth: [] }, { ApiKeyAuth: [] }]);
        assert.ok(operation.responses['401'] && operation.responses['403']);
      }
    }
    assert.ok(paths['/webhook/test'].post.responses['429']);
    assert.ok(paths['/webhook/test'].post.responses['502']);
    assert.ok(paths['/webhook/subscriptions'].put.responses['404']);
    assert.ok(paths['/webhook'].patch.responses['404']);
  });

  test(`${locale}: registration subscribes to nothing and never rotates the secret`, () => {
    const post = paths['/webhook'].post;
    assert.ok(post.responses['201'] && post.responses['200']);
    const created = jsonBody(post, '201').example;
    assert.ok(created.secret && created.secret_prefix);
    assert.ok(!Object.hasOwn(jsonBody(post, '200').example, 'secret'));
    assert.match(post.description, /PUT \/webhook\/subscriptions/);
    assert.match(tag.description, /subscribes you to nothing|no te suscribe a nada/);
    const empty = jsonBody(paths['/webhook/subscriptions'].get, '200').examples.empty.value;
    assert.deepEqual(empty, { subscriptions: [] });
  });

  test(`${locale}: subscriptions schema covers every catalog event_type, status and the wildcard`, () => {
    const entry = schemas.WebhookSubscription;
    assert.deepEqual(entry.required, ['event_type', 'statuses']);
    assert.equal(entry.additionalProperties, false);
    assert.deepEqual(entry.properties.event_type.enum, Object.keys(webhookCatalog));
    const statuses = entry.properties.statuses;
    assert.equal(statuses.type, 'array');
    assert.equal(statuses.minItems, 1);
    const allStatuses = [...new Set(Object.values(webhookCatalog).flat())];
    assert.deepEqual(statuses.items.enum, [...allStatuses, '*']);
    const body = paths['/webhook/subscriptions'].put.requestBody.content['application/json'];
    assert.equal(body.schema.$ref, ref('WebhookSubscriptions'));
    assert.deepEqual(schemas.WebhookSubscriptions.required, ['subscriptions']);
    const examples = Object.values(body.examples).flatMap((example) => example.value.subscriptions);
    assert.ok(examples.some((item) => item.statuses.length === 1 && item.statuses[0] === '*'));
    for (const item of examples) {
      for (const status of item.statuses) {
        assert.ok(status === '*' || webhookCatalog[item.event_type].includes(status), `${item.event_type} ${status}`);
      }
    }
    assert.match(paths['/webhook/subscriptions'].put.description, /\["\*"\]/);
    assert.ok(Object.hasOwn(body.examples, 'clear'));
  });

  test(`${locale}: every catalog event_type and status pair is documented`, () => {
    for (const [event_type, statuses] of Object.entries(webhookCatalog)) {
      const row = tag.description.split('\n').find((line) => line.startsWith(`| \`${event_type}\` |`));
      assert.ok(row, `catalog row missing for ${event_type}`);
      for (const status of statuses) assert.ok(row.includes(`\`${status}\``), `${event_type} ${status}`);
      assert.ok(schemas.WebhookEvent.properties.event_type.enum.includes(event_type));
    }
    assert.match(tag.description, /tentative\.\*/);
  });

  test(`${locale}: test endpoint requires a catalog event_type and status`, () => {
    const post = paths['/webhook/test'].post;
    const schema = post.requestBody.content['application/json'].schema;
    assert.deepEqual(schema.required, ['event_type', 'status']);
    assert.deepEqual(schema.properties.event_type.enum, Object.keys(webhookCatalog));
    const pairs = requestExamples(post);
    assert.deepEqual(pairs.map((pair) => pair.event_type), Object.keys(webhookCatalog));
    for (const { event_type, status } of pairs) assert.ok(webhookCatalog[event_type].includes(status));
    assert.match(post.description, /is_test/);
    assert.match(post.description, /never changes the failure counter|nunca cambia el contador de fallos/);
  });

  test(`${locale}: secret rotation is explicit through PATCH rotate_secret`, () => {
    const patch = paths['/webhook'].patch;
    const schema = patch.requestBody.content['application/json'].schema;
    assert.equal(schema.properties.rotate_secret.type, 'boolean');
    assert.ok(Object.hasOwn(schema.properties, 'url'));
    assert.ok(requestExamples(patch).some((value) => value.rotate_secret === true));
    assert.ok(Object.hasOwn(jsonBody(patch, '200').example, 'secret'));
    assert.ok(patch.responses['400']);
    assert.match(tag.description, /never rotates the secret|nunca rota el secret/);
    assert.doesNotMatch(paths['/webhook'].post.description, /rotates the signing secret|rota el secret de firma/);
  });

  test(`${locale}: real and test payload examples are separate and match the catalog`, () => {
    const documented = jsonBlocks(tag.description).filter((block) => block.event_id);
    const real = documented.filter((block) => block.is_test === false);
    const synthetic = documented.filter((block) => block.is_test === true);
    assert.ok(real.length >= 2 && synthetic.length >= 2, 'real and test examples must both be documented');
    for (const block of documented) {
      assert.ok(webhookCatalog[block.event_type].includes(block.status));
      assert.deepEqual(Object.keys(block), ['event_id', 'event_type', 'status', 'created_at',
        'business_user_uuid', 'is_test', 'data']);
      assert.deepEqual(Object.keys(block.data), ['transaction_uuid', 'tentative_uuid', 'sub_user_uuid',
        'previous_status', 'amount', 'currency', 'external_reference', 'updated_at']);
    }
    for (const block of synthetic) {
      assert.equal(block.data.previous_status, null);
      assert.equal(block.data.sub_user_uuid, block.business_user_uuid);
      assert.ok(block.event_type.startsWith('tentative.') ? block.data.transaction_uuid === null
        : block.data.tentative_uuid === null || typeof block.data.tentative_uuid === 'string');
    }
    assert.ok(real.some((block) => block.event_type.startsWith('tentative.') && block.data.transaction_uuid));
    assert.ok(real.some((block) => block.data.currency === 'SAT' && Number.isInteger(block.data.amount)));
    assert.equal(schemas.WebhookEvent.example.is_test, false);
    assert.equal(schemas.WebhookTestEvent.example.is_test, true);
    assert.deepEqual(schemas.WebhookEvent.properties.is_test.enum, [false]);
    assert.deepEqual(schemas.WebhookTestEvent.properties.is_test.enum, [true]);
    for (const name of ['WebhookEvent', 'WebhookTestEvent']) {
      assert.deepEqual(schemas[name].properties.event_type.enum, Object.keys(webhookCatalog));
    }
    for (const header of ['X-Wapu-Signature', 'X-Wapu-Timestamp', 'sha256=', 'event_id', 'external_reference',
      'LBTC', '10 s', 'punycode']) {
      assert.ok(tag.description.includes(header), `webhook docs miss ${header}`);
    }
  });

  test(`${locale}: status exposes suspension metadata and manual reactivation`, () => {
    const status = schemas.WebhookStatus.properties;
    assert.equal(status.consecutive_failures.type, 'integer');
    assert.equal(status.suspended_at.format, 'date-time');
    assert.equal(status.suspended_at.nullable, true);
    assert.deepEqual(status.suspension_reason.enum, ['consecutive_delivery_failures', null]);
    assert.deepEqual(status.last_delivery.properties.status.enum, ['PENDING', 'DELIVERED', 'CANCELED', 'DEAD']);
    assert.match(schemas.WebhookStatus.properties.last_delivery.properties.status.description, /legacy|heredado/);
    assert.match(schemas.WebhookCreated.properties.secret.description, /only in this response|solo en esta respuesta/);
    assert.match(schemas.WebhookUpdated.properties.secret.description, /rotation|rotación/);
    assert.match(paths['/webhook/test'].post.requestBody.content['application/json'].schema.properties.status.description, /`event_type`/);
    for (const name of ['WebhookEvent', 'WebhookTestEvent']) {
      assert.match(schemas[name].properties.data.properties.tentative_uuid.description, /EXECUTED/);
    }
    assert.match(tag.description, /`EXECUTED`/);
    const examples = jsonBody(paths['/webhook'].get, '200').examples;
    assert.equal(examples.suspended.value.is_active, false);
    assert.equal(examples.suspended.value.consecutive_failures, 30);
    assert.equal(examples.suspended.value.suspension_reason, 'consecutive_delivery_failures');
    assert.ok(examples.suspended.value.suspended_at);
    assert.equal(examples.active.value.suspension_reason, null);
    assert.match(paths['/webhook'].post.description, /reactiv/i);
    assert.match(tag.description, /POST \/webhook/);
    assert.match(tag.description, /not replayed|no se reenvían/);
  });

  test(`${locale}: delivery guarantee is qualified and PATCH requires url or rotate_secret`, () => {
    assert.match(tag.description, /at least once\*\* while the destination stays active and subscribed|al menos una vez\*\* mientras el destino siga activo y suscrito/);
    assert.match(tag.description, /never replayed|nunca se reenvían/);
    const schema = paths['/webhook'].patch.requestBody.content['application/json'].schema;
    assert.deepEqual(schema.anyOf, [
      { required: ['url'], properties: { url: { minLength: 1 } } },
      { required: ['rotate_secret'], properties: { rotate_secret: { enum: [true] } } },
    ]);
    assert.equal(paths['/webhook'].patch.requestBody.required, true);
    assert.match(schema.description, /rotate_secret: false/);
  });

  test(`${locale}: suspended example is CANCELED at suspension time and URL/secret changes reset the streak`, () => {
    const { value } = jsonBody(paths['/webhook'].get, '200').examples.suspended;
    assert.equal(value.last_delivery.status, 'CANCELED');
    assert.equal(value.last_delivery.at, value.suspended_at);
    assert.match(tag.description, /resets `consecutive_failures` to 0; it never reactivates a suspended one|reinicia `consecutive_failures` a 0; nunca reactiva uno suspendido/);
  });

  test(`${locale}: retry and suspension defaults are documented`, () => {
    assert.match(tag.description, /\*\*30 seconds\*\*|\*\*30 segundos\*\*/);
    assert.match(tag.description, /\*\*3 attempts\*\*|\*\*3 intentos\*\*/);
    assert.match(tag.description, /30th consecutive failed attempt|intento fallido consecutivo número 30/);
    assert.doesNotMatch(tag.description, /100 failed rounds|100 rondas fallidas/);
  });

  test(`${locale}: QR and PIX do not appear in the spec`, () => {
    assert.doesNotMatch(JSON.stringify(spec), /pix|qr_|\bqr\b/i);
  });
}

test('es and en specs expose the same webhook paths', () => {
  const [[, es], [, en]] = specs;
  const webhookKeys = (spec) => Object.keys(spec.paths).filter((path) => path.startsWith('/webhook')).sort();
  assert.deepEqual(webhookKeys(es), webhookPaths);
  assert.deepEqual(webhookKeys(en), webhookPaths);
});

test('webhook example checker tells uppercase envelopes from transaction-detail examples', () => {
  checkExampleStatuses({ event_id: 'x', event_type: 'transaction.fiat_transfer', status: 'TAKEN' });
  assert.throws(() => checkExampleStatuses({ event_id: 'x', event_type: 'transaction.deposit', status: 'TAKEN' }));
  assert.throws(() => checkExampleStatuses({ event_id: 'x', event_type: 'transaction.deposit', status: 'Completed' }));
  assert.throws(() => checkExampleStatuses({ transaction_id: 'x', status: 'COMPLETED' }));
});

test('api reference markdown documents the webhook subscriptions contract and has no QR/PIX', () => {
  for (const heading of ['POST /webhook', 'GET /webhook', 'PATCH /webhook', 'DELETE /webhook',
    'GET /webhook/subscriptions', 'PUT /webhook/subscriptions', 'POST /webhook/test']) {
    assert.ok(reference.includes(`#### \`${heading}\``), `missing ${heading}`);
  }
  assert.doesNotMatch(reference, /pix|qr_|\bqr\b/i);
  assert.doesNotMatch(reference, /transaction\.status_changed|webhook\.test/);
  for (const [event_type, statuses] of Object.entries(webhookCatalog)) {
    const row = reference.split('\n').find((line) => line.startsWith(`| \`${event_type}\` |`));
    assert.ok(row, `markdown catalog row missing for ${event_type}`);
    for (const status of statuses) assert.ok(row.includes(`\`${status}\``), `${event_type} ${status}`);
  }
  const blocks = reference.match(/```json[\s\S]*?```/g).join('\n');
  assert.match(blocks, /"is_test": true/);
  assert.match(blocks, /"is_test": false/);
  assert.match(blocks, /"rotate_secret": true/);
  assert.match(blocks, /"suspension_reason": "consecutive_delivery_failures"/);
  assert.match(blocks, /"statuses": \["\*"\]/);
  assert.match(reference, /`PENDING`, `DELIVERED`, `CANCELED` or the legacy `DEAD`/);
  assert.match(reference, /`tentative\.\*` `EXECUTED` event/);
  assert.match(reference, /aborted after 10 s in total/);
  assert.match(reference, /punycode/);
  assert.match(reference, /30th consecutive failed attempt/);
  assert.match(reference, /at least once\*\* while the destination stays active and subscribed/);
  assert.match(reference, /`rotate_secret: false` alone is rejected/);
  assert.match(reference, /resets `consecutive_failures` to 0; it never reactivates a suspended one/);
  const suspended = JSON.parse(blocks.match(/```json\s*\n(\{[^`]*"suspension_reason": "consecutive_delivery_failures"[^`]*)\n```/)[1]);
  assert.equal(suspended.last_delivery.status, 'CANCELED');
  assert.equal(suspended.last_delivery.at, suspended.suspended_at);
  assert.match(reference, /up to \*\*3 attempts\*\*/);
  assert.match(reference, /every \*\*30 seconds\*\*/);
  assert.doesNotMatch(reference, /"type": "withdrawal"|"type_name": "Withdrawal"/);
});
