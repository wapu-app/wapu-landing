# Wapu Landing

Landing oficial de **Wapu CLI + Wapu API**.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Desarrollo local

```bash
npm install
npm run dev
```

En desarrollo, Turnstile usa las claves dummy oficiales de Cloudflare para que el captcha no bloquee Playwright ni pruebas locales.

## Campañas de registro

La home acepta `?campaign=stikers`, `twitter`, `instagram` o `tarjetas` para
seleccionar el referido de sus botones de registro, sin cambiar el contenido.
Mapeo, límites y pruebas: [campaign signup links](docs/2026-10-19-campaign-signup-links.md).

## Variables de entorno

Para produccion, crear un widget de Cloudflare Turnstile y configurar:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` se usa para renderizar el widget en el navegador. `TURNSTILE_SECRET_KEY` se usa solo en el servidor para validar el token contra Cloudflare.

Guia paso a paso para Vercel: [docs/turnstile-vercel.md](docs/turnstile-vercel.md)

## Build

```bash
npm run build
npm start
```

## Deploy

Deployado en Vercel.

- Producción: https://wapu.shiafu.com
- Fallback: https://wapu-landing.vercel.app

## Repo

https://github.com/wapu-app/wapu-landing
