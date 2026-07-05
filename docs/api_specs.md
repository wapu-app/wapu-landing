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
[
  { "pair": "USDT/ARS", "buy": 1245.50, "sell": 1230.00 },
  { "pair": "USDT/BRL", "buy": 6.20, "sell": 6.05 },
  { "pair": "BTC/USD", "buy": 68500.00, "sell": 68000.00 }
]
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
  "pix_key": "pix@wapu.app",
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
  "username": "johndoe",
  "email": "john@example.com",
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
  "email": "john@example.com",
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
  "email": "john@example.com"
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
  "email": "john@example.com"
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
  "email": "john@example.com"
}
```

**Response `200`:** `{}`

---

#### `POST /users/usertag`

Check if a username is valid and available. No authentication required.

**Request body (JSON):**
```json
{
  "username": "johndoe"
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
  "username": "johndoe",
  "email": "john@example.com",
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
    "pix_key": "pix@wapu.app",
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
    { "pair": "USDT/ARS", "buy": 1245.50, "sell": 1230.00 },
    { "pair": "USDT/BRL", "buy": 6.20, "sell": 6.05 },
    { "pair": "BTC/USD", "buy": 68500.00, "sell": 68000.00 }
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
  "username": "johndoe",
  "phone": "5491155556666",
  "telegram": "johndoe_tg",
  "email": "john@example.com",
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
  "email": "john@example.com"
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
  "referral_link": "https://wapu.app/signup?ref=ABC123",
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
  "status": "PENDING",
  "type": "fiat_transfer",
  "type_name": "Fiat Transfer",
  "is_positive": false,
  "payment_amount": 100.00,
  "payment_currency": "ARS",
  "currency_taken": "USDT",
  "total_amount_taken": 0.0803,
  "fee_taken": 0.0012,
  "current_rate": 1245.50,
  "alias": "alias.cbu.bancario",
  "receiver_name": "Jane Doe",
  "network": null,
  "address_destination": null,
  "blockchain_trx_id": null,
  "lnurl_pr_invoice": null,
  "lnurl_verify_invoice": null,
  "note": null,
  "username": "johndoe",
  "sender_username": null,
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:01:00Z"
}
```

> Amounts are **not** in cents — the API converts them to proper units before responding.

---

#### `GET /transactions/<id>`

Get a single transaction by UUID or numeric ID.

**Auth:** `[JWT | API Key]`

**Path param:** `id` — UUID (e.g. `123e4567-e89b-12d3-a456-426614174000`) or numeric ID.

**Response `200`:** Transaction object (see above).

**Errors:**

| Status | Message |
|--------|---------|
| `404` | `"Transaction not found"` |

> If the transaction is a Lightning deposit with `PENDING` status, the invoice is checked in real-time and may return `COMPLETED`.

---

#### `GET /transactions/my-transactions`

Get all transactions for the authenticated user, ordered by date descending.

**Auth:** `[JWT | API Key]`

**Response `200`:**
```json
{
  "transactions": [
    {
      "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "COMPLETED",
      "type": "fiat_transfer",
      "type_name": "Fiat Transfer",
      "is_positive": false,
      "payment_amount": 10000.00,
      "payment_currency": "ARS",
      "currency_taken": "USDT",
      "total_amount_taken": 8.03,
      "fee_taken": 0.12,
      "current_rate": 1245.50,
      "alias": "alias.bancario",
      "receiver_name": "Jane Doe",
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
alias=alias.bancario.cbu
receiver_name=Jane Doe
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
  "alias": "alias.bancario.cbu"
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
receiver_username=janedoe
```

**Response `201`:** Transaction object for the sender's debit transaction.

**Errors:**

| Status | Message |
|--------|---------|
| `400` | `"Receiver username does not exist."` |
| `400` | `"Sender does not have enough balance."` |

---

#### `POST /transactions/direct-fiat/tentatives`

Create a direct-fiat tentative and freeze the quote. This does not generate the funding transaction yet.

**Auth:** `[JWT | API Key]`

**Request body (JSON):**
```json
{
  "amount_ars": 10000,
  "type": "fiat_transfer",
  "alias": "alias.bancario.cbu",
  "receiver_name": "Jane Doe",
  "funding_method": "USDT",
  "network": "POLYGON",
  "refund_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "external_reference": "order-123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount_ars` | number | yes | Amount to pay in ARS |
| `type` | string | yes | `"fiat_transfer"` or `"fast_fiat_transfer"` |
| `alias` | string | no | Recipient alias/CBU/CVU |
| `receiver_name` | string | no | Recipient name |
| `funding_method` | string | no | Funding asset or rail |
| `network` | string | no | Funding network |
| `refund_address` | string | no | Optional refund address |
| `external_reference` | string | no | External reference/idempotency identifier |

**Response `201`:** Direct-fiat tentative object.

---

#### `GET /transactions/direct-fiat/tentatives/<tentative_id>`

Get the status of a direct-fiat tentative.

**Auth:** `[JWT | API Key]`

**Path param:** `tentative_id` — Tentative UUID.

**Response `200`:** Direct-fiat tentative status object. Includes `refund_transaction_id` only when a refund was created for the direct-fiat operation.

---

#### `POST /transactions/direct-fiat/tentatives/<tentative_id>/funding`

Generate funding instructions for a direct-fiat tentative.

**Auth:** `[JWT | API Key]`

**Path param:** `tentative_id` — Tentative UUID.

**Response `201`:** Funding instructions. Includes `refund_transaction_id` only when a refund was created for the direct-fiat operation.

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

**Response `201`:** Transaction object with `type: "deposit"` and `status: "PENDING"`.

```json
{
  "transaction_id": "abc12345-...",
  "status": "PENDING",
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
  "status": "PENDING",
  "type": "deposit",
  "network": "LIGHTNING",
  "lnurl_pr_invoice": "lnbc100u1p3...",
  "lnurl_verify_invoice": "https://api.lightning.com/invoice/verify/...",
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
  "receiver_name": "Jane Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | yes | Destination blockchain address |
| `network` | string | yes | See network enum |
| `currency` | string | yes | `"USDT"`, `"USDC"` |
| `amount` | number | yes | Amount to withdraw |
| `receiver_name` | string | no | Recipient name for record-keeping |

**Response `201`:** Transaction object with `type: "withdrawal"` and `status: "PENDING"`.

```json
{
  "transaction_id": "ghi89012-...",
  "status": "PENDING",
  "type": "withdrawal",
  "type_name": "Withdrawal",
  "is_positive": false,
  "payment_amount": 20.00,
  "currency_taken": "USDT",
  "network": "TRON",
  "address_destination": "TXyz1234567890abcdef",
  "receiver_name": "Jane Doe",
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
      "bank_alias": "alias.bancario.001",
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
  "callback": "https://api.wapu.app/lnurlp/johndoe/callback",
  "minSendable": 1000,
  "maxSendable": 10000000000,
  "metadata": "[[\"text/plain\",\"Pay johndoe via WapuPay\"]]",
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
  "verify": "https://api.wapu.app/invoice/verify/..."
}
```

---

## Enums Reference

### Transaction Status (`StatusEnum`)

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting processing |
| `COMPLETED` | Successfully processed |
| `TAKEN` | Assigned to a payer (QR flow) |
| `CANCELED` | Canceled by user or system |
| `USER_PENDING` | Waiting for user confirmation |
| `REJECTED` | Rejected by system/admin |

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
  "username": "johndoe",
  "email": "john@example.com",
  "kyc_tier": 1,
  "is_active": true,
  "email_verified": true,
  "telegram_username": "johndoe_tg",
  "state": "ACTIVE",
  "api_enabled": true
}
```

### Transaction (full)

```json
{
  "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "COMPLETED",
  "type": "fiat_transfer",
  "type_name": "Fiat Transfer",
  "is_positive": false,
  "payment_amount": 10000.00,
  "payment_currency": "ARS",
  "currency_taken": "USDT",
  "total_amount_taken": 8.03,
  "fee_taken": 0.12,
  "current_rate": 1245.50,
  "alias": "alias.bancario.cbu",
  "receiver_name": "Jane Doe",
  "network": null,
  "address_destination": null,
  "source_address": null,
  "blockchain_trx_id": null,
  "lnurl_pr_invoice": null,
  "lnurl_verify_invoice": null,
  "note": null,
  "receipt_image_url": null,
  "username": "johndoe",
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
