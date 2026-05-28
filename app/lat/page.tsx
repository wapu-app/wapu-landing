import type { Metadata } from "next";
import LatLanding from "./lat-landing";

export const metadata: Metadata = {
  title: "Wapu Latam | Bitcoin sin KYC en Argentina",
  description:
    "Wapu para Argentina: deposita cripto, envia a banco, alias, CBU, CVU, MercadoPago o Wapu ID, y opera Bitcoin sin KYC con escrow.",
};

export default function LatPage() {
  return <LatLanding />;
}
