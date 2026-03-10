# AGENTS.md — wapu-landing

Guía rápida para agentes de IA que editen este proyecto.

## 1) Objetivo del proyecto

Landing estática de **Wapu CLI + Wapu API** enfocada en:
- bitcoiners
- developers/programadores
- emprendedores que quieren bitcoinizar cobros/pagos

Tono esperado:
- Español
- Semi-técnico
- No corporativo
- Vibe bitcoiner-builder

## 2) Stack y runtime

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Deploy en Vercel

Scripts:

```bash
npm install --include=dev
npm run dev
npm run lint
npm run build
npm start
```

## 3) Estructura actual (mínima)

```text
app/
  layout.tsx               # metadata global, idioma, favicon
  globals.css              # estilos globales + animaciones custom
  page.tsx                 # landing principal
  components/
    command-card.tsx       # componente client con botón copiar
public/
  wapuLogo.svg
  wapu-hero.png
  favicon.ico
```

## 4) Convenciones de edición

1. **No romper copy aprobado** sin pedido explícito.
2. Mantener foco en 2 comandos principales en la landing:
   - `wapu deposit lightning create --amount 10 --currency SAT`
   - `wapu withdraw ars --type fiat_transfer --alias ... --amount ...`
3. Si agregás interacciones de UI, cuidar que:
   - no afecten performance móvil
   - no distraigan del CTA principal
4. El botón de copiar vive en `app/components/command-card.tsx` y usa `navigator.clipboard`.
5. Evitar dependencias nuevas salvo necesidad real.

## 5) Deploy y dominio

- Repo: `https://github.com/wapu-app/wapu-landing`
- Dominio prod: `https://wapu.shiafu.com`
- Fallback: `https://wapu-landing.vercel.app`

Comando de deploy manual:

```bash
vercel --token "$VERCEL_API_KEY" --prod --yes
```

## 6) Lecciones aprendidas (importante)

### 6.1 DNS/SSL en subdominio
Caso real: `ERR_SSL_PROTOCOL_ERROR` en `wapu.shiafu.com`.

Causa:
- faltaba registro específico `A` para `wapu`
- el wildcard `*` apuntaba a otra IP, generando mismatch de destino/cert

Solución aplicada:

```bash
vercel dns add shiafu.com wapu A 76.76.21.21 --token "$VERCEL_API_KEY"
vercel domains inspect wapu.shiafu.com --token "$VERCEL_API_KEY"
```

Checklist cuando algo “anda en .vercel.app pero no en dominio custom”:
1. `vercel domains inspect <dominio>`
2. confirmar `A` del subdominio a `76.76.21.21`
3. verificar alias al deployment actual
4. validar con `curl -Iv https://dominio`

### 6.2 Entorno local de agente puede no tener Chromium usable
- Se intentó Playwright Chromium y falló por libs del sistema faltantes (`libnspr4.so`).
- Si no hay permisos root, usar validaciones de red/TLS por CLI (`curl -Iv`) y pedir prueba visual al humano.

### 6.3 Dependencias dev pueden quedar fuera
Si `npm run lint` falla con `eslint: not found`, reinstalar con:

```bash
npm install --include=dev
```

## 7) QA mínimo antes de commitear

1. `npm run lint` sin errores
2. `npm run build` exitoso
3. revisar en mobile + desktop
4. validar que CTA principal sigue apuntando a:
   - `https://github.com/wapu-app/wapu-cli`

## 8) Commits sugeridos

Formato recomendado:
- `feat: ...` cambios de UI/copy
- `fix: ...` correcciones
- `chore: ...` tareas técnicas

Evitar commits gigantes: preferir cambios atómicos.

## 9) Qué NO tocar sin aprobación

- identidad de marca Wapu
- tono general del copy
- dominio productivo
- claims sensibles (sin KYC, p2p, etc.)

---

Si sos un agente nuevo: empezá por `app/page.tsx`, luego `app/components/command-card.tsx`, y por último `app/globals.css` para animaciones.
