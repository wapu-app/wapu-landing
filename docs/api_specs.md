# WapuPay API Reference

WapuPay is a platform that allows users to pay in local currency (ARS, BRL) using cryptocurrency (USDT) as the underlying asset. This document covers the full REST API.

**Swagger UI:** `https://<host>/apidocs/`
**OpenAPI spec:** `https://<host>/apispec_1.json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Format](#error-format)
4. [Endpoints](#endpoints)
   - [Utils](#utils)
   - [Auth & Session](#auth--session)
   - [API Token Management](#api-token-management)
   - [Users](#users)
   - [Transactions](#transactions)
   - [Wallet](#wallet)
   - [Contacts](#contacts)
   - [Lightning Address (LNURL)](#lightning-address-lnurl)
5. [Enums Reference](#enums-reference)
6. [Data Models](#data-models)

---

## Authentication

WapuPay supports two authentication schemes. Endpoints marked with `[JWT]` accept only JWT. Endpoints marked with `[JWT | API Key]` accept either — but **never both at once**.

### JWT (Bearer Token)

Obtained via `POST /users/login` or `POST /users/create`. Include in the header:

```
Authorization: Bearer <access_token>
```

Access tokens are short-lived. Use `GET /users/refresh` with the `refresh_cookie` to obtain a new one without re-authenticating.

### API Key (`X-API-Key`)

For server-to-server integrations. Users must have `api_enabled = true` (enabled by an admin). Generate a token via `POST /users/api-token` using JWT auth.

```
X-API-Key: <api_token>
```

**Rules:**
- If both `Authorization` and `X-API-Key` are sent → `400`
- If neither is sent on a protected endpoint → `401`
- If `api_enabled = false` for the user → `403`
- If token is revoked or invalid → `401`

---

## Rate Limiting

API Key requests are subject to a sliding-window rate limit:

| Limit | Window |
|-------|--------|
| 60 requests | 60 seconds |

Exceeding the limit returns `429 Too Many Requests`.

JWT requests are not rate limited by this mechanism.

---

## Error Format

All error responses return a JSON object:

```json
{
  "error": "Human-readable error message"
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| `400` | Bad request / missing or invalid parameters |
| `401` | Authentication credentials missing or invalid |
| `403` | Authenticated but not authorized (e.g. `api_enabled=false`) |
| `404` | Resource not found |
| `429` | Rate limit exceeded (API Key only) |
| `500` | Internal server error |

---

## Endpoints

---

### Utils

#### `GET /ping`

Health check. No authentication required.

**Response `200`:**
```json
{
  "message": "pong"
}
```

---

#### `GET /exchange-rates`

Get current exchange rates. No authentication required.

**Response `200`:**
```json
{
  "rates": [
    { "pair": "USDT/ARS", "buy": 1569.99, "sell": 1585.25 },
    { "pair": "USDT/BRL", "buy": 5.21, "sell": 5.33 },
    { "pair": "BTC/USD", "buy": 68100.00, "sell": 70200.00 },
    { "pair": "BTC/ARS", "buy": 106925000.00, "sell": 110220000.00 }
  ]
}
```

---

#### `GET /countries`

List of all supported countries. No authentication required.

**Response `200`:**
```json
[
  { "id": 1, "name": "Argentina", "code": "AR" },
  { "id": 2, "name": "Brazil", "code": "BR" }
]
```

---

#### `GET /settings`

Application-wide settings. No authentication required.

**Response `200`:**
```json
{
  "min_payment_amount_ars": 100,
  "min_pix_deposit_brl": 10,
  "minimum_withdrawal_amount_usdt": 5,
  "min_deposit_usdt": 5,
  "blockchains": ["TRON", "ETHEREUM", "BSC", "POLYGON"],
  "pix_key": "pix@example.com",
  "pix_deposit_fee": 0.02
}
```

---

#### `GET /file/<path:key>`

Download a file from S3 storage (KYC images, receipts). Requires `[JWT]`.

**Path param:** `key` — S3 object key.

**Response `200`:** Binary file stream.

---

### Auth & Session

#### `POST /users/create`

Create a new user account. Returns JWT access token + sets `refresh_cookie` (HttpOnly).

**Request body (JSON):**
```json
{
  "username": "demo_user",
  "email": "customer_demo@example.com",
  "password": "SecurePass123!",
  "phone": 5491155556666,
  "referral_code": "REF123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | yes | 3–20 characters |
| `email` | string | yes | Valid email |
| `password` | string | yes | Plain text (hashed server-side) |
| `phone` | integer | no | Phone number |
| `referral_code` | string | no | Referral code from an existing user |

**Response `201`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Sets `Set-Cookie: refresh_cookie=<refresh_token>; HttpOnly; Secure; SameSite=None`

---

#### `POST /users/login`

Authenticate user. Returns JWT access token + sets `refresh_cookie`.

**Request body (JSON):**
```json
{
  "email": "customer_demo@example.com",
  "password": "SecurePass123!"
}
```

Or, to log in via a magic-link temporary password:
```json
{
  "temp_password": "<token_from_login_email>"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Sets `Set-Cookie: refresh_cookie=<refresh_token>; HttpOnly; Secure; SameSite=Strict`

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"User info incomplete"` |
| `401` | `"Invalid credentials"` |

---

#### `GET /users/refresh`

Generate a new access token using the `refresh_cookie`. No body needed.

**Cookie required:** `refresh_cookie=<refresh_token>`

**Response `200`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"no refresh cookie is present"` |
| `400` | `"refresh cookie not valid"` |

---

#### `POST /users/logout`

Clear the refresh token cookie.

**Response `200`:**
```json
{
  "message": "User logged out successfully"
}
```

Sets `Set-Cookie: refresh_cookie=; Max-Age=0`

---

#### `POST /users/send-verification-email`

Send an email verification link. No authentication required.

**Request body (JSON):**
```json
{
  "email": "customer_demo@example.com"
}
```

**Response `200`:** `{}`

---

#### `GET /users/verify-email/<verification_code>`

Verify email using token received by email.

**Path param:** `verification_code` — Token from the email link.

**Response `200`:**
```json
{
  "email_verified": true
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"Verification code not valid. Please, ask for a new code."` |

---

#### `POST /users/send-recovery-email`

Send a password recovery email. No authentication required.

**Request body (JSON):**
```json
{
  "email": "customer_demo@example.com"
}
```

**Response `200`:** `{}`

---

#### `POST /users/password-recovery/<verification_code>`

Reset password using recovery token.

**Path param:** `verification_code` — Token from the recovery email.

**Request body (JSON):**
```json
{
  "password": "NewSecurePass456!"
}
```

**Response `200`:**
```json
{
  "password_reset": true
}
```

---

#### `POST /users/send-login-email`

Send a magic-link login email (passwordless). No authentication required. Email must be verified.

**Request body (JSON):**
```json
{
  "email": "customer_demo@example.com"
}
```

**Response `200`:** `{}`

---

#### `POST /users/usertag`

Check if a username is valid and available. No authentication required.

**Request body (JSON):**
```json
{
  "username": "demo_user"
}
```

**Response `200`:**
```json
{
  "is_valid": true
}
```

**Validation:** 3–20 characters, must be unique.

---

### API Token Management

All endpoints in this section require `[JWT]` auth. The user's `api_enabled` flag must be `true` to generate a token.

#### `POST /users/api-token`

Generate or rotate the user's API token. The plaintext token is returned **only once**. If a token already exists, it is rotated (same DB record, new value).

**Auth:** `[JWT]` + `api_enabled = true`

**Response `201`:**
```json
{
  "token": "xK9mP2qL8rN5tW3uY7vZ0aB4cD6eF1g",
  "token_prefix": "xK9mP2qL8r",
  "message": "API token generated"
}
```

> Store `token` securely — it will never be shown again.

**Errors:**

| Status | Message |
|--------|---------|
| `403` | `"API token access is not enabled for this user"` |

---

#### `DELETE /users/api-token`

Revoke the user's current API token. Takes effect immediately.

**Auth:** `[JWT]`

**Response `200`:**
```json
{
  "message": "API token revoked"
}
```

---

#### `GET /users/api-token/status`

Check current API token status without exposing the token.

**Auth:** `[JWT | API Key]`

**Response `200`:**
```json
{
  "has_token": true,
  "is_active": true,
  "last_used_at": "2026-03-15T14:30:00Z",
  "token_prefix": "xK9mP2qL8r"
}
```

If no token has ever been created:
```json
{
  "has_token": false,
  "is_active": false,
  "last_used_at": null,
  "token_prefix": null
}
```

---

#### `POST /users/b2b`

Create a B2B sub-user for the authenticated account.

**Auth:** `[JWT | API Key]`

**Request body (JSON):**
```json
{
  "email": "subuser@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Sub-user email |

**Response `201`:** Created sub-user.

---

#### `POST /users/b2b/<user_uuid>/api-token`

Create an API token for a B2B sub-user.

**Auth:** `[JWT | API Key]`

**Path param:** `user_uuid` — Sub-user UUID.

**Response `201`:** API token response.

---

#### `DELETE /users/b2b/<user_uuid>/api-token`

Revoke the API token for a B2B sub-user.

**Auth:** `[JWT | API Key]`

**Path param:** `user_uuid` — Sub-user UUID.

**Response `200`:** Token revoked.

---

### Users

#### `GET /users/home`

Get all home screen data: balance, rates, settings, KYC status.

**Auth:** `[JWT | API Key]`

**Response `200`:**
```json
{
  "id": 42,
  "username": "demo_user",
  "email": "customer_demo@example.com",
  "kyc_status": "ACCEPTED",
  "combined_balance": 124550.00,
  "combined_balance_currency": "ARS",
  "wallets_balance": [
    {
      "balance": 100.00,
      "currency": "USDT"
    }
  ],
  "settings": {
    "pix_key": "pix@example.com",
    "min_pix_deposit_brl": 10.0,
    "pix_deposit_fee": 0.02,
    "minimum_withdrawal_amount_usdt": 5.0,
    "min_deposit_usdt": 5.0,
    "min_payment_amount_ars": 100.0,
    "blockchains": ["TRON", "ETHEREUM", "BSC"],
    "fiat_transfer_fee": 0.015,
    "fast_fiat_transfer_fee": 0.02,
    "webapp_design": "default",
    "referral_reward_fee_percentage": 0.005,
    "discount_referrals_percentage": 0.005,
    "referral_rewards_days": 30,
    "discount_referrals_days": 30,
    "beta_version": false,
    "features": {
      "alternative_deposit": true,
      "pix_deposit": true,
      "fast_fiat_transfer": true,
      "fiat_transfer": true,
      "deposit": true,
      "send_inner_transf": true,
      "edit_profile": true,
      "show_recent_fav_contacts": true,
      "pwa_pop_up": false,
      "lightning_deposit": true
    }
  },
  "rates": [
    { "pair": "USDT/ARS", "buy": 1569.99, "sell": 1585.25 },
    { "pair": "USDT/BRL", "buy": 5.21, "sell": 5.33 },
    { "pair": "BTC/USD", "buy": 68100.00, "sell": 70200.00 },
    { "pair": "BTC/ARS", "buy": 106925000.00, "sell": 110220000.00 }
  ]
}
```

**`kyc_status` values:** `"Incomplete"`, `"PENDING"`, `"ACCEPTED"`, `"REJECTED"`, `"INCOMPLETE"`

---

#### `GET /users/spending-limit`

Get the user's monthly spending limits based on their KYC tier.

**Auth:** `[JWT | API Key]`

**Response `200`:**
```json
{
  "kyc_tier": 1,
  "current_limit": 500.00,
  "spended": 123.45,
  "available": 376.55
}
```

> All amounts in USDT.

---

#### `GET /users/profile`

Get the user's profile data.

**Auth:** `[JWT]`

**Response `200`:**
```json
{
  "username": "demo_user",
  "phone": "5491155556666",
  "telegram": "demo_user_tg",
  "email": "customer_demo@example.com",
  "beta_version": 0
}
```

---

#### `PATCH /users/profile`

Update the user's profile.

**Auth:** `[JWT]`

**Request body (JSON):** All fields optional.
```json
{
  "username": "newusername",
  "telegram": "my_telegram_handle",
  "phone": "5491155556666",
  "beta_version": "1"
}
```

**Response `200`:**
```json
{
  "username": "newusername",
  "phone": "5491155556666",
  "telegram": "my_telegram_handle",
  "email": "customer_demo@example.com"
}
```

---

#### `GET /users/user-settings`

Get user preferences.

**Auth:** `[JWT | API Key]`

**Response `200`:**
```json
{
  "language": "EN",
  "beta_version": false,
  "favorite_currency": "USD"
}
```


---

#### `PATCH /users/user-settings`

Update user preferences.

**Auth:** `[JWT | API Key]`

**Request body (JSON):** All fields optional.
```json
{
  "language": "ES",
  "beta_version": true,
  "favourite_currency": "ARS"
}
```

**Response `200`:**
```json
{
  "message": "User settings updated successfully"
}
```

---

#### `POST /users/referral`

Get or create a referral link for the current user.

**Auth:** `[JWT]`

**Request body (JSON):**
```json
{
  "email": "friend@example.com",
  "phone": "5491155556666"
}
```

**Response `200`:**
```json
{
  "referral_link": "https://example.com/signup?ref=DEMO123",
  "referral_code": "ABC123"
}
```

---

### Transactions

#### Transaction Object

All transaction endpoints return objects of this shape:

```json
{
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Pending",
  "type": "fiat_transfer",
  "type_name": "Fiat Transfer",
  "is_positive": false,
  "payment_amount": 100.00,
  "payment_currency": "ARS",
  "currency_taken": "USDT",
  "total_amount_taken": 0.0803,
  "fee_taken": 0.0012,
  "current_rate": 1245.50,
  "alias": "alias.demo.cvu",
  "receiver_name": "Receiver Example",
  "network": null,
  "address_destination": null,
  "blockchain_trx_id": null,
  "lnurl_pr_invoice": null,
  "lnurl_verify_invoice": null,
  "note": null,
  "username": "demo_user",
  "sender_username": null,
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:01:00Z"
}
```

> Transaction objects use display units: fiat/USDT amounts are decimals; SAT/LBTC amounts can be raw sats depending on the field and transaction direction. Direct-fiat **purchase order** objects are a separate contract and use integer base units, as documented below.

---

#### `GET /transactions/<id>`

Get a single transaction by UUID or numeric ID.

**Auth:** `[JWT | API Key]`

**Path param:** `id` — UUID (e.g. `123e4567-e89b-12d3-a456-426614174000`) or numeric ID.

**Response `200`:** Transaction detail object. Direct-fiat-linked funding, executed and refund transactions include the owning `tentative_id`. Liquid transactions include `asset_id`; when a chain txid exists, `blockchain_scan_url` links to the first txid if multiple are stored. These extra detail fields are not added to the transaction list.

For a Lightning purchase withdrawal (`executed_transaction_id`), `payment_amount` is the delivered sats, `fee_taken` is sats and `total_amount_taken` is decimal USDT. Example excerpt:

```json
{
  "transaction_id": "00000000-0000-4000-8000-000000000102",
  "tentative_id": "00000000-0000-4000-8000-000000000100",
  "type": "withdraw",
  "status": "Completed",
  "network": "LIGHTNING",
  "currency_taken": "SAT",
  "payment_amount": 10000,
  "fee_taken": 200,
  "total_amount_taken": 5.10
}
```

Liquid deposit example:

```json
{
  "transaction_id": "5c2f5ac1-85b5-4d9f-8b8f-b2b9a53e804d",
  "status": "Completed",
  "type": "deposit",
  "is_positive": true,
  "payment_amount": 999455,
  "payment_currency": "SAT",
  "currency_taken": "LBTC",
  "network": "LIQUID",
  "asset_id": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
  "address_destination": "lq1qqp5z8vdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqp",
  "created_at": "2026-07-25T18:38:53Z",
  "updated_at": "2026-07-25T18:40:10Z"
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `404` | `"Transaction not found"` |

> If the transaction is a Lightning deposit with `Pending` status, the invoice is checked in real-time and may return `Completed`.

---

#### `GET /transactions/my-transactions`

Without `page` or `per_page`, get all transactions for the effective user, newest first, preserving the legacy response below (no swaps, no `kind`, no `pagination`).

Sending **either** query parameter enables merged paginated history:

| Parameter | Type | Default | Range |
|-----------|------|---------|-------|
| `page` | integer | 1 | ≥ 1 |
| `per_page` | integer | 7 | 1–50 |

Invalid values return `400`, not silently clamped results. Paginated items are basic transaction objects with `kind=transaction`, or public swap objects with `kind=swap`, ordered newest first across both types. Deposits already represented by historical swaps are excluded to avoid duplicate entries. Direct-fiat purchases are not swaps: use the tentative list/detail to follow the complete purchase.

The response keeps the `transactions` array and adds `pagination` with `page`, `per_page`, `total`, `total_pages`, `has_next`, and `has_prev`. An empty history has `transactions=[]`, `total=0`, `total_pages=0`. Transaction-detail-only fields such as `tentative_id` and Liquid navigation links are not added here. B2B callers may use `X-Wapu-User-Id` for an owned sub-user.

**Paginated response excerpt:**

```json
{
  "transactions": [
    { "kind": "transaction", "transaction_id": "00000000-0000-4000-8000-000000000102", "status": "Completed", "type": "withdraw" },
    { "kind": "swap", "swap_id": "00000000-0000-4000-8000-000000000200", "status": "COMPLETED", "from": "LBTC", "to": "USDT_LIQUID" }
  ],
  "pagination": { "page": 1, "per_page": 7, "total": 2, "total_pages": 1, "has_next": false, "has_prev": false }
}
```

**Auth:** `[JWT | API Key]`

**Response `200`:**
```json
{
  "transactions": [
    {
      "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "Completed",
      "type": "fiat_transfer",
      "type_name": "Fiat Transfer",
      "is_positive": false,
      "payment_amount": 10000.00,
      "payment_currency": "ARS",
      "currency_taken": "USDT",
      "total_amount_taken": 8.03,
      "fee_taken": 0.12,
      "current_rate": 1245.50,
      "alias": "alias.demo.cvu",
      "receiver_name": "Receiver Example",
      "created_at": "2026-03-20T09:00:00Z",
      "updated_at": "2026-03-20T09:30:00Z"
    }
  ]
}
```

---

#### `POST /transactions/create`

Create a new outgoing payment transaction.

**Auth:** `[JWT | API Key]`

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | `"fiat_transfer"` or `"fast_fiat_transfer"` |
| `payment_amount` | number | yes | Amount in ARS |
| `currency_taken` | string | yes | Always `"USDT"` in current version |
| `alias` | string | conditional | Bank alias/CBU — required for `fiat_transfer` and `fast_fiat_transfer` |
| `receiver_name` | string | no | Recipient name |

**Example — fiat_transfer:**
```
POST /transactions/create
Content-Type: multipart/form-data

type=fiat_transfer
payment_amount=10000
currency_taken=USDT
alias=alias.demo.cvu
receiver_name=Receiver Example
```


**Response `201`:** Transaction object (see above).

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"Transaction info incomplete"` |
| `400` | `"Alias/CBU is required"` |
| `400` | `"Insufficient funds"` |
| `400` | `"Minimum amount is $<N> ARS"` |
| `400` | `"Maximum amount limit per month is <N> ARS, or <N> USD for KYC level <N>. ..."` |

---

#### `PATCH /transactions/<transaction_id>`

Update a transaction's status (e.g. to cancel it).

**Auth:** `[JWT | API Key]`

**Path param:** `transaction_id` — UUID of the transaction.

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | yes | New status. Currently only `"CANCELED"` is user-actionable. |

**Example:**
```
PATCH /transactions/123e4567-e89b-12d3-a456-426614174000
Content-Type: multipart/form-data

status=CANCELED
```

**Response `200`:** Updated transaction object.

---

#### `POST /transactions/tentative-amount`

Calculate the USDT cost, fee, and total for a hypothetical transaction — without creating it.

**Auth:** `[JWT | API Key]`

**Request body (JSON):**
```json
{
  "amount": 10000,
  "currency_payment": "ARS",
  "currency_taken": "USDT",
  "type": "fiat_transfer",
  "alias": "alias.demo.cvu"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | yes | Amount in `currency_payment` |
| `currency_payment` | string | yes | `"ARS"`, `"BRL"`, `"USD"` |
| `currency_taken` | string | yes | `"USDT"`, `"SAT"` |
| `type` | string | yes | Transaction type (see enum) |
| `alias` | string | no | Optional alias/CBU used for fiat transfer validation |

**Response `200`:**
```json
{
  "usdt_amount": 8.03,
  "fee": 0.12,
  "total_amount": 8.15,
  "exchange_rate": 1245.50
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"Invalid transaction type"` |
| `400` | `"Currency <X> not supported"` |

---

#### `POST /transactions/inner-transfer`

Transfer USDT directly to another WapuPay user by username.

**Auth:** `[JWT | API Key]`

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | yes | Amount in USDT |
| `currency` | string | yes | `"USDT"` |
| `receiver_username` | string | yes | Target user's username |

**Example:**
```
POST /transactions/inner-transfer
Content-Type: multipart/form-data

amount=10
currency=USDT
receiver_username=customer_demo
```

**Response `201`:** Transaction object for the sender's debit transaction.

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"Receiver username does not exist."` |
| `400` | `"Sender does not have enough balance."` |

---

#### ARS → Lightning: direct-fiat crypto purchases

Use `type=crypto_purchase` on the existing direct-fiat routes to buy sats with an ARS bank transfer and receive them at an external **Lightning Address**. This is not a Lightning deposit or a swap. The existing crypto → ARS payment flow remains available on the same routes.

**Auth:** `[JWT | API Key]`, never both headers. On all seven transaction/direct-fiat operations documented here, business callers may send `X-Wapu-User-Id: <owned-sub-user-uuid>` to operate for that sub-user. Other callers operate as themselves. Detail and list requests are scoped to the effective user.

**Happy path:** quote → create tentative → issue bank instructions → transfer the exact ARS amount → poll the tentative until resolved. All amounts, addresses, deadlines and fees below are fictional examples, not current quotes or payable instructions.

##### Purchase request and units

| Field | Meaning |
|-------|---------|
| `type` | `crypto_purchase` |
| `payout_currency` / `payout_network` | `SAT` / `LIGHTNING` for Lightning delivery |
| `amount_ars_cents` | Positive integer ARS cents to spend; `780000` means ARS 7,800 |
| `amount_out` | Positive integer output; for Lightning, sats to receive |
| `payout_address` | Required on creation: Lightning Address such as `buyer@example.com`, **not** a BOLT11 invoice or encoded LNURL |

Send **exactly one** of `amount_ars_cents` or `amount_out`. Query values must be plain positive digits; JSON body values must be integers, not strings, decimals or booleans. Do not reuse `amount_ars`, `funding_currency`, `funding_network` or the recipient `alias` of crypto → ARS payments for a purchase. A purchase does not deduplicate creation by `external_reference`.

Other supported payout pairs are `SAT/BITCOIN`, `LBTC/LIQUID`, `USDT/LIQUID`, `USDT/POLYGON` and `USDT/ETHEREUM`; this walkthrough focuses on Lightning. SAT/LBTC outputs and network fees use sats; USDT outputs and network fees use USDT cents.

**Purchase response units differ from crypto → ARS:** `amount_ars_cents` is ARS cents; `total_amount_usdt`, `fee_amount_usdt` and `funding_amount_usdt` are **USDT cents**, not decimal USDT. `amount_out` and `network_fee_out` use `amount_out_unit` (`sats` or `usdt_cents`). Do not feed purchase values into decimal-amount payment schemas.

##### 1. Quote without reserving funds

```http
GET /transactions/direct-fiat/quote?type=crypto_purchase&payout_currency=SAT&payout_network=LIGHTNING&amount_out=10000
X-API-Key: <api_token>
```

To quote by ARS input instead, replace `amount_out=10000` with `amount_ars_cents=780000`; do not send both. The response includes:

```json
{
  "type": "crypto_purchase",
  "direction": "ramp_on",
  "payout_currency": "SAT",
  "payout_network": "LIGHTNING",
  "amount_ars_cents": 780000,
  "amount_out": 10000,
  "amount_out_unit": "sats",
  "network_fee_out": 200,
  "total_amount_usdt": 520,
  "fee_amount_usdt": 10,
  "funding_amount_usdt": 510,
  "min_amount_ars_cents": 100000,
  "expiration_minutes": 15,
  "liquidity_ok": true
}
```

`liquidity_ok` is availability **at quote time**, not a reservation; `/funding` may still return `409`. `expiration_minutes` is the payment window **after bank instructions are issued**, not the lifetime of a newly created tentative. Both fields appear only on quotes.

##### 2. Create a purchase tentative

```http
POST /transactions/direct-fiat/tentatives
Content-Type: application/json
X-API-Key: <api_token>

{
  "type": "crypto_purchase",
  "payout_currency": "SAT",
  "payout_network": "LIGHTNING",
  "amount_out": 10000,
  "payout_address": "buyer@example.com"
}
```

**Response `201`:** purchase order with `tentative_id`, `status=CREATED`, `payout_status=waiting_ars`, frozen monetary terms and its persisted `expires_at` deadline. There is no assigned bank account yet: `alias` and `cvu` are absent, linked transaction IDs are null and `watch_pending=false`. That false value is not successful delivery: the next step is to issue funding instructions. The Lightning destination is validated before creation. The backend resolves invoices from the Lightning Address; clients do not supply an invoice.

A quote is informational; creation calculates and freezes the order's terms. **Every creation POST creates a new tentative.** Do not blindly replay creation after an uncertain response as if it were idempotent; inspect the tentative list to recover the operation.

##### 3. Issue bank instructions, then transfer exactly the returned amount

```http
POST /transactions/direct-fiat/tentatives/00000000-0000-4000-8000-000000000100/funding
X-API-Key: <api_token>
```

**Response `201`:** the same purchase shape with `status=FUNDING_ISSUED`, an assigned `alias`/`cvu`, a non-null `funding_transaction_id`, and the **final** `amount_ars_cents`. For example:

```json
{
  "tentative_id": "00000000-0000-4000-8000-000000000100",
  "status": "FUNDING_ISSUED",
  "payout_status": "waiting_ars",
  "amount_ars_cents": 780001,
  "amount_out": 10000,
  "amount_out_unit": "sats",
  "alias": "receiver.demo",
  "cvu": "0000000000000000000000",
  "expires_at": "2026-10-18T15:17:00Z",
  "late_watch_until": "2026-10-18T15:22:00Z",
  "watch_pending": true,
  "funding_transaction_id": "00000000-0000-4000-8000-000000000101",
  "executed_transaction_id": null
}
```

This is a **response excerpt**, not the full purchase object. Transfer ARS **7,800.01** in this example, not the quoted ARS 7,800: funding can add identification cents while preserving the crypto output. This endpoint returns bank instructions, **not a Lightning invoice**. It resets `expires_at` to the payment deadline; use that returned timestamp instead of computing one from the quote.

Replaying `/funding` for an already issued purchase preserves its assignment without duplicating reservations or extending the deadline. It returns the current order; bank instructions disappear after matching/final resolution. On an availability/contention `409`, retry later. If the fee has changed and the error requires a new quote, quote and create again rather than reusing obsolete terms.

##### 4. Track payment matching and Lightning delivery

```http
GET /transactions/direct-fiat/tentatives/00000000-0000-4000-8000-000000000100
X-API-Key: <api_token>
```

**Response `200`:** purchase order. The usual lifecycle is `CREATED → FUNDING_ISSUED → EXECUTED → COMPLETED`: after the ARS transfer is matched, the backend creates the withdrawal and sends the crypto. `EXECUTED` alone does not mean that Lightning was delivered.

| Field / value | Client behavior |
|---------------|-----------------|
| `watch_pending=true` | Keep polling, including when `status=EXPIRED`: reconciliation or a payout may still be unresolved |
| `payout_status=waiting_ars` | Awaiting the ARS transfer or completion of its reconciliation |
| `payout_status=sending` | ARS matched, payout still in progress |
| `payout_status=review` | Needs resolution; do not show successful delivery |
| `payout_status=completed` | External crypto delivery completed |
| `payout_status=settled_to_balance` | Credited to the buyer's Wapu USDT balance, **not** delivered via Lightning |
| `payout_status=expired` | Unpaid order with its reservation released |
| `payment_hash` / `txid` | Payment/chain reference when available; may be null |
| `error_code` | `payout_review`, `payout_not_sent`, or null; no internal provider diagnostics |
| `funding_transaction_id` | Public UUID of the credit transaction, created when bank instructions are issued |
| `executed_transaction_id` | Public UUID of the crypto withdrawal, created when the ARS transfer is matched |

Read linked transactions using `GET /transactions/<id>`. `alias` and `cvu` are only returned after funding and until the payment is matched, the order becomes final or an unpaid reservation is released. No receiver identity, credentials, internal ledger IDs or payout invoices are returned.

**Purchase errors:**

| HTTP status | Meaning / action |
|-------------|------------------|
| `400` | Invalid target, amount or destination; or expired tentative |
| `401` | Missing/invalid authentication |
| `403` | Operation not authorized for this account |
| `404` | Unknown tentative, or not owned by the effective user |
| `409` | No funding availability, contention, unusable order or changed network fee; follow the error before retrying |
| `422` | Amount cannot cover the network fee or exceeds a send limit |
| `429` | Quote/creation throttle, open-order cap or monthly purchase limit |
| `503` | Provider, fee estimate or Lightning Address temporarily unavailable |

#### `GET /transactions/direct-fiat/tentatives`

List **all** direct-fiat tentatives of the effective user, newest first and in every status. No pagination. Includes both existing crypto → ARS payments and ARS → crypto purchases.

**Auth:** `[JWT | API Key]`. Business callers may use `X-Wapu-User-Id` for an owned sub-user.

**Response `200`:** `{ "tentatives": [...] }`. Each item uses the appropriate payment or purchase schema, adds `created_at` in UTC, and includes public UUIDs of linked transactions. Payment items can also include `refund_transaction_id`; purchase items use `funding_transaction_id` and `executed_transaction_id`. Purchase bank instructions follow the same visibility rules as detail/funding responses.

---

#### `POST /transactions/direct-fiat/tentatives`

Create a direct-fiat tentative and freeze the quote. Supports crypto → ARS payments and ARS → crypto purchases. For `type=crypto_purchase`, use the [ARS → Lightning walkthrough](#ars--lightning-direct-fiat-crypto-purchases) above; the following request/response examples cover the existing crypto → ARS direction. This does not generate the funding transaction yet.

**Auth:** `[JWT | API Key]`

**Request body (JSON):**
```json
{
  "amount_ars": 15000,
  "type": "fiat_transfer",
  "alias": "alias.demo.cvu",
  "receiver_name": "Receiver Example",
  "funding_currency": "SAT",
  "network": "LIGHTNING"
}
```

For Liquid funding, send `"funding_currency": "LBTC"` or `"USDT"` with `"network": "LIQUID"`. Existing EVM funding networks remain supported where available. `funding_network` is accepted as an alias for `network`, but `network` takes precedence when both are sent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount_ars` | number | yes | Amount to pay in ARS |
| `type` | string | yes | `"fiat_transfer"` or `"fast_fiat_transfer"` |
| `alias` | string | no | Recipient alias/CBU/CVU |
| `receiver_name` | string | no | Recipient name |
| `funding_currency` | string | yes | `"SAT"`, `"LBTC"`, or `"USDT"` |
| `network` | string | conditional | Required for USDT, implied for SAT/LBTC. Canonical funding network: `"LIGHTNING"`, `"LIQUID"`, or a supported EVM network |
| `funding_network` | string | no | Accepted alias for `network`; `network` wins when both are sent |
| `refund_address` | string | no | Optional refund address |
| `external_reference` | string | no | External reference/idempotency identifier |

**Response `201`:**
```json
{
  "amount_ars": 15000.0,
  "exchange_rate": 1569.99,
  "expires_at": "2026-07-25 21:17:18",
  "fee_amount_usdt": 0.29,
  "funding_amount_usdt": 9.55,
  "funding_currency": "SAT",
  "funding_network": "LIGHTNING",
  "status": "CREATED",
  "tentative_id": "3f6b8e2a-8f4c-4d3b-9f62-7d4f21c8a901",
  "total_amount_sats": 15090,
  "total_amount_usdt": 9.84
}
```

---

#### `GET /transactions/direct-fiat/tentatives/<tentative_id>`

Get the status of a direct-fiat tentative. For purchases, use the [purchase order contract and polling rules](#4-track-payment-matching-and-lightning-delivery) above. The examples below show the existing crypto → ARS payment schema.

**Auth:** `[JWT | API Key]`

**Path param:** `tentative_id` — Tentative UUID.

**Response `200`:** Direct-fiat tentative status object. A Lightning tentative returns SAT totals:

```json
{
  "amount_ars": 15000.0,
  "exchange_rate": 1569.99,
  "expires_at": "2026-07-25 21:17:18",
  "fee_amount_usdt": 0.29,
  "funding_amount_usdt": 9.55,
  "funding_currency": "SAT",
  "funding_network": "LIGHTNING",
  "funding_transaction_id": null,
  "executed_transaction_id": null,
  "status": "CREATED",
  "tentative_id": "3f6b8e2a-8f4c-4d3b-9f62-7d4f21c8a901",
  "total_amount_sats": 15090,
  "total_amount_usdt": 9.84
}
```

A Liquid tentative also returns the funded asset identifier:

```json
{
  "address_destination": "lq1qqp5z8vdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqp",
  "amount_ars": 991752.44,
  "asset_id": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
  "exchange_rate": 1569.1,
  "funding_currency": "LBTC",
  "funding_network": "LIQUID",
  "status": "CREATED",
  "tentative_id": "9c8b99f7-3b09-4a6e-bf7b-75e4cb8dfdb4",
  "total_amount_sats": 999455,
  "total_amount_usdt": 651.01
}
```

---

#### `POST /transactions/direct-fiat/tentatives/<tentative_id>/funding`

Generate funding instructions for a direct-fiat tentative. For purchases, returns the bank alias/CVU and final ARS cents to transfer, as described [above](#3-issue-bank-instructions-then-transfer-exactly-the-returned-amount). The invoice/address examples below apply only to the existing crypto → ARS payment direction.

**Auth:** `[JWT | API Key]`

**Path param:** `tentative_id` — Tentative UUID.

**Response `201`:** Funding instructions. A Lightning response contains a synthetic BOLT11-shaped invoice and a non-live verification URL:

```json
{
  "amount_ars": 15000.0,
  "funding_currency": "SAT",
  "funding_network": "LIGHTNING",
  "funding_transaction_id": "4bbfbc7f-bb5f-41ed-8657-ef2d4e60c019",
  "lightning_pr": "lnbc150900n1p4x25qvpp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  "lightning_verify_url": "https://example.com/lnurl/verify/demo-token",
  "status": "FUNDING_ISSUED",
  "tentative_id": "3f6b8e2a-8f4c-4d3b-9f62-7d4f21c8a901",
  "total_amount_sats": 15090,
  "total_amount_usdt": 9.84
}
```

Liquid funding returns `asset_id` and a synthetic Liquid address:

```json
{
  "address_destination": "lq1qqp5z8vdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqp",
  "amount_ars": 991752.44,
  "asset_id": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
  "funding_currency": "LBTC",
  "funding_network": "LIQUID",
  "funding_transaction_id": "db0a74a8-8df6-453b-a97e-b2e8426b3cd1",
  "status": "FUNDING_ISSUED",
  "tentative_id": "9c8b99f7-3b09-4a6e-bf7b-75e4cb8dfdb4",
  "total_amount_sats": 999455,
  "total_amount_usdt": 651.01
}
```

---

#### `GET /transactions/direct-fiat/quote`

Return a current direct-fiat quote without creating a tentative. For `type=crypto_purchase`, send payout target and exactly one integer amount as described [above](#1-quote-without-reserving-funds). The parameters and examples below apply to the existing crypto → ARS direction.

**Auth:** `[JWT | API Key]`

**Query parameters (crypto → ARS):** `amount_ars`, `funding_currency` (`SAT`, `LBTC`, or `USDT`) and `type`. `funding_network` can be omitted for SAT/LBTC (implied LIGHTNING/LIQUID); it is required for USDT. A supplied network must match the selected asset.

**Response `200` — SAT over Lightning:**
```json
{
  "amount_ars": 25000.0,
  "fee_amount_usdt": 0.8,
  "fee_rate": 0.05,
  "funding_amount_usdt": 15.92,
  "funding_currency": "SAT",
  "funding_network": "LIGHTNING",
  "total_amount_sats": 25641,
  "total_amount_usdt": 16.72,
  "type": "fast_fiat_transfer",
  "usdt_ars_rate": 1569.99
}
```

**Response `200` — USDT over Liquid:**
```json
{
  "amount_ars": 25000.0,
  "fee_amount_usdt": 0.8,
  "fee_rate": 0.05,
  "funding_amount_usdt": 15.92,
  "funding_currency": "USDT",
  "funding_network": "LIQUID",
  "total_amount_usdt": 16.72,
  "type": "fast_fiat_transfer",
  "usdt_ars_rate": 1569.99
}
```

---

### Wallet

#### `POST /wallet/deposit`

Initiate a cryptocurrency deposit to the user's wallet.

**Auth:** `[JWT | API Key]`

**Request body (JSON):**
```json
{
  "amount": 50.0,
  "currency": "USDT",
  "network": "TRON"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `amount` | number | yes | Minimum: 1 USD or equivalent |
| `currency` | string | yes | `"USDT"`, `"USDC"` |
| `network` | string | yes | `"ETHEREUM"`, `"BSC"`, `"POLYGON"`, `"ARBITRUM"`, `"OPTIMISM"`, `"AVAX"`, `"TRON"`, `"SOLANA"`, `"BINANCE_ID"`, `"LIQUID"` |

**Response `201`:** Transaction object with `type: "deposit"` and `status: "Pending"`.

```json
{
  "transaction_id": "abc12345-...",
  "status": "Pending",
  "type": "deposit",
  "type_name": "Deposit",
  "is_positive": true,
  "payment_amount": 50.00,
  "payment_currency": "USDT",
  "currency_taken": "USDT",
  "total_amount_taken": 50.00,
  "fee_taken": 0.00,
  "network": "TRON",
  "address_destination": "TXyz1234...",
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:00:00Z"
}
```

> The deposit is set to `PENDING` until an admin confirms receipt on-chain. The address to send funds to is the platform's TRON/network address (configured per network).

---

#### `POST /wallet/deposit-lightning`

Initiate a SAT deposit via the Lightning Network. Returns a Lightning invoice. `currency` is accepted for compatibility, but the deposit is processed as SAT.

**Auth:** `[JWT | API Key]`

**Request body (JSON):**
```json
{
  "amount": 100000,
  "currency": "SAT"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
|`amount` | number | yes | Amount in SAT or USD |
| `currency` | string | no | `"SAT"` or `"USD"` SAT by default |

**Response `201`:** Transaction object with `type: "deposit"`, `network: "LIGHTNING"`, and:
```json
{
  "transaction_id": "def45678-...",
  "status": "Pending",
  "type": "deposit",
  "network": "LIGHTNING",
  "lnurl_pr_invoice": "lnbc100u1p3...",
  "lnurl_verify_invoice": "https://example.com/lnurl/verify/demo-token",
  "payment_amount": 0.00,
  "total_amount_taken": 100000,
  "currency_taken": "SAT",
  "created_at": "2026-03-28T10:00:00Z"
}
```

> Pay the `lnurl_pr_invoice` in a Lightning wallet. The deposit is auto-confirmed when paid.

---

#### `POST /wallet/withdraw`

Initiate a cryptocurrency withdrawal to an external address.

**Auth:** `[JWT | API Key]`

**Request body (JSON):**
```json
{
  "address": "TXyz1234567890abcdef",
  "network": "TRON",
  "currency": "USDT",
  "amount": 20.0,
  "receiver_name": "Receiver Example"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | yes | Destination blockchain address |
| `network` | string | yes | See network enum |
| `currency` | string | yes | `"USDT"`, `"USDC"` |
| `amount` | number | yes | Amount to withdraw |
| `receiver_name` | string | no | Recipient name for record-keeping |

**Response `201`:** Transaction object with `type: "withdrawal"` and `status: "Pending"`.

```json
{
  "transaction_id": "ghi89012-...",
  "status": "Pending",
  "type": "withdrawal",
  "type_name": "Withdrawal",
  "is_positive": false,
  "payment_amount": 20.00,
  "currency_taken": "USDT",
  "network": "TRON",
  "address_destination": "TXyz1234567890abcdef",
  "receiver_name": "Receiver Example",
  "created_at": "2026-03-28T10:00:00Z"
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"Withdrawal info incomplete"` |

---

### Contacts

#### `GET /contacts`

Get the current user's contacts.

**Auth:** `[JWT | API Key]`

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `filter_type` | string | Optional. Filter by contact type (e.g. `"favourite"`, `"recent"`) |

**Response `200`:**
```json
{
  "contacts": [
    {
      "id": 1,
      "name_label": "Jane",
      "name_label_id": 55,
      "network": "TRON",
      "wallet_address": "TXyz1234...",
      "bank_alias": null,
      "is_favourite": true,
      "created_at": "2026-01-10T08:00:00Z"
    },
    {
      "id": 2,
      "name_label": "My Bank",
      "name_label_id": null,
      "network": null,
      "wallet_address": null,
      "bank_alias": "alias.demo.cvu",
      "is_favourite": false,
      "created_at": "2026-02-20T12:00:00Z"
    }
  ]
}
```

---

#### `POST /contacts/is-favourite`

Mark or unmark a contact as favourite.

**Auth:** `[JWT | API Key]`

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contact_id` | integer | yes | ID of the contact |
| `is_favourite` | string | yes | `"true"` or `"false"` |

**Response `200`:**
```json
{
  "contact": {
    "id": 1,
    "name_label": "Jane",
    "is_favourite": true,
    "created_at": "2026-01-10T08:00:00Z"
  }
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"The contact_id is invalid."` |
| `400` | `"You have to send true or false option."` |
| `404` | `"Contact not found."` |

---

#### `DELETE /contacts/<contact_id>`

Delete a contact.

**Auth:** `[JWT | API Key]`

**Path param:** `contact_id` — Numeric ID.

**Response `200`:**
```json
{
  "message": "The contact has been deleted."
}
```

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"The contact_id is invalid."` |
| `404` | `"Contact not found."` |

---

### Lightning Address (LNURL)

WapuPay supports the LNURL-pay protocol. Any user's Lightning Address is `<username>@wapu.app`.

#### `GET /.well-known/lnurlp/<username>`

LNURL-pay metadata. Used by Lightning wallets to discover payment parameters.

**No authentication required.**

**Path param:** `username` — WapuPay username.

**Response `200`:**
```json
{
  "tag": "payRequest",
  "callback": "https://example.com/lnurl/demo_user/callback",
  "minSendable": 1000,
  "maxSendable": 10000000000,
  "metadata": "[[\"text/plain\",\"Pay demo_user via WapuPay\"]]",
  "allowsNostr": true,
  "nostrPubkey": "..."
}
```

---

#### `GET /lnurlp/<username>`

LNURL-pay metadata by username. No authentication required.

**Path param:** `username` — WapuPay username.

**Response `200`:** LNURL metadata object.

---

#### `GET /lnurlp/<username>/callback`

Generate a Lightning invoice for the given user. Called by the payer's wallet after fetching metadata.

**No authentication required.**

**Path param:** `username` — WapuPay username.

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | integer | yes | Amount in millisatoshis |

**Response `200`:**
```json
{
  "pr": "lnbc100u1p3...",
  "routes": [],
  "verify": "https://example.com/lnurl/verify/demo-token"
}
```

---

## Enums Reference

### Transaction Status (`StatusEnum`)

| Value | Description |
|-------|-------------|
| `Pending` | Awaiting processing |
| `Completed` | Successfully processed |
| `Processing` | Assigned to a payer (QR flow) |
| `Canceled` | Canceled by user or system |
| `User Pending Action` | Waiting for user confirmation |
| `Paid` | Marked paid |

Transaction objects serialize these display values. Direct-fiat tentative `status` is a separate contract with uppercase values such as `CREATED` and `COMPLETED`.

History items with `kind=swap` use **SwapStatusEnum**, not Transaction status: `WAITING_DEPOSIT`, `CONFIRMING`, `SENDING`, `COMPLETED`, `EXPIRED`, `REFUNDING`, `REFUNDED`, `FAILED`. Purchase `payout_status` is another contract and keeps lowercase values such as `completed`. Status comparisons are case-sensitive; do not normalize these fields globally.

Request versus response also matters: the existing `PATCH /transactions/<transaction_id>` request can send the enum name `CANCELED`, while the returned transaction serializes `Canceled`.

### Transaction Type (`TransactionTypeEnum`)

| Value | `is_positive` | Description |
|-------|--------------|-------------|
| `fiat_transfer` | `false` | Standard bank transfer in local currency |
| `fast_fiat_transfer` | `false` | Faster bank transfer (higher fee) |
| `deposit` | `true` | Cryptocurrency deposit to wallet |
| `withdrawal` | `false` | Cryptocurrency withdrawal to external address |
| `send_inner_transf` | `false` | Internal transfer sent to another user |
| `receive_inner_transf` | `true` | Internal transfer received from another user |
| `pix_deposit` | `true` | PIX deposit (Brazil) |

### Currency (`CurrencyEnum`)

`USDT`, `USDC`, `ARS`, `BRL`, `BTC`, `SAT`, `USD`

### Network (`NetworkEnum`)

`ETHEREUM`, `BSC`, `POLYGON`, `ARBITRUM`, `OPTIMISM`, `AVAX`, `TRON`, `SOLANA`, `LIGHTNING`, `BINANCE_ID`, `LIQUID`

### User Status (`UserStatusEnum`)

`PENDING`, `ACTIVE`, `DISABLED`, `DELETED`

---

## Data Models

### User (summary)

```json
{
  "id": 42,
  "username": "demo_user",
  "email": "customer_demo@example.com",
  "kyc_tier": 1,
  "is_active": true,
  "email_verified": true,
  "telegram_username": "demo_user_tg",
  "state": "ACTIVE",
  "api_enabled": true
}
```

### Transaction (full)

```json
{
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Completed",
  "type": "fiat_transfer",
  "type_name": "Fiat Transfer",
  "is_positive": false,
  "payment_amount": 10000.00,
  "payment_currency": "ARS",
  "currency_taken": "USDT",
  "total_amount_taken": 8.03,
  "fee_taken": 0.12,
  "current_rate": 1245.50,
  "alias": "alias.demo.cvu",
  "receiver_name": "Receiver Example",
  "network": null,
  "address_destination": null,
  "source_address": null,
  "blockchain_trx_id": null,
  "lnurl_pr_invoice": null,
  "lnurl_verify_invoice": null,
  "note": null,
  "receipt_image_url": null,
  "username": "demo_user",
  "sender_username": null,
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:30:00Z"
}
```

### API Token Status

```json
{
  "has_token": true,
  "is_active": true,
  "last_used_at": "2026-03-28T09:15:00Z",
  "token_prefix": "xK9mP2qL8r"
}
```

### Contact

```json
{
  "id": 1,
  "name_label": "Jane",
  "name_label_id": 55,
  "network": "TRON",
  "wallet_address": "TXyz1234567890abcdef",
  "bank_alias": null,
  "is_favourite": true,
  "created_at": "2026-01-10T08:00:00Z",
  "updated_at": "2026-03-01T12:00:00Z"
}
```

---

*API Version v36.0 — Generated from source: `app_backend/app/api/` + Flasgger docstrings*
