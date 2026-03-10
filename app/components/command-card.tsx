"use client";

import { useState } from "react";

type CommandCardProps = {
  label: string;
  command: string;
};

export default function CommandCard({ label, command }: CommandCardProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0a1a] p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <button
          onClick={onCopy}
          className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-2.5 py-1 text-xs font-semibold text-yellow-200 hover:bg-yellow-300/20"
          type="button"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto text-sm text-emerald-300">
        <code>{command}</code>
      </pre>
    </div>
  );
}
