# Campaign signup links

Add `?campaign=<name>` to the home URL to select a referral for all three
"Entrar a Wapu" links. The home content stays unchanged; there is no redirect.

| Home query | Signup destination |
|---|---|
| `?campaign=stikers` | `https://my.wapu.app/signup?ref=86aa1cd0` |
| `?campaign=twitter` | `https://my.wapu.app/signup?ref=106f81d7` |
| `?campaign=instagram` | `https://my.wapu.app/signup?ref=bc24beb6` |
| `?campaign=tarjetas` | `https://my.wapu.app/signup?ref=e317e871` |

## Rules and limits

- The parameter name is lowercase `campaign`; values ignore case and surrounding whitespace.
- Missing, empty, unknown or repeated values keep the existing signup destination:
  `https://my.wapu.app/newSignUp`, without a referral.
- Extra parameters cannot override the configured referral or destination and are not forwarded.
- No cookies, browser storage, analytics or backend/PWA changes are introduced.
  Returning without the campaign parameter does not retain the referral.
- Referral validity, discounts and referral rewards remain the backend's responsibility.
  This change does not validate the four codes against production data.
- Unknown paths still return 404; campaign aliases such as `/stiker` are not added.

## Implementation and checks

`app/campaign-signup.ts` owns the mapping. `app/page.tsx` reads the query on the
server and passes one signup URL to the landing. The home is now rendered per
request so all links include the right referral even before JavaScript runs.

Run `npm test` for the API-doc tests and campaign HTTP tests, or
`npm run test:campaign-signup` for campaign coverage only. The campaign suite
builds production assets, starts its own server on loopback port 3187 and stops
it afterward. Keep that port free. These tests do not require a browser binary
and never submit signup requests. Run `npm run lint` before committing.
