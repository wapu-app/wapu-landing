const campaignReferrals = new Map([
  ["stikers", "86aa1cd0"],
  ["twitter", "106f81d7"],
  ["instagram", "bc24beb6"],
  ["tarjetas", "e317e871"],
]);

export function getSignupUrl(campaign: string | string[] | undefined): string {
  const referral = typeof campaign === "string"
    ? campaignReferrals.get(campaign.trim().toLowerCase())
    : undefined;

  return referral
    ? `https://my.wapu.app/signup?ref=${referral}`
    : "https://my.wapu.app/newSignUp";
}
