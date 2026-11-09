import { BadgeCheck, FileSignature } from "lucide-react";
import type { ResultAttestation } from "@bountixx/rush-sdk";

function short(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export function RushProofMarks({ attestations }: { attestations: ResultAttestation[] | undefined }) {
  if (!attestations?.length) return null;

  return <section className="rounded-2xl border border-success/25 bg-success/5 p-6 sm:p-8"><div className="flex items-center gap-3"><BadgeCheck size={20} className="text-success" /><div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-success">Proof Marks</p><h2 className="mt-1 font-display text-2xl text-haze">Verified result record</h2></div></div><div className="mt-6 space-y-3">{attestations.map((attestation) => <article key={attestation.signature} className="rounded-xl border border-success/20 bg-[var(--surface-inset)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-haze"><FileSignature size={16} className="text-success" /> {attestation.verifierKeyId}</span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-haze-3">{new Date(attestation.issuedAt).toLocaleString()}</span></div><dl className="mt-4 grid gap-3 font-mono text-[10px] leading-relaxed sm:grid-cols-2"><div><dt className="uppercase tracking-[0.12em] text-haze-3">Winner address</dt><dd className="mt-1 break-all text-haze-2">{attestation.winnerAddress}</dd></div><div><dt className="uppercase tracking-[0.12em] text-haze-3">Result digest</dt><dd className="mt-1 break-all text-haze-2">{short(attestation.resultHash)}</dd></div></dl></article>)}</div></section>;
}
