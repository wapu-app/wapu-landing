import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contacto | Wapu",
  robots: {
    follow: false,
    index: false,
  },
};

export default function WhatsAppGatePage() {
  return (
    <main className="lat-page wapu-contact-gate min-h-screen overflow-x-hidden bg-[#020202] text-white">
      <div className="lat-grid-bg" />
      <section className="wapu-contact-gate-inner">
        <Link className="lat-brand" href="/lat">
          <Image src="/wapuLogo.svg" alt="Wapu" width={118} height={34} priority />
          <span>Contacto</span>
        </Link>

        <div className="wapu-contact-gate-copy">
          <p className="lat-section-kicker">Canal oficial</p>
          <h1>Abrir WhatsApp de Wapu.</h1>
          <p>Vas a salir de la landing para iniciar el chat en WhatsApp.</p>
        </div>

        <form action="/w/open" method="post" target="_blank">
          <input
            aria-hidden="true"
            autoComplete="off"
            className="wapu-contact-gate-field"
            name="website"
            tabIndex={-1}
            type="text"
          />
          <button className="lat-primary-btn" type="submit">
            Abrir WhatsApp
          </button>
        </form>

        <Link className="lat-secondary-btn" href="/lat#contacto">
          Volver
        </Link>
      </section>
    </main>
  );
}
