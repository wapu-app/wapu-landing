"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ============================================================
   WAPU /dev — Documentación para desarrolladores
   Mismo ADN que / (lat-*) pero calmado y técnico, CLI-first.
   Reemplaza app/dev/page.tsx por completo.
   Requiere pegar el bloque de globals-dev.css al final de
   app/globals.css (las clases lat-* ya existen ahí).
   ============================================================ */

const GITHUB_CLI = "https://github.com/wapu-app/wapu-cli";

const chips = ["Sin KYC", "P2P", "Open Source", "Gratuito", "3 años en producción"];

const flow = [
  { n: "01", title: "Creás un depósito Lightning", body: <>Llamás a <code>deposit_lightning</code> y recibís un <code>lnurl_pr_invoice</code> para pagar desde una wallet Lightning.</> },
  { n: "02", title: "Wapu detecta el pago", body: <>Cuando la factura se paga, el depósito queda confirmado en la cuenta.</> },
  { n: "03", title: "Ejecutás una salida ARS", body: <>Creás una transferencia fiat a alias/CBU usando el saldo disponible según el flujo soportado.</> },
];

const useCases = [
  { tag: "// developers", title: "Para developers", body: "Probá depósitos y retiros desde la terminal antes de tocar el frontend. Menos fricción, más shipping." },
  { tag: "// servidores & scripts", title: "Para servidores y scripts", body: "Integración server-to-server en pipelines, cronjobs y bots. Depositás BTC/USDT y retirás ARS." },
  { tag: "// agentes ia", title: "Para agentes de IA", body: "Un CLI simple y predecible que tu agente puede orquestar para ejecutar pagos reales." },
  { tag: "// comercios", title: "Para emprendedores bitcoiners", body: "Onboardeás comercios pidiendo solo un alias o CBU para los retiros. Hiperbitcoinizar sin vueltas." },
];

const hostedPartners = [
  { title: "Cursats", href: "https://cursats.bitbybit.com.ar/en", logo: "/partners/cursats.png", alt: "Logo de Cursats", body: "Cursos y comunidad Bitcoin usando Wapu para cobrar y mover sats sin vueltas." },
  { title: "Tiendita Wapu", href: "https://tienditawapu.vercel.app/", logo: "/partners/tiendita.png", alt: "Logo de Tiendita Wapu", body: "Tienda de ecommerce que permite hacer cobros en BTC y retiros en ARS via Wapu." },
  { title: "Wapify", href: "https://wapify-seven.vercel.app/", logo: "/partners/wapufy.png", alt: "Logo de Wapify", body: "Checkout e integración de pagos para cobros con Wapu en productos web." },
  { title: "QR Wapu", href: "https://qr-wapu.vercel.app/", logo: "/partners/qr-wapu.png", alt: "Logo de QR Wapu", body: "Cobrá con QR Lightning en tu tienda y recibi pesos usando Wapu. Ideal para salir a Bitcoinizar." },
  { title: "ZapLoop", href: "https://zaploop.vercel.app/", logo: "/partners/zaploop.png", alt: "Logo de ZapLoop", body: "Loop de automatización Lightning usando Wapu para disparar cobros y pagos." },
];

const githubPartners = [
  { title: "WapuBot", href: "https://github.com/landaverdend/WapuBot", body: "bot que integra pagos Wapu." },
  { title: "Agendapu", href: "https://github.com/Lalo1821/agendapu", body: "agenda/turnos conectada a Wapu." },
  { title: "BTCPay Wapu Bridge", href: "https://github.com/julian2000-code/btcpay-wapu-bridge", body: "puente entre BTCPay Server y Wapu." },
];

/* --------------------- helpers de UI --------------------- */

function useReveal() {
  useEffect(() => {
    const nav = document.querySelector(".dev-nav-wrap");
    const onScroll = () => nav?.classList.toggle("is-stuck", window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const targets = Array.from(document.querySelectorAll<HTMLElement>(".dev-reveal, .dev-stagger"));
    targets.forEach((t) => t.classList.add("dev-anim"));
    const trigger = () => {
      const line = window.innerHeight * 0.94;
      targets.forEach((el) => {
        if (el.classList.contains("is-in")) return;
        const r = el.getBoundingClientRect();
        if (r.top < line && r.bottom > 0) el.classList.add("is-in");
      });
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      targets.forEach((t) => io.observe(t));
    }
    window.addEventListener("scroll", trigger, { passive: true });
    trigger();
    const t1 = setTimeout(trigger, 60);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("scroll", trigger); clearTimeout(t1); };
  }, []);
}

function CopyButton({ getText, className = "" }: { getText: () => string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={"dev-copy" + (className ? " " + className : "") + (copied ? " copied" : "")}
      aria-label="Copiar comando"
      onClick={async () => {
        try { await navigator.clipboard.writeText(getText()); } catch { /* noop */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 1300);
      }}
    >
      ⧉ <span className="dev-copy-label">{copied ? "Copiado" : "Copiar"}</span>
    </button>
  );
}

