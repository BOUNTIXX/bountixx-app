"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Landmark } from "lucide-react";
import { stroopsToXlm, type VaultCampaignView } from "@bountixx/rush-sdk";
import { rushVaultTestnetId, rushVaultTestnetUrl } from "@/lib/rushConfig";

const LABELS: Record<VaultCampaignView["status"], { title: string; detail: string; tone: string }> = {
  unfunded: { title: "Not funded", detail: "No sponsor has funded this campaign in the Testnet vault. No reward is promised.", tone: "text-haze-2" },
  funded: { title: "Funded", detail: "A sponsor has locked this prize in the Testnet vault. It pays out only after a verifier-signed result.", tone: "text-success" },
  settled: { title: "Settled", detail: "The Testnet vault paid the attested winner.", tone: "text-success" },
  refunded: { title: "Refunded", detail: "The deadline passed without settlement and the sponsor recovered the prize.", tone: "text-coin-gold" },
};

function short(value: string): string {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

/** Live, read-only vault state. Shows facts from Stellar Testnet, never an implied payout. */
export function RushVaultStatus({ slug }: { slug: string }) {
  const [vault, setVault] = useState<VaultCampaignView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/rushes/${encodeURIComponent(slug)}/vault`, { cache: "no-store" });
        const body = (await response.json().catch(() => ({}))) as { vault?: VaultCampaignView; error?: string };
        if (!response.ok || !body.vault) throw new Error(body.error ?? "The Testnet vault could not be read.");
        if (!cancelled) setVault(body.vault);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "The Testnet vault could not be read.");
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const label = vault ? LABELS[vault.status] : null;
  return <div className="rounded-2xl border border-success/25 bg-success/5 p-5">
    <div className="flex items-center gap-2"><Landmark size={16} className="text-success" /><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-success">Testnet vault</p></div>
    {!vault && !error ? <div className="mt-3 h-10 animate-pulse rounded bg-[var(--surface-hover)]" /> : null}
    {error ? <p className="mt-3 flex gap-2 font-body text-xs leading-relaxed text-haze-3"><CircleAlert size={14} className="mt-0.5 shrink-0" />{error}</p> : null}
    {vault && label ? <>
      <p className={`mt-3 font-display text-xl ${label.tone}`}>{label.title}</p>
      <p className="mt-2 font-body text-xs leading-relaxed text-haze-3">{label.detail}</p>
      {vault.amountStroops ? <p className="mt-3 font-mono text-xs text-haze-2">{stroopsToXlm(vault.amountStroops)} XLM locked{vault.sponsor ? ` by ${short(vault.sponsor)}` : ""}</p> : null}
      {vault.status !== "unfunded" && vault.manifestMatches === false ? <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-2 font-body text-xs text-danger">The on-chain manifest hash does not match these published rules.</p> : null}
      {vault.status !== "unfunded" && vault.manifestMatches ? <p className="mt-3 font-body text-xs text-success">On-chain manifest hash matches the published rules.</p> : null}
      <p className="mt-3 break-all font-mono text-[10px] leading-relaxed text-haze-3">Vault campaign key {short(vault.vaultCampaignId)}</p>
    </> : null}
    <a href={rushVaultTestnetUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all font-mono text-[10px] text-success transition hover:text-haze">{short(rushVaultTestnetId)} ↗</a>
  </div>;
}
