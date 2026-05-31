"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Fragment, useEffect, useState } from "react";
import { getTurnstileSiteKey } from "../w/turnstile-config";

const SHOW_BUY_BTC_MODULE = false;
const TURNSTILE_SITE_KEY = getTurnstileSiteKey();
const WAPU_SIGNUP_URL = "https://my.wapu.app/newSignUp";
const TUTORIAL_STEP_EVENT = "wapu:tutorial-step";
const WAPU_SIGNUP_LINK_PROPS = {
  rel: "noopener noreferrer",
  target: "_blank",
};

type ContactKind = "instagram" | "discord" | "whatsapp" | "x" | "linkedin";

/* ----------------------------- DATA ----------------------------- */

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

const flowBoltPaths = [
  "M2 27 L14 27 L20 10 L29 40 L39 17 L49 30 L61 16 L70 28 L94 28",
  "M2 25 L16 25 L24 14 L31 37 L42 20 L53 31 L64 12 L73 26 L94 26",
  "M2 29 L17 29 L23 17 L32 39 L44 14 L55 30 L66 20 L74 28 L94 28",
];

const flowBoltVerticalPaths = [
  "M26 2 L26 15 L10 22 L40 31 L17 41 L31 53 L14 65 L27 74 L27 94",
  "M24 2 L24 16 L38 24 L13 34 L35 44 L18 55 L40 66 L25 76 L25 94",
  "M27 2 L27 14 L14 25 L41 34 L20 45 L35 55 L15 68 L28 78 L28 94",
];

const videoTimelineSteps = [
  {
    eyebrow: "01",
    title: "Depósito por Lightning",
    body: "El saldo entra por Lightning.",
  },
  {
    eyebrow: "02",
    title: "Depósito confirmado",
    body: "Wapu actualiza el saldo disponible.",
  },
  {
    eyebrow: "03",
    title: "Envío en pesos",
    body: "Elegís enviar moneda local argentina.",
  },
  {
    eyebrow: "04",
    title: "Destinatario y monto",
    body: "Cargás el alias o cuenta destino y definís cuánto querés mandar.",
  },
  {
    eyebrow: "05",
    title: "Revisión",
    body: "Confirmás monto, cambio, comisión y total.",
  },
  {
    eyebrow: "06",
    title: "Recibo final",
    body: "Procesamiento y comprobante final.",
  },
];

const DEFAULT_TUTORIAL_STEP = videoTimelineSteps[0]?.eyebrow ?? "01";
const TUTORIAL_STEP_IDS = new Set(videoTimelineSteps.map((step) => step.eyebrow));

