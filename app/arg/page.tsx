import type { Metadata } from "next";
import ArgLanding from "./arg-landing";

export const metadata: Metadata = {
  title: "Wapu Argentina | Bitcoin sin KYC",
  description:
    "Wapu para Argentina: deposita cripto, envia a banco, alias, CBU, CVU, MercadoPago o Wapu ID, y opera Bitcoin sin KYC con escrow.",
};

export default function ArgPage() {
  return <ArgLanding />;
}
