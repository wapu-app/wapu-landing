import type { Metadata } from "next";
import ArgLanding from "./arg/arg-landing";
import { getSignupUrl } from "./campaign-signup";

export const metadata: Metadata = {
  title: "Wapu Argentina | Bitcoin sin KYC",
  description:
    "Wapu para Argentina: deposita cripto, envia a banco, alias, CBU, CVU, MercadoPago o Wapu ID, y opera Bitcoin sin KYC con escrow.",
};

type HomePageProps = {
  searchParams: Promise<{ campaign?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { campaign } = await searchParams;
  return <ArgLanding signupUrl={getSignupUrl(campaign)} />;
}