const audience = [
  {
    title: "Bitcoiner con autocustodia",
    body: "Cuidás tu privacidad y no querés pasar por un exchange para cada movimiento.",
    image: "/audience/bitcoiner-autocustodia-argentina-v3.webp",
    imageAlt: "Hardware wallet, mate y nodo personal en una cocina argentina de departamento.",
    tag: "Autocustodia",
    tagBg: "var(--lat-electric)",
    tagColor: "#181619",
  },
  {
    title: "Freelancer cripto",
    body: "Cobrás en cripto y necesitás usar pesos en Argentina sin hacer malabares con bancos.",
    image: "/audience/freelancer-cripto-barrio.webp",
    imageAlt: "Freelancer trabajando desde un cafe de barrio con laptop, celular, pesos y cortado.",
    tag: "Freelance",
    tagBg: "var(--lat-electric-cold)",
    tagColor: "#0a1d18",
  },
  {
    title: "Nómada digital",
    body: "Necesitas una herramienta simple y directa para mover guita sin pedir permiso",
    image: "/audience/builder-latam-taller.webp",
    imageAlt: "Builder probando prototipos en un taller con mate, cables y mapa de Latinoamerica.",
    tag: "Nómada digital",
    tagBg: "var(--lat-pink-hot)",
    tagColor: "#fff",
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
    question: "¿Qué es un escrow?",
    answer:
      "Escrow es una garantia temporal: Wapu puede bloquear BTC, USDT o USDC durante la operacion para que el intercambio avance con mayor seguridad para ambas partes y no se pierdan los activos en el proceso.",
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
  {
    question: "¿Cuál es el límite de gasto?",
    answer:
      "Actualmente, el límite de gasto es de 5000 USD por mes.",
  },
];

const contactItems: Array<{ kind: ContactKind; label: string; value: string; href: string }> = [
  { kind: "instagram", label: "Instagram", value: "@wapu.app", href: "https://www.instagram.com/wapu.app/" },
  { kind: "discord", label: "Discord", value: "Comunidad", href: "https://discord.gg/m9AJ7SWxPB" },
  { kind: "whatsapp", label: "WhatsApp", value: "Abrir chat", href: "/w" },
  { kind: "x", label: "X", value: "@wapupay", href: "https://twitter.com/wapupay" },
  { kind: "linkedin", label: "LinkedIn", value: "WapuPay", href: "https://www.linkedin.com/company/wapupay/" },
];

/* ----------------------------- ICONS ----------------------------- */

function BitcoinMark() {
  return (
    <svg className="lat-token-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="#f7931a" />
      <text x="16" y="22" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="900" textAnchor="middle">₿</text>
    </svg>
  );
}

function UsdtMark() {
  return (
    <svg className="lat-token-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="#26a17b" />
      <path d="M8 8h16v4.1h-5.9v3.2h-4.2v-3.2H8z" fill="#fff" />
      <path d="M13.9 16.6h4.2v7.4h-4.2z" fill="#fff" />
      <path d="M9.6 16.4c0-1.3 2.9-2.4 6.4-2.4s6.4 1.1 6.4 2.4-2.9 2.4-6.4 2.4-6.4-1.1-6.4-2.4Z" fill="none" stroke="#fff" strokeWidth="1.7" />
    </svg>
  );
}

function ArsMark() {
  return (
    <svg className="lat-token-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="ars-token-clip">
          <circle cx="16" cy="16" r="15" />
        </clipPath>
      </defs>
      <circle cx="16" cy="16" r="15" fill="#f7fbff" />
      <g clipPath="url(#ars-token-clip)">
        <rect width="32" height="10.5" fill="#74acdf" />
        <rect y="21.5" width="32" height="10.5" fill="#74acdf" />
        <circle cx="16" cy="16" r="3.6" fill="#f6b40e" />
        <path d="M16 9.6v2.1M16 20.3v2.1M9.6 16h2.1M20.3 16h2.1M11.5 11.5l1.5 1.5M19 19l1.5 1.5M20.5 11.5 19 13M13 19l-1.5 1.5" stroke="#d88900" strokeLinecap="round" strokeWidth="1" />
      </g>
      <circle cx="16" cy="16" r="15" fill="none" stroke="#d7ecff" strokeWidth="1.4" />
    </svg>
  );
}

function OrangeMark() {
  return (
    <svg className="lat-token-mark lat-orange-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="lat-orange-token-glow" cx="34%" cy="24%" r="72%">
          <stop offset="0%" stopColor="#ffe48a" />
          <stop offset="42%" stopColor="#ff9b2f" />
          <stop offset="100%" stopColor="#d84b11" />
        </radialGradient>
      </defs>
      <path d="M16.4 5.8c1.4-3 4-4.6 7.7-4.8.1 3.4-2.2 5.8-6.6 6.8" fill="#54d46f" />
      <path d="M18.4 7c-.2-2.3-1-3.8-2.5-4.7" fill="none" stroke="#7a3b11" strokeLinecap="round" strokeWidth="1.4" />
      <circle cx="16" cy="17" r="12.2" fill="url(#lat-orange-token-glow)" />
      <circle cx="16" cy="17" r="12.2" fill="none" stroke="#ffd36a" strokeWidth="1.4" />
      <circle cx="11.2" cy="14.8" r="0.8" fill="#f16d19" opacity="0.72" />
      <circle cx="19.7" cy="13.6" r="0.9" fill="#f16d19" opacity="0.62" />
      <circle cx="14.9" cy="21.8" r="0.75" fill="#f16d19" opacity="0.66" />
      <path d="M8.8 18.4c2.5 1.1 5.1 1.3 7.7.7 2.1-.5 4.3-.4 6.7.4" fill="none" stroke="#ffcf62" strokeLinecap="round" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

function ContactIcon({ kind }: { kind: ContactKind }) {
  if (kind === "instagram") {
    return (
      <svg className="lat-contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.05-.41-2.22-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41 1.27-.06 1.65-.07 4.85-.07m0-2.16C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.78.3-1.44.71-2.1 1.37C1.38 2.66.97 3.32.67 4.1.37 4.86.17 5.74.11 7.01.05 8.29.04 8.7.04 11.96s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.78.71 1.44 1.37 2.1.66.66 1.32 1.07 2.1 1.37.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.78-.3 1.44-.71 2.1-1.37.66-.66 1.07-1.32 1.37-2.1.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.78-.71-1.44-1.37-2.1-.66-.66-1.32-1.07-2.1-1.37-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Z" />
        <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
        <path d="M18.4 4.16a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
      </svg>
    );
  }
  if (kind === "discord") {
    return (
      <svg className="lat-contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.32 4.37A19.8 19.8 0 0 0 16.56 3c-.18.32-.39.76-.53 1.1a18.27 18.27 0 0 0-4.05 0c-.14-.34-.35-.78-.53-1.1a19.74 19.74 0 0 0-3.76 1.37C5.32 7.91 4.68 11.36 5 14.76a19.9 19.9 0 0 0 4.61 2.34c.37-.51.7-1.05.98-1.61-.54-.2-1.06-.45-1.55-.74.13-.1.26-.2.38-.3a14.16 14.16 0 0 0 12.17 0c.12.1.25.2.38.3-.49.29-1.01.54-1.55.74.28.56.61 1.1.98 1.61A19.85 19.85 0 0 0 26 14.76c.38-3.92-.64-7.34-2.68-10.39ZM10.46 12.66c-.9 0-1.64-.82-1.64-1.84 0-1.01.72-1.84 1.64-1.84.92 0 1.65.83 1.64 1.84 0 1.02-.72 1.84-1.64 1.84Zm5.84 0c-.9 0-1.64-.82-1.64-1.84 0-1.01.72-1.84 1.64-1.84.92 0 1.65.83 1.64 1.84 0 1.02-.72 1.84-1.64 1.84Z" transform="translate(-3)" />
      </svg>
    );
  }
  if (kind === "whatsapp") {
    return (
      <svg className="lat-contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88ZM20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.49 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.42Z" />
      </svg>
    );
  }
  if (kind === "x") {
    return (
      <svg className="lat-contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.23 6.92Zm-1.29 19.5h2.04L6.48 3.23H4.29Z" />
      </svg>
    );
  }
  return (
    <svg className="lat-contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56ZM22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0Z" />
    </svg>
  );
}

/* --------------------------- FRAGMENTS --------------------------- */

function FlowConnector({ index }: { index: number }) {
  const boltPath = flowBoltPaths[index % flowBoltPaths.length];
  const verticalBoltPath = flowBoltVerticalPaths[index % flowBoltVerticalPaths.length];

  return (
    <div className={`lat-flow-connector lat-flow-connector-${index + 1}`} aria-hidden="true">
      <svg className="lat-flow-bolt lat-flow-bolt-horizontal" viewBox="0 0 96 52" preserveAspectRatio="none">
        <path className="lat-flow-bolt-glow" d={boltPath} />
        <path className="lat-flow-bolt-core" d={boltPath} />
        <path className="lat-flow-bolt-surge" d={boltPath} />
      </svg>
      <svg className="lat-flow-bolt lat-flow-bolt-vertical" viewBox="0 0 52 96" preserveAspectRatio="none">
        <path className="lat-flow-bolt-glow" d={verticalBoltPath} />
        <path className="lat-flow-bolt-core" d={verticalBoltPath} />
        <path className="lat-flow-bolt-surge" d={verticalBoltPath} />
      </svg>
    </div>
  );
}

function ContactForm() {
  return (
    <form
      action="/w/open"
      aria-describedby="lat-contact-form-note"
      className="lat-contact-form r-fade"
      method="post"
      target="_blank"
    >
      <input name="source" type="hidden" value="lat-contact-form" />
      <input
        aria-hidden="true"
        autoComplete="off"
        className="lat-contact-honeypot"
        name="website"
        tabIndex={-1}
        type="text"
      />

      <div className="lat-contact-form-head">
        <p className="lat-section-kicker">Mensaje directo</p>
        <h3>Contanos qué querés resolver.</h3>
        <p id="lat-contact-form-note">
          Armamos el mensaje para que puedas enviarlo por el canal oficial sin perder contexto.
        </p>
      </div>

      <div className="lat-contact-fields">
        <label className="lat-contact-field" htmlFor="lat-contact-name">
          <span>Nombre</span>
          <input autoComplete="name" id="lat-contact-name" name="name" placeholder="Tu nombre" required type="text" />
        </label>
        <label className="lat-contact-field" htmlFor="lat-contact-email">
          <span>Email</span>
          <input autoComplete="email" id="lat-contact-email" name="email" placeholder="tu@email.com" required type="email" />
        </label>
        <label className="lat-contact-field lat-contact-field-wide" htmlFor="lat-contact-subject">
          <span>Asunto</span>
          <input id="lat-contact-subject" name="subject" placeholder="Integración, soporte, partnership..." required type="text" />
        </label>
        <label className="lat-contact-field lat-contact-field-wide" htmlFor="lat-contact-message">
          <span>Mensaje</span>
          <textarea id="lat-contact-message" name="message" placeholder="Danos contexto y un contacto para responderte." rows={5} />
        </label>
      </div>

      {TURNSTILE_SITE_KEY ? (
        <div
          className="cf-turnstile wapu-turnstile lat-contact-turnstile"
          data-sitekey={TURNSTILE_SITE_KEY}
          data-theme="dark"
        />
      ) : (
        <p className="wapu-captcha-error">
          Falta configurar la proteccion anti-bot. Defini NEXT_PUBLIC_TURNSTILE_SITE_KEY.
        </p>
      )}

      <button className="lat-primary-btn lat-contact-submit" type="submit">Abrir mensaje →</button>
    </form>
  );
}

/* --------------------------- ANIMATIONS HOOK --------------------------- */

function useLatAnimations() {
  useEffect(() => {
    const $ = <T extends Element = Element>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
    const $$ = <T extends Element = Element>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    /* Hero in-view gate: pausa parallax + spotlight cuando el hero sale del viewport */
    const heroSection = $<HTMLElement>(".lat-hero");
    let heroVisible = true;
    let onHeroVisibilityChange: ((visible: boolean) => void) | null = null;
    if (heroSection && "IntersectionObserver" in window) {
      const heroIo = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          heroVisible = entry.isIntersecting;
          onHeroVisibilityChange?.(heroVisible);
        },
        { rootMargin: "0px 0px 0px 0px", threshold: 0 },
      );
      heroIo.observe(heroSection);
      cleanups.push(() => heroIo.disconnect());
    }

    /* Hero phone parallax + spotlight: un solo pointermove + rAF compartido */
    const spotlight = $<HTMLDivElement>(".lat-spotlight");
    const visualWrap = $<HTMLDivElement>(".lat-visual-wrap");
    const phoneWrap = $<HTMLDivElement>(".lat-phone-wrap");
    const phoneGlow = $<HTMLDivElement>(".lat-phone-glow");

    if (!prefersReduced && (spotlight || (visualWrap && phoneWrap))) {
      let stx = innerWidth / 2, sty = innerHeight / 3, scx = stx, scy = sty;
      let ptx = 0, pty = 0, pcx = 0, pcy = 0;
      let rect = visualWrap ? visualWrap.getBoundingClientRect() : null;
      let raf = 0;
      let active = true;
      let needsScrollRect = false;

      const updateRect = () => {
        if (visualWrap) rect = visualWrap.getBoundingClientRect();
      };

      const tick = () => {
        raf = 0;
        if (!active) return;
        let busy = false;

        if (spotlight) {
          scx += (stx - scx) * 0.18;
          scy += (sty - scy) * 0.18;
          spotlight.style.setProperty("--mx", scx + "px");
          spotlight.style.setProperty("--my", scy + "px");
          if (Math.abs(stx - scx) > 0.5 || Math.abs(sty - scy) > 0.5) busy = true;
        }

        if (phoneWrap) {
          pcx += (ptx - pcx) * 0.10;
          pcy += (pty - pcy) * 0.10;
          phoneWrap.style.transform = `translate(-50%, -50%) translate3d(${pcx * 18}px, ${pcy * 14}px, 0)`;
          if (phoneGlow) {
            phoneGlow.style.setProperty("--gx", 50 + pcx * 26 + "%");
            phoneGlow.style.setProperty("--gy", 50 + pcy * 22 + "%");
          }
          if (Math.abs(ptx - pcx) > 0.001 || Math.abs(pty - pcy) > 0.001) busy = true;
        }

        if (busy) raf = requestAnimationFrame(tick);
      };

      const requestTick = () => {
        if (!active) return;
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const onMove = (e: PointerEvent) => {
        if (!active) return;
        stx = e.clientX;
        sty = e.clientY;
        if (visualWrap && phoneWrap) {
          if (needsScrollRect) { updateRect(); needsScrollRect = false; }
          const r = rect;
          if (r) {
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            ptx = Math.max(-1, Math.min(1, nx * 2));
            pty = Math.max(-1, Math.min(1, ny * 2));
          }
        }
        requestTick();
      };

      const onLeave = () => { ptx = 0; pty = 0; requestTick(); };
      const onResize = () => { updateRect(); };
      const onScroll = () => { needsScrollRect = true; };

      addEventListener("pointermove", onMove, { passive: true });
      addEventListener("resize", onResize, { passive: true });
      addEventListener("scroll", onScroll, { passive: true });
      if (visualWrap) visualWrap.addEventListener("pointerleave", onLeave, { passive: true });

      onHeroVisibilityChange = (visible) => {
        active = visible;
        if (visible) requestTick();
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      };

      requestTick();

      cleanups.push(() => {
        removeEventListener("pointermove", onMove);
        removeEventListener("resize", onResize);
        removeEventListener("scroll", onScroll);
        if (visualWrap) visualWrap.removeEventListener("pointerleave", onLeave);
        if (raf) cancelAnimationFrame(raf);
        onHeroVisibilityChange = null;
      });
    }

    /* Pausa de órbitas de monedas cuando el hero sale de viewport */
    if (visualWrap) {
      const prev = onHeroVisibilityChange;
      onHeroVisibilityChange = (visible) => {
        prev?.(visible);
        visualWrap.classList.toggle("lat-hero-offscreen", !visible);
      };
    }

    /* Scroll handler unificado vía rAF: nav-stuck + flow progress */
    const navWrap = $<HTMLDivElement>(".lat-nav-wrap");
    const flowTrack = $<HTMLDivElement>(".lat-flow-track");
    const flowNodes = $$<HTMLElement>(".lat-flow-node");
    const flowFill = $<HTMLDivElement>(".lat-flow-rail-fill");
    if (navWrap || (flowTrack && flowNodes.length)) {
      let scheduled = false;
      let lastStuck: boolean | null = null;
      let lastActive = -1;
      const runScrollWork = () => {
        scheduled = false;
        if (navWrap) {
          const stuck = scrollY > 24;
          if (stuck !== lastStuck) {
            navWrap.classList.toggle("is-stuck", stuck);
            lastStuck = stuck;
          }
        }
        if (flowTrack && flowNodes.length) {
          const r = flowTrack.getBoundingClientRect();
          const total = r.height + innerHeight * 0.6;
          const traveled = innerHeight - r.top;
          const progress = Math.max(0, Math.min(1, traveled / total));
          const active = Math.min(flowNodes.length - 1, Math.floor(progress * flowNodes.length));
          if (active !== lastActive) {
            flowNodes.forEach((n, i) => { n.dataset.active = i <= active ? "true" : "false"; });
            if (flowFill) flowFill.style.width = ((active + 1) / flowNodes.length) * 100 + "%";
            lastActive = active;
          }
        }
      };
      const onScroll = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(runScrollWork);
      };
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll, { passive: true });
      runScrollWork();
      cleanups.push(() => {
        removeEventListener("scroll", onScroll);
        removeEventListener("resize", onScroll);
      });
    }

    /* Reveal: solo IntersectionObserver (sin fallback de scroll) */
    const revealTargets = $$(".r-fade, .r-stagger");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
      );
      revealTargets.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    } else {
      revealTargets.forEach((el) => el.classList.add("is-in"));
    }

    /* Orange token easter egg: insist on the No KYC sticker */
    const orangeWrap = $<HTMLDivElement>(".lat-visual-wrap");
    const orangeSticker = orangeWrap ? $<HTMLDivElement>(".lat-sticker-hero", orangeWrap) : null;
    if (orangeWrap) {
      const ORANGE_UNLOCK_CLICKS = 20;
      let orangeClickCount = 0;
      const unlockOrange = () => {
        orangeWrap.classList.add("lat-orange-easter-active");
      };
      const onOrangePress = (event: PointerEvent) => {
        if (!orangeSticker || orangeWrap.classList.contains("lat-orange-easter-active")) return;
        const rect = orangeSticker.getBoundingClientRect();
        const isInsideSticker =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!isInsideSticker) return;
        orangeClickCount += 1;
        if (orangeClickCount >= ORANGE_UNLOCK_CLICKS) unlockOrange();
      };
      orangeWrap.addEventListener("pointerdown", onOrangePress);
      cleanups.push(() => {
        orangeWrap.removeEventListener("pointerdown", onOrangePress);
      });
    }

    /* Contact links cursor glow */
    const contactLinks = $$<HTMLAnchorElement>(".lat-contact-link");
    const linkMoveHandlers: Array<[HTMLAnchorElement, (e: PointerEvent) => void]> = [];
    contactLinks.forEach((el) => {
      const handler = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--lx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--ly", ((e.clientY - r.top) / r.height) * 100 + "%");
      };
      el.addEventListener("pointermove", handler);
      linkMoveHandlers.push([el, handler]);
    });
    cleanups.push(() => linkMoveHandlers.forEach(([el, h]) => el.removeEventListener("pointermove", h)));

    /* Marquee duplicate for seamless loop */
    $$<HTMLElement>(".lat-marquee").forEach((m) => {
      if (m.dataset.dup) return;
      m.innerHTML += m.innerHTML;
      m.dataset.dup = "1";
    });

    /* Smooth scroll for in-page anchors */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      const t = id && document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + scrollY - 80;
      scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    };
    document.addEventListener("click", onClick);
    cleanups.push(() => document.removeEventListener("click", onClick));

    return () => { cleanups.forEach((fn) => fn()); };
  }, []);
}

