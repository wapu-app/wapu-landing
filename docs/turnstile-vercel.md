# Guia: configurar Turnstile en Vercel

Esta guia resuelve el aviso:

```text
Falta configurar la proteccion anti-bot. Defini NEXT_PUBLIC_TURNSTILE_SITE_KEY.
```

El proyecto ya tiene el codigo para Cloudflare Turnstile. Lo que falta en produccion es configurar las variables de entorno (environment variables, variables de entorno) en Vercel.

## Que claves hacen falta

Cloudflare Turnstile entrega dos valores:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: site key (clave publica) que el navegador usa para renderizar el widget.
- `TURNSTILE_SECRET_KEY`: secret key (clave secreta) que el servidor usa para validar el token contra Cloudflare.

No son intercambiables. La site key puede ser publica; la secret key nunca debe exponerse en el cliente ni commitearse al repo.

## 1. Crear el widget en Cloudflare

1. Entrar a Cloudflare Dashboard.
2. Ir a Turnstile.
3. Crear un widget nuevo.
4. Usar un nombre reconocible, por ejemplo `wapu-landing-prod`.
5. Agregar los hostnames (dominios) donde va a correr:
   - `wapu.shiafu.com`
   - `wapu-landing.vercel.app`
   - los dominios preview de Vercel si se quiere probar Turnstile en previews.
6. Elegir el modo del widget. Para este caso, `Managed` suele ser el mejor punto de partida: Cloudflare decide cuando mostrar desafio y cuando dejar pasar sin friccion.
7. Guardar y copiar:
   - site key
   - secret key

Cloudflare documenta que cada widget tiene una sitekey publica y una secret key privada, y que la implementacion correcta requiere renderizar el widget en cliente y validar el token en servidor.

Fuente: https://developers.cloudflare.com/turnstile/get-started/

## 2. Configurar variables en Vercel Dashboard

1. Entrar a Vercel.
2. Abrir el proyecto `wapu-landing`.
3. Ir a `Settings` -> `Environment Variables`.
4. Agregar estas variables:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key de Cloudflare>
TURNSTILE_SECRET_KEY=<secret key de Cloudflare>
```

5. Marcar al menos el environment (ambiente) `Production`.
6. Si se quiere probar en deployments de preview, marcar tambien `Preview`.
7. Guardar los cambios.

Vercel aplica los cambios de variables solo a deployments nuevos. Un deployment anterior no empieza a usar claves nuevas automaticamente.

Fuente: https://vercel.com/docs/environment-variables

## 3. Redesplegar

Despues de guardar las variables, crear un deployment nuevo.

Opcion por Git:

```bash
git commit --allow-empty -m "chore: trigger vercel redeploy"
git push
```

Opcion por CLI:

```bash
vercel --prod
```

Si se usa el deploy manual documentado para este proyecto:

```bash
vercel --token "$VERCEL_API_KEY" --prod --yes
```

## 4. Validar que quedo activo

1. Abrir `https://wapu.shiafu.com/w`.
2. Confirmar que ya no aparece el mensaje:

```text
Falta configurar la proteccion anti-bot. Defini NEXT_PUBLIC_TURNSTILE_SITE_KEY.
```

3. Confirmar que aparece el widget de Turnstile.
4. Completar el flujo protegido.
5. Si el formulario devuelve error de verificacion, revisar `TURNSTILE_SECRET_KEY`: la site key puede renderizar el widget, pero sin secret key valida el servidor no puede aprobar el token.

## 5. Validacion por CLI

Para revisar que Vercel tiene las variables cargadas sin imprimir secretos:

```bash
vercel env ls
```

Para traer variables de desarrollo local desde Vercel:

```bash
vercel env pull
```

En local, este repo usa claves dummy de Cloudflare cuando `NODE_ENV` no es `production`, asi que no hace falta configurar Turnstile real para correr `npm run dev`.

## Problemas comunes

- El widget no aparece: falta `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en el environment correcto o el deployment es viejo.
- El widget aparece pero el envio falla: falta `TURNSTILE_SECRET_KEY`, esta mal copiada o no corresponde al mismo widget.
- Funciona en preview pero no en produccion: la variable se cargo solo en `Preview`, no en `Production`.
- Funciona en `vercel.app` pero no en `wapu.shiafu.com`: revisar que el hostname este permitido en el widget de Cloudflare.
- Se cambio una variable y no paso nada: crear un deployment nuevo; Vercel no aplica cambios de environment variables a deployments anteriores.

