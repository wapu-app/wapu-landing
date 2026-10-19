import { expect, test } from "@playwright/test";

const cases = [
  ["stikers", "/?campaign=stikers", "https://my.wapu.app/signup?ref=86aa1cd0"],
  ["twitter", "/?campaign=twitter", "https://my.wapu.app/signup?ref=106f81d7"],
  ["instagram", "/?campaign=instagram", "https://my.wapu.app/signup?ref=bc24beb6"],
  ["tarjetas", "/?campaign=tarjetas", "https://my.wapu.app/signup?ref=e317e871"],
  ["mixed case", "/?campaign=TwItTeR", "https://my.wapu.app/signup?ref=106f81d7"],
  ["whitespace", "/?campaign=%20STIKERS%20", "https://my.wapu.app/signup?ref=86aa1cd0"],
  ["no campaign", "/", "https://my.wapu.app/newSignUp"],
  ["empty campaign", "/?campaign=", "https://my.wapu.app/newSignUp"],
  ["unknown campaign", "/?campaign=unknown", "https://my.wapu.app/newSignUp"],
  ["prototype key", "/?campaign=__proto__", "https://my.wapu.app/newSignUp"],
  ["constructor key", "/?campaign=constructor", "https://my.wapu.app/newSignUp"],
  ["repeated campaign", "/?campaign=stikers&campaign=twitter", "https://my.wapu.app/newSignUp"],
  ["case-sensitive parameter name", "/?Campaign=instagram", "https://my.wapu.app/newSignUp"],
  ["untrusted extra parameters", "/?campaign=stikers&ref=other&redirect=https://example.com", "https://my.wapu.app/signup?ref=86aa1cd0"],
];

// Exercise the production HTTP response: the referral must work before hydration,
// including when JavaScript is unavailable. No signup/provider requests are made.
for (const [name, path, destination] of cases) {
  test(`${name}: every signup CTA has the expected referral`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.url()).toBe(`http://127.0.0.1:3187${path}`);

    const html = await response.text();
    const signupLinks = [...html.matchAll(/<a\b[^>]*\bhref="(https:\/\/my\.wapu\.app\/[^"]*)"[^>]*>/g)];
    expect(signupLinks).toHaveLength(3);
    for (const [, href] of signupLinks) {
      expect(href).toBe(destination);
    }
    const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]
      .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    expect(heading).toBe("Transferí pesos usando tus BTC o USDT, sin KYC.");
  });
}

test("a direct visit does not inherit the previous visitor's campaign", async ({ request }) => {
  for (const [path, expected] of [
    ["/?campaign=stikers", "https://my.wapu.app/signup?ref=86aa1cd0"],
    ["/?campaign=twitter", "https://my.wapu.app/signup?ref=106f81d7"],
    ["/", "https://my.wapu.app/newSignUp"],
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const hrefs = [...(await response.text()).matchAll(/<a\b[^>]*\bhref="(https:\/\/my\.wapu\.app\/[^"]*)"[^>]*>/g)]
      .map((match) => match[1]);
    expect(hrefs).toEqual([expected, expected, expected]);
  }
});

test("unknown paths remain 404s even with a known campaign", async ({ request }) => {
  const response = await request.get("/nonexistent-campaign-test?campaign=stikers");
  expect(response.status()).toBe(404);
});