function useTutorialTimelineStep() {
  const [activeStep, setActiveStep] = useState(DEFAULT_TUTORIAL_STEP);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as Partial<{ type: string; step: string }> | null;

      if (data?.type !== TUTORIAL_STEP_EVENT || typeof data.step !== "string") return;
      if (!TUTORIAL_STEP_IDS.has(data.step)) return;

      setActiveStep(data.step);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return activeStep;
}

/* ----------------------------- PAGE ----------------------------- */

export default function LatLanding() {
  useLatAnimations();
  const activeTutorialStep = useTutorialTimelineStep();

  return (
    <main className="lat-page">
      <Script async defer src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="lat-spotlight" aria-hidden="true" />
      <div className="lat-noise" aria-hidden="true" />

      {/* NAV (sticky + blur) */}
      <div className="lat-nav-wrap">
        <header className="lat-nav">
          <Link className="lat-brand" href="/">
            <span className="lat-brand-mark">wap<span className="lat-brand-u">u</span></span>
            <span className="lat-brand-badge">Argentina</span>
          </Link>
          <nav aria-label="Secciones" className="lat-nav-links">
            <a href="#flujo">Flujo</a>
            <a href="#escrow">Escrow</a>
            <a href="#ayuda">Ayuda</a>
            <a href="#contacto">Contacto</a>
            <Link aria-label="Ir a la landing de Wapu CLI y API" className="lat-nav-cta lat-nav-cli-api" href="/dev">CLI + API</Link>
            <a className="lat-nav-cta" href={WAPU_SIGNUP_URL} {...WAPU_SIGNUP_LINK_PROPS}>Entrar a Wapu</a>
          </nav>
        </header>
      </div>

      {/* HERO */}
      <section className="lat-hero">
        <div className="lat-grid-bg" aria-hidden="true" />
        <div className="lat-shell">
          <div className="lat-hero-layout">
            <div className="lat-hero-copy">
              <span className="lat-tape" style={{ top: "-26px", left: "-12px" }} aria-hidden="true" />
              <p className="lat-kicker-pill"><span className="dot" />P2P asistido · Argentina · Sin KYC</p>
              <h1 className="lat-transfer-title">
                Transferí pesos usando tus <span className="lat-it">BTC</span> o <span className="lat-it">USDT</span>, sin <span className="lat-strike">KYC</span>.
              </h1>
              <div className="lat-actions">
                <a className="lat-primary-btn" href={WAPU_SIGNUP_URL} {...WAPU_SIGNUP_LINK_PROPS}>Entrar a Wapu →</a>
                <a className="lat-secondary-btn" href="#video">Ver flujo</a>
              </div>
              <div className="lat-proof-row" aria-label="Atributos del producto">
                <span>Sin formularios de identidad</span>
                <span>P2P</span>
                <span>Salida a ARS</span>
              </div>
            </div>

            <div className="lat-visual-wrap" aria-hidden="true">
              <div className="lat-phone-wrap">
                <div className="lat-phone-glow" />
                <div className="lat-phone">
                  <div className="lat-phone-bar">
                    <span className="lat-phone-logo">wapu</span>
                    <span className="lat-phone-avatar" />
                  </div>
                  <div className="lat-balance-label">Total balance</div>
                  <div className="lat-balance-card">
                    <strong>0.184 BTC</strong>
                    <span>P2P ready</span>
                  </div>
                  <div className="lat-action-grid">
                    <div>Depositar</div>
                    <div>Enviar</div>
                    <div>Earn</div>
                  </div>
                  <div className="lat-send-sheet">
                    <span>Enviar a alias</span>
                    <strong>mate.bitcoin.mp</strong>
                    <em>Normal · ARS</em>
                  </div>
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
              <div className="lat-coin lat-coin-c">
                <ArsMark />
                <span>ARS</span>
              </div>
              <div className="lat-coin lat-coin-orange">
                <OrangeMark />
                <span>NARANJA</span>
              </div>

              <div className="lat-sticker lat-sticker-hero" aria-hidden="true">
                <Image
                  alt=""
                  className="lat-sticker-image"
                  fill
                  priority
                  sizes="(max-width: 640px) 96px, (max-width: 980px) 108px, 132px"
                  src="/no-kyc-no-requerido.png"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <div className="lat-marquee-wrap" aria-hidden="true">
        <div className="lat-marquee">
          <span className="lat-marquee-dot-pink">Sin KYC</span>
          <span className="lat-marquee-dot-yellow">P2P AUTOMÁTICO</span>
          <span className="lat-marquee-dot-pink">Escrow real</span>
          <span className="lat-marquee-dot-yellow">Salida ARS</span>
          <span className="lat-marquee-dot-pink">Sin permiso</span>
          <span className="lat-marquee-dot-yellow">Argentina primero</span>
        </div>
      </div>

      {/* MANIFEST */}
      <section className="lat-section lat-manifest r-fade">
        <div className="lat-shell">
          <h2>No necesitás pedir <span className="lat-scribble">permiso</span> para mover tu dinero.</h2>
          <p>
            Wapu no te obliga a convertir tu privacidad en un formulario. Es una experiencia P2P asistida para operar con
            activos digitales y resolver pagos en Argentina con menos friccion, reglas claras y control operativo.
          </p>
        </div>
      </section>

      {/* FLOW */}
      <section className="lat-flow-section" id="flujo">
        <div className="lat-shell">
          <div className="lat-section-head r-fade">
            <div>
              <p className="lat-section-kicker">El flujo</p>
              <h2>Cripto entra. <span className="lat-it">Pesos</span> salen.</h2>
            </div>
            <p>Cuatro movimientos. Vos hacés tres clicks. Wapu coordina lo de atrás.</p>
          </div>

          <div className="lat-flow-track">
            <div className="lat-steps r-stagger" aria-label="Flujo para convertir cripto en pesos con Wapu">
              {operationSteps.map((step, index) => (
                <Fragment key={step.eyebrow}>
                  <article className="lat-flow-node" data-active={index === 0 ? "true" : "false"}>
                    <span className="lat-flow-eyebrow">{step.eyebrow}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                  {index < operationSteps.length - 1 ? <FlowConnector index={index} /> : null}
                </Fragment>
              ))}
            </div>

            <div className="lat-flow-rail" aria-hidden="true">
              <div className="lat-flow-rail-fill" />
            </div>
          </div>
        </div>
      </section>

      {/* TUTORIAL ANIMATION */}
      <section className="lat-video-section r-fade" id="video">
        <div className="lat-shell lat-video-grid">
          <div className="lat-video-copy">
            <p className="lat-section-kicker">El flujo, en vivo</p>
            <h2>¿Cómo  <span className="lat-it">funciona?</span></h2>
            <div className="lat-video-status">
              <span>3 años</span>
              <strong>en producción</strong>
            </div>
            <p>
              La animación recorre una operación completa: depositar Bitcoin por Lightning y usar ese saldo para enviar
              pesos argentinos a un alias.
            </p>
            <div className="lat-video-timeline" aria-label="Paso a paso animado del flujo de Wapu">
              <div className="lat-video-timeline-bar" aria-hidden="true">
                <i />
              </div>
              <ol>
                {videoTimelineSteps.map((step) => (
                  <li
                    aria-current={step.eyebrow === activeTutorialStep ? "step" : undefined}
                    data-active={step.eyebrow === activeTutorialStep ? "true" : "false"}
                    key={step.eyebrow}
                  >
                    <span className="lat-video-step-index">{step.eyebrow}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="lat-video-frame">
            <iframe
              aria-label="Animacion del flujo de Wapu"
              className="lat-tutorial-player"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              src="/tutorial/index.html"
              title="Animacion del flujo de Wapu"
            />
          </div>
        </div>
      </section>

      {/* ESCROW */}
      <section className="lat-section r-fade" id="escrow">
        <div className="lat-shell">
          <div className="lat-section-head">
            <div>
              <p className="lat-section-kicker">Escrow invisible</p>
              <h2>No negociás con <span className="lat-scribble">desconocidos</span>.</h2>
            </div>
            <p>
              Wapu manda las transacciones a los operadores con más alto puntaje y confianza: Vos solo depositás, elegís destino y enviás.
            </p>
          </div>
          <div className="lat-escrow-band">
            <span>BTC</span>
            <i />
            <strong className="lat-escrow-label">
              <span className="lat-escrow-word">Escrow</span>
              <Image className="lat-escrow-logo-img" src="/wapu-logo.png" alt="Wapu" width={808} height={350} priority={false} />
            </strong>
            <i />
            <span>ARS</span>
          </div>
        </div>
      </section>

      {SHOW_BUY_BTC_MODULE ? (
        <section className="lat-section">
          <p className="lat-section-kicker">Comprar Bitcoin</p>
          <h2>Compra BTC sin KYC desde Wapu.</h2>
          <p>Modulo preparado para activarse cuando la compra este disponible.</p>
        </section>
      ) : null}

      {/* AUDIENCE */}
      <section className="lat-section" id="personas">
        <div className="lat-shell">
          <div className="lat-section-head r-fade">
            <div>
              <p className="lat-section-kicker">Para quiénes</p>
              <h2>Privacidad sin <span className="lat-it">teatro corporativo</span>.</h2>
            </div>
            <p>Wapu funciona igual para HODLers, freelancers bitcoiners y nómadas digital moviéndose por Latam.</p>
          </div>
          <div className="lat-audience-grid r-stagger">
            {audience.map((item) => (
              <article className="lat-audience-card" key={item.title}>
                <div className="lat-audience-media">
                  <span className="lat-audience-tag" style={{ background: item.tagBg, color: item.tagColor }}>{item.tag}</span>
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 720px) calc(100vw - 48px), (max-width: 980px) calc((100vw - 80px) / 2), 384px"
                  />
                </div>
                <div className="lat-audience-content">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HELP */}
      <section className="lat-section" id="ayuda">
        <div className="lat-shell">
          <div className="lat-section-head r-fade">
            <div>
              <p className="lat-section-kicker">Ayuda</p>
              <h2>Las dudas <span className="lat-it">honestas</span>.</h2>
            </div>
            <p>Sin promesa de magia. Cómo opera Wapu por debajo, en cinco preguntas.</p>
          </div>

          <div className="lat-help-list r-stagger">
            {helpItems.map((item) => (
              <details className="lat-help-item" key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="lat-section lat-contact-section" id="contacto">
        <div className="lat-shell">
          <div className="lat-section-head r-fade">
            <div>
              <p className="lat-section-kicker">Contacto</p>
              <h2>Elegí el <span className="lat-scribble">canal</span>.</h2>
            </div>
            <p>Dejanos nombre, email, asunto y contexto. Si preferís algo más directo, abajo tenés los canales oficiales.</p>
          </div>

          <div className="lat-contact-layout">
            <ContactForm />

            <div className="lat-contact-channels r-fade">
              <p className="lat-section-kicker">Canales directos</p>
              <div className="lat-contact-grid r-stagger" aria-label="Canales de contacto">
                {contactItems.map((item) => (
                  <a
                    aria-label={`Abrir ${item.label} de Wapu`}
                    className="lat-contact-link"
                    href={item.href}
                    key={item.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ContactIcon kind={item.kind} />
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lat-final-cta r-fade" id="cta">
        <div className="lat-shell lat-final-grid">
          <div>
            <p className="lat-section-kicker">Argentina primero</p>
            <h2>Entrá, depositá y mové Bitcoin sin <span className="lat-strike">KYC</span>.</h2>
            <p>La privacidad es un derecho, no nos interesa juntar tus datos.</p>
          </div>
          <a
            className="lat-primary-btn"
            href={WAPU_SIGNUP_URL}
            {...WAPU_SIGNUP_LINK_PROPS}
            style={{ minHeight: 60, padding: "0 30px", fontSize: 16 }}
          >
            Entrar a Wapu →
          </a>
        </div>
      </section>
    </main>
  );
}