function HeroTerminal() {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const depText = "wapu deposit lightning create --amount 10 --currency SAT";
  const wdText = "wapu withdraw ars --type fiat_transfer --alias comercio.alias --amount 1000 --receiver-name 'Juan Perez'";
  return (
    <div className="dev-terminal">
      <div className="dev-term-bar">
        <span className="dev-term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="dev-term-title">~/wapu — zsh</span>
        <div className="dev-term-tabs" role="tablist" aria-label="Ejemplos de terminal">
          <button className="dev-term-tab" role="tab" aria-selected={tab === "deposit"} onClick={() => setTab("deposit")}>deposit</button>
          <button className="dev-term-tab" role="tab" aria-selected={tab === "withdraw"} onClick={() => setTab("withdraw")}>withdraw</button>
        </div>
        <CopyButton getText={() => (tab === "deposit" ? depText : wdText)} className="dev-term-copy" />
      </div>
      <div className="dev-term-body">
        <div className={"dev-term-panel" + (tab === "deposit" ? " is-active" : "")} role="tabpanel">
          <div className="dev-term-line"><span className="dev-term-prompt" /><span className="dev-term-cmd">wapu deposit lightning create </span><span className="dev-term-flag">--amount</span> 10 <br /> <span className="dev-term-flag">--currency</span> SAT</div>
          <div className="dev-term-line dev-term-comment">{" "}</div>
          <div className="dev-term-line dev-term-out">{"| field            | value        |"}</div>
          <div className="dev-term-line dev-term-out">{"|------------------|--------------|"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">transaction_id</span>{"   | ...          |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">lnurl_pr_invoice</span>{" | "}<span className="dev-term-str">lnbc10u1...</span>{"  |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">status</span>{"           | PENDING      |"}<span className="dev-term-cursor" aria-hidden="true" /></div>
        </div>
        <div className={"dev-term-panel" + (tab === "withdraw" ? " is-active" : "")} role="tabpanel">
          <div className="dev-term-line"><span className="dev-term-prompt" /><span className="dev-term-cmd">wapu withdraw ars </span><span className="dev-term-flag">--type</span> fiat_transfer \</div>
          <div className="dev-term-line">{"    "}<span className="dev-term-flag">--alias</span> comercio.alias <span className="dev-term-flag">--amount</span> 1000 \</div>
          <div className="dev-term-line">{"    "}<span className="dev-term-flag">--receiver-name</span> <span className="dev-term-str">&apos;Juan Perez&apos;</span></div>
          <div className="dev-term-line dev-term-out">{" "}</div>
          <div className="dev-term-line dev-term-out">{"| field            | value          |"}</div>
          <div className="dev-term-line dev-term-out">{"|------------------|----------------|"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">transaction_id</span>{"   | tx-ars-1       |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">type</span>{"             | fiat_transfer  |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">status</span>{"           | Pending        |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">payment_amount</span>{"   | 1000           |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">payment_currency</span>{" | ARS            |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">currency_taken</span>{"   | USDT           |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">alias</span>{"            | comercio.alias |"}</div>
          <div className="dev-term-line dev-term-out">{"| "}<span className="dev-term-key">receiver_name</span>{"    | Juan Perez     |"}<span className="dev-term-cursor" aria-hidden="true" /></div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- PAGE ----------------------------- */

export default function DevPage() {
  useReveal();
  return (
    <main className="dev-page">
      <div className="dev-grid-bg" aria-hidden="true" />

      {/* NAV */}
      <div className="dev-nav-wrap">
        <header className="dev-nav">
          <a className="dev-brand" href="#top" aria-label="Wapu developers">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dev-brand-logo" src="/wapu-logo.png" alt="Wapu" />
            <span className="dev-brand-badge">dev</span>
          </a>
          <nav className="dev-nav-links" aria-label="Secciones">
            <a href="#flujo">Flujo</a>
            <a href="#casos">Casos de uso</a>
            <span className="dev-nav-sep" aria-hidden="true" />
            <a className="dev-nav-ghost dev-nav-hide-sm" href="/api-docs">API Docs</a>
            <a className="dev-nav-ghost" href={GITHUB_CLI} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z" /></svg>
              GitHub
            </a>
            <Link className="dev-nav-cta" href="/">Wapu Argentina →</Link>
          </nav>
        </header>
      </div>

      {/* HERO */}
      <section className="dev-hero" id="top">
        <div className="dev-shell">
          <div className="dev-hero-layout">
            <div className="dev-hero-copy dev-reveal">
              <p className="dev-pill"><span className="dot" />CLI + API · Sin KYC · Open Source</p>
              <h1>Bitcoinizá pagos desde la <span className="lat-it">terminal</span>.</h1>
              <p className="dev-hero-lead">
                <code>wapu</code> CLI y la API REST son el mismo músculo: depositás por Lightning y enviás pesos
                a un alias o CBU. Server-to-server, sin formularios de identidad, probado 3 años en producción.
              </p>
              <div className="dev-actions">
                <a className="lat-primary-btn" href={GITHUB_CLI} target="_blank" rel="noreferrer">Empezar ahora →</a>
                <a className="lat-secondary-btn" href="#flujo">Ver el flujo</a>
              </div>
              <div className="dev-chips">
                {chips.map((c) => <span className="dev-chip" key={c}>{c}</span>)}
              </div>
            </div>
            <div className="dev-reveal">
              <HeroTerminal />

            </div>
          </div>
        </div>
      </section>

      {/* FLUJO */}
      <section className="dev-section" id="flujo">
        <div className="dev-shell">
          <div className="dev-section-head dev-reveal">
            <p className="dev-kicker">Cómo funciona</p>
            <h2>Cripto entra. <span className="lat-it">Pesos</span> salen.</h2>
            <p>Wapu permite crear depósitos por Lightning o cripto, y ejecutar salidas ARS a destinos bancarios compatibles. Según el flujo, Wapu coordina la contraparte y aplica escrow cuando hace falta.</p>
          </div>
          <div className="dev-flow dev-stagger">
            {flow.map((s, i) => (
              <Fragmentish key={s.n} last={i === flow.length - 1}>
                <article className="dev-flow-step">
                  <span className="dev-flow-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </article>
              </Fragmentish>
            ))}
          </div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="dev-section" id="casos">
        <div className="dev-shell">
          <div className="dev-section-head dev-reveal">
            <p className="dev-kicker">Para quiénes</p>
            <h2>Casos de uso <span className="lat-it">reales</span>.</h2>
            <p>El mismo CLI y la misma API, distinta forma de enchufarlos a tu stack.</p>
          </div>
          <div className="dev-use-grid dev-stagger">
            {useCases.map((u) => (
              <article className="dev-use" key={u.title}>
                <p className="dev-use-tag">{u.tag}</p>
                <h3>{u.title}</h3>
                <p>{u.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="dev-section" id="partners">
        <div className="dev-shell">
          <div className="dev-section-head dev-reveal">
            <p className="dev-kicker">Ecosistema</p>
            <h2>Partners</h2>
            <p>Proyectos reales que ya están usando Wapu para cobrar, automatizar o probar integraciones bitcoiners.</p>
          </div>

          <div className="dev-partner-grid dev-stagger">
            {hostedPartners.map((partner) => (
              <a className="dev-partner-card" href={partner.href} target="_blank" rel="noreferrer" key={partner.title}>
                <span className="dev-partner-logo-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="dev-partner-logo" src={partner.logo} alt={partner.alt} />
                </span>
                <span className="dev-partner-copy">
                  <strong>{partner.title}</strong>
                  <span>{partner.body}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="dev-github-only dev-reveal">
            <p className="dev-github-only-label">Integraciones en GitHub</p>
            <div className="dev-github-list">
              {githubPartners.map((partner) => (
                <a className="dev-github-item" href={partner.href} target="_blank" rel="noreferrer" key={partner.title}>
                  <strong>{partner.title}</strong>
                  <span>{partner.body}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="dev-final">
        <div className="dev-shell">
          <div className="dev-final-grid dev-reveal">
            <div>
              <p className="dev-kicker">Open Source</p>
              <h2>¿Listo para bitcoinizar tu producto?</h2>
              <p>Wapu CLI es Open Source, gratuito y fácil de integrar. Cloná el repo y mandás tu primer pago hoy.</p>
            </div>
            <a className="lat-primary-btn" href={GITHUB_CLI} target="_blank" rel="noreferrer" style={{ minHeight: 58, padding: "0 28px", fontSize: 16 }}>Ir al repo del CLI →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="dev-footer">
        <div className="dev-shell">
          <div className="dev-footer-grid">
            <span><strong style={{ color: "#fff", fontStyle: "italic" }}>wapu</strong> · Bitcoin sin KYC · Argentina</span>
            <nav className="dev-footer-links" aria-label="Enlaces">
              <Link href="/">Wapu Argentina</Link>
              <a href="/api-docs">API Docs ES</a>
              <a href="/api-docs/en">API Docs EN</a>
              <a href={GITHUB_CLI} target="_blank" rel="noreferrer">GitHub del CLI</a>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* Pequeño wrapper para intercalar la flecha entre pasos del flujo */
function Fragmentish({ children, last }: { children: React.ReactNode; last: boolean }) {
  return (
    <>
      {children}
      {!last && (
        <div className="dev-flow-arrow" aria-hidden="true">
          <svg viewBox="0 0 32 18"><path d="M1 9 H27 M21 3 L28 9 L21 15" /><path className="surge" d="M1 9 H27" /></svg>
        </div>
      )}
    </>
  );
}
