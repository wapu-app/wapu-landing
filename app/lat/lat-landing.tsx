"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const SHOW_BUY_BTC_MODULE = false;

function BitcoinMark() {
  return (
    <svg className="lat-token-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="#f7931a" />
      <text
        x="16"
        y="22"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="17"
        fontWeight="900"
        textAnchor="middle"
      >
        ₿
      </text>
    </svg>
  );
}

function UsdtMark() {
  return (
    <svg className="lat-token-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="#26a17b" />
      <path d="M8 8h16v4.1h-5.9v3.2h-4.2v-3.2H8z" fill="#fff" />
      <path d="M13.9 16.6h4.2v7.4h-4.2z" fill="#fff" />
      <path
        d="M9.6 16.4c0-1.3 2.9-2.4 6.4-2.4s6.4 1.1 6.4 2.4-2.9 2.4-6.4 2.4-6.4-1.1-6.4-2.4Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
      />
      <path
        d="M12.2 16.4c0 .45 1.7.85 3.8.85s3.8-.4 3.8-.85"
        fill="none"
        stroke="#26a17b"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

const operationSteps = [
  {
    eyebrow: "01",
    title: "Depositás cripto",
    body: "BTC, USDT o USDC entran a Wapu. El sistema bloquea activos cuando la operacion necesita escrow.",
  },
  {
    eyebrow: "02",
    title: "Elegís Enviar",
    body: "Mandá a una cuenta bancaria, alias, CBU, CVU, MercadoPago, Wapu ID o direccion USDT.",
  },
  {
    eyebrow: "03",
    title: "Rápido o normal",
    body: "Si el destino es bancario, elegís velocidad. La comision cambia segun la ruta.",
  },
  {
    eyebrow: "04",
    title: "Wapu liquida",
    body: "La app resuelve la contraparte confiable por detras, convierte cuando corresponde y el dinero llega.",
  },
];

const audience = [
  {
    title: "Bitcoiner con autocustodia",
    body: "Tenés hardware wallet, cuidás tu privacidad y no querés pasar por un exchange para cada movimiento.",
  },
  {
    title: "Freelancer cripto",
    body: "Cobrás en cripto y necesitás usar pesos en Argentina sin hacer malabares con bancos.",
  },
  {
    title: "Builder de Latam",
    body: "Querés una experiencia simple, mobile y directa para mover valor sin pedir permiso.",
  },
];

const helpItems = [
  {
    question: "¿Wapu es un exchange?",
    answer:
      "No. Wapu funciona como una red P2P asistida: vos operás desde la app y Wapu coordina contrapartes confiables por detras.",
  },
  {
    question: "¿Tengo que buscar una contraparte?",
    answer:
      "No. Ese es el punto: Wapu simplifica el proceso y resuelve la contraparte sin exponerte a negociar con desconocidos.",
  },
  {
    question: "¿Qué es escrow?",
    answer:
      "Escrow es una garantia temporal: Wapu puede bloquear BTC, USDT o USDC durante la operacion para que el intercambio avance con reglas claras.",
  },
  {
    question: "¿A dónde puedo enviar?",
    answer:
      "A una cuenta bancaria, alias, CBU, CVU, MercadoPago, Wapu ID o direccion USDT, segun disponibilidad operativa.",
  },
  {
    question: "¿Funciona en Argentina?",
    answer:
      "Esta pagina esta pensada para Argentina. La disponibilidad de metodos, tiempos y comisiones puede depender de la operacion.",
  },
];

const contactItems = [
  {
    label: "App",
    value: "Entrar a Wapu",
    href: "https://my.wapu.app/newSignUp?ref=a0447a8d",
  },
  {
    label: "Soporte",
    value: "support@wapupay.com",
    href: "mailto:support@wapupay.com?Subject=Quiero%20usar%20Wapu%20sin%20KYC",
  },
  {
    label: "WhatsApp",
    value: "+54 9 11 2406-0850",
    href: "https://api.whatsapp.com/send?phone=5491124060850&text=Hola,%20quiero%20saber%20mas%20sobre%20Wapu",
  },
  {
    label: "X",
    value: "@wapupay",
    href: "https://twitter.com/wapupay",
  },
];

const tabs = [
  { id: "help", label: "Ayuda" },
  { id: "contact", label: "Contacto" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function LatLanding() {
  const [activeTab, setActiveTab] = useState<TabId>("help");

  const activePanel = useMemo(() => {
    if (activeTab === "contact") {
      return (
        <div className="lat-contact-grid">
          {contactItems.map((item) => (
            <a className="lat-contact-link" href={item.href} key={item.label} target="_blank" rel="noreferrer">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </a>
          ))}
        </div>
      );
    }

    return (
      <div className="lat-help-list">
        {helpItems.map((item) => (
          <details className="lat-help-item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    );
  }, [activeTab]);

  return (
    <main className="lat-page min-h-screen overflow-x-hidden bg-[#020202] text-white">
      <section className="lat-hero">
        <div className="lat-grid-bg" />
        <div className="lat-hero-inner">
          <header className="lat-nav">
            <Link className="lat-brand" href="/">
              <Image src="/wapuLogo.svg" alt="Wapu" width={118} height={34} priority />
              <span>Argentina</span>
            </Link>
            <nav aria-label="Secciones" className="lat-nav-links">
              <a href="#flujo">Flujo</a>
              <a href="#escrow">Escrow</a>
              <a href="#ayuda">Ayuda</a>
              <a className="lat-nav-cta" href="https://my.wapu.app/newSignUp?ref=a0447a8d">
                Entrar a Wapu
              </a>
            </nav>
          </header>

          <div className="lat-hero-layout">
            <div className="lat-hero-copy">
              <p className="lat-kicker">P2P asistido · Argentina · Sin KYC</p>
              <h1>Comprá, mové y usá Bitcoin sin KYC.</h1>
              <p className="lat-lead">
                Depositá cripto, elegí destino y Wapu se encarga del resto: escrow, contrapartes confiables y
                liquidación a pesos cuando querés salir al mundo real.
              </p>
              <div className="lat-actions">
                <a className="lat-primary-btn" href="https://my.wapu.app/newSignUp?ref=a0447a8d">
                  Entrar a Wapu
                </a>
                <a className="lat-secondary-btn" href="#video">
                  Ver flujo
                </a>
              </div>
              <div className="lat-proof-row" aria-label="Atributos del producto">
                <span>Sin formularios de identidad</span>
                <span>Escrow cripto</span>
                <span>Salida a ARS</span>
              </div>
            </div>

            <div className="lat-visual-wrap" aria-hidden="true">
              <div className="lat-orbit lat-orbit-one" />
              <div className="lat-orbit lat-orbit-two" />
              <div className="lat-phone">
                <div className="lat-phone-bar">
                  <span />
                  <span />
                </div>
                <div className="lat-balance-label">Total balance</div>
                <div className="lat-balance-card">
                  <strong>0.184 BTC</strong>
                  <span>P2P ready</span>
                </div>
                <div className="lat-action-grid">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="lat-send-sheet">
                  <span>Enviar a alias</span>
                  <strong>mate.bitcoin.mp</strong>
                  <em>Normal · ARS</em>
                </div>
              </div>
              <div className="lat-coin lat-coin-a">
                <BitcoinMark />
                <span>BTC</span>
              </div>
              <div className="lat-coin lat-coin-b">
                <UsdtMark />
                <span>USDT</span>
              </div>
              <div className="lat-escrow-cube">
                <span>P2P</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lat-section lat-manifest">
        <p className="lat-section-kicker">Manifiesto</p>
        <h2>No necesitás pedir permiso para mover tu dinero.</h2>
        <p>
          Wapu no te obliga a convertir tu privacidad en un formulario. Es una experiencia P2P asistida para operar con
          activos digitales y resolver pagos en Argentina con menos friccion, reglas claras y control operativo.
        </p>
      </section>

      <section className="lat-section" id="flujo">
        <div className="lat-section-head">
          <div>
            <p className="lat-section-kicker">Flujo real</p>
            <h2>Cripto entra. Pesos salen.</h2>
          </div>
          <p>
            El usuario no busca contraparte. Wapu coordina la ruta por detras con operadores confiables y el flujo se
            mantiene simple en la app.
          </p>
        </div>

        <div className="lat-steps">
          {operationSteps.map((step) => (
            <article className="lat-step" key={step.eyebrow}>
              <span>{step.eyebrow}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lat-video-section" id="video">
        <div className="lat-video-copy">
          <p className="lat-section-kicker">Grabación de la app</p>
          <h2>El producto tiene que verse funcionando.</h2>
          <p>
            Cuando nos pases la grabacion, este bloque muestra el flujo real: deposito, envio, velocidad, destino y
            confirmacion. En desktop acompaña el scroll; en mobile queda arriba y los pasos se leen debajo.
          </p>
        </div>
        <div className="lat-video-frame">
          <div className="lat-video-placeholder">
            <span>VIDEO APP</span>
            <strong>depositar → enviar → confirmar</strong>
          </div>
        </div>
      </section>

      <section className="lat-section" id="escrow">
        <div className="lat-section-head">
          <div>
            <p className="lat-section-kicker">Escrow invisible</p>
            <h2>No negociás con desconocidos.</h2>
          </div>
          <p>
            Wapu trabaja con contrapartes de confianza por detras. Para el usuario, el proceso se siente como una app:
            depositar, elegir destino, esperar y recibir.
          </p>
        </div>
        <div className="lat-escrow-band">
          <span>BTC</span>
          <i />
          <strong className="lat-escrow-label">
            <span className="lat-escrow-copy">
              <span className="lat-escrow-word">Escrow</span>
              <span className="lat-escrow-logo-mark" role="img" aria-label="Wapu" />
            </span>
          </strong>
          <i />
          <span>ARS</span>
        </div>
      </section>

      {SHOW_BUY_BTC_MODULE ? (
        <section className="lat-section">
          <p className="lat-section-kicker">Comprar Bitcoin</p>
          <h2>Compra BTC sin KYC desde Wapu.</h2>
          <p>Modulo preparado para activarse cuando la compra este disponible.</p>
        </section>
      ) : null}

      <section className="lat-section" id="personas">
        <div className="lat-section-head">
          <div>
            <p className="lat-section-kicker">Para quien es</p>
            <h2>Privacidad sin teatro corporativo.</h2>
          </div>
          <p>
            Wapu habla con usuarios que ya entienden Bitcoin, autocustodia y privacidad. La landing no tiene que
            explicarles por que importa: tiene que mostrarles que funciona.
          </p>
        </div>
        <div className="lat-audience-grid">
          {audience.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lat-section lat-tabs-section" id="ayuda">
        <div className="lat-section-head">
          <div>
            <p className="lat-section-kicker">Ayuda y contacto</p>
            <h2>Todo en la misma página.</h2>
          </div>
          <p>
            Las pestañas estan precargadas y cambian sin navegar a otra ruta. Rapido para el usuario, simple para
            mantener.
          </p>
        </div>

        <div className="lat-tabs">
          <div aria-label="Contenido de soporte" className="lat-tab-list" role="tablist">
            {tabs.map((tab) => (
              <button
                aria-controls={`lat-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "is-active" : ""}
                id={`lat-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`lat-tab-${activeTab}`}
            className="lat-tab-panel"
            id={`lat-panel-${activeTab}`}
            role="tabpanel"
          >
            {activePanel}
          </div>
        </div>
      </section>

      <section className="lat-final-cta">
        <div>
          <p className="lat-section-kicker">Argentina primero</p>
          <h2>Entrá, depositá y mové Bitcoin sin KYC.</h2>
          <p>Rebelde no es prometer magia. Rebelde es hacer que el flujo funcione sin pedirte una carpeta de papeles.</p>
        </div>
        <a className="lat-primary-btn" href="https://my.wapu.app/newSignUp?ref=a0447a8d">
          Entrar a Wapu
        </a>
      </section>
    </main>
  );
}
