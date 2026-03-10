import Image from "next/image";
import CommandCard from "./components/command-card";

const useCases = [
  {
    title: "👨‍💻 Para developers",
    description:
      "Probá depósitos y retiros desde terminal antes de tocar frontend. Menos fricción, más shipping.",
  },
  {
    title: "🛠️ Para servidores y scripts",
    description:
      "Integración server-to-server en pipelines, cronjobs y bots. Flujo simple: depositás BTC/USDT y retirás ARS.",
  },
  {
    title: "🦞 Para agentes de IA",
    description:
      "Un CLI que tu abuela podría usar… y tu agente también. Conectá comandos para ejecutar pagos reales.",
  },
  {
    title: "🚀 Para emprendedores bitcoiners",
    description:
      "Onboardeá comercios pidiendo solo un alias/CBU para retiros. Hiperbitcoinizar sin vueltas.",
  },
];

const benefits = [
  "Sin KYC",
  "P2P",
  "Open Source",
  "Gratuito",
  "Fácil de integrar a tu app",
  "Probado 3 años en producción",
];

export default function Home() {
  return (
    <main className="relative overflow-x-hidden bg-[#0a0712] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(151,71,255,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(0,201,255,0.15),transparent_30%)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pt-10 pb-16 md:px-10">
        <header className="mb-12 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <Image src="/wapuLogo.svg" alt="Wapu" width={120} height={32} priority />
            <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-200">
              CLI + API
            </span>
          </div>
          <a
            href="https://github.com/wapu-app/wapu-cli"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
          >
            Ver GitHub
          </a>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-300">Wapu</p>
            <h1 className="text-balance text-4xl leading-tight font-black md:text-6xl">
              Hacemos Bitcoinizar pagos
              <span className="block text-fuchsia-300">brutalmente simple.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-300">
              Wapu CLI y Wapu API son el mismo músculo: depositás por Lightning y enviás pesos a un alias/CBU.
              Diseñado para bitcoiners, programadores y equipos que quieren onbordear rápido.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {benefits.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-100"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="https://github.com/wapu-app/wapu-cli"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-5 py-3 text-sm font-bold text-[#12091f] transition hover:scale-[1.02]"
              >
                Empezar ahora
              </a>
              <a
                href="#comandos"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Ver comandos
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-r from-fuchsia-500/25 to-cyan-400/25 blur-2xl" />
            <Image
              src="/wapu-hero.png"
              alt="Wapu visual"
              width={1140}
              height={350}
              className="w-full rounded-3xl border border-white/10 object-cover"
            />
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-20 md:px-10" id="flujo">
        <h2 className="text-3xl font-extrabold md:text-4xl">Flujo de uso</h2>
        <p className="mt-3 max-w-2xl text-zinc-300">Propagando Bitcoin como un virus que arregla el dinero.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {["Deposita BTC via Lightning", "Wapu enruta", "Recibis ARS por alias/CBU"].map((step, idx) => (
            <div key={step} className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-cyan-300">Paso {idx + 1}</p>
              <p className="mt-2 text-lg font-semibold">{step}</p>
              {idx < 2 && <span className="electric-line absolute top-1/2 -right-6 hidden h-[2px] w-12 md:block" />}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-10" id="comandos">
        <h2 className="text-3xl font-extrabold md:text-4xl">Dos comandos. Cero drama.</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <CommandCard
            label="Crear depósito Lightning"
            command="wapu deposit lightning create --amount 10 --currency SAT"
          />

          <CommandCard
            label="Enviar dinero ARS"
            command="wapu withdraw ars --type fiat_transfer --alias comercio.alias --amount 1000 --receiver-name 'Juan Perez'"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <h2 className="text-3xl font-extrabold md:text-4xl">Casos de uso reales</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {useCases.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-zinc-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="text-3xl font-black md:text-4xl">Listo para bitcoinizar su producto?</h2>
            <p className="mt-2 text-zinc-300">Wapu es Open Source, gratuito y fácil de integrar.</p>
          </div>
          <a
            href="https://github.com/wapu-app/wapu-cli"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 font-bold text-[#12091f]"
          >
            Ir al repo del CLI
          </a>
        </div>
      </section>
    </main>
  );
}
