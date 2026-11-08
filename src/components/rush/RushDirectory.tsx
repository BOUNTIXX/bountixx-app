"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { formatRushDate, type RushCampaign } from "@/lib/rushCampaign";

export function RushDirectory() {
  const [campaigns, setCampaigns] = useState<RushCampaign[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetchWithAuth("/api/rushes");
        const body = (await response.json().catch(() => ({}))) as { campaigns?: RushCampaign[] };
        if (!response.ok) throw new Error();
        if (!cancelled) setCampaigns((body.campaigns ?? []).filter((campaign) => campaign.status === "published"));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-6 sm:p-8">
      <div className="flex flex-col gap-5 border-b border-[var(--border-1)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand-primary)]">Published campaigns</p>
          <h2 className="mt-3 font-display text-2xl text-haze sm:text-3xl">Find a Rush with rules you can inspect.</h2>
        </div>
        <div className="flex flex-wrap gap-3"><Link href="/rush/manage"><Button size="sm" variant="secondary">Manage mine</Button></Link><Link href="/rush/new"><Button size="sm"><Plus size={15} /> Start a Rush</Button></Link></div>
      </div>

      {campaigns === null && !error ? <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="h-44 animate-pulse rounded-xl bg-[var(--surface-hover)]" /><div className="h-44 animate-pulse rounded-xl bg-[var(--surface-hover)]" /></div> : null}
      {error ? <p className="mt-6 font-body text-sm text-haze-3">The campaign directory is temporarily unavailable. You can still create and manage your own Rush.</p> : null}
      {campaigns?.length === 0 ? <div className="mt-8 grid place-items-center rounded-xl border border-dashed border-[var(--border-2)] px-6 py-12 text-center"><Sparkles size={24} className="text-coin-gold" /><h3 className="mt-4 font-display text-xl text-haze">The first public Rush starts here.</h3><p className="mt-2 max-w-md font-body text-sm leading-relaxed text-haze-3">Create a campaign, make the rules clear, and publish only when the event is ready to be visible.</p></div> : null}
      {campaigns && campaigns.length > 0 ? <div className="mt-6 grid gap-4 md:grid-cols-2">{campaigns.map((campaign) => <Link key={campaign.id} href={`/rush/${campaign.slug}`} className="group rounded-xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-5 transition hover:border-[var(--border-accent)] hover:bg-[var(--surface-hover)]"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-haze-3">{campaign.community}</p><h3 className="mt-2 font-display text-xl text-haze">{campaign.name}</h3></div><span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${campaign.verification === "verified" ? "border-success/30 bg-success/10 text-success" : "border-coin-gold/30 bg-coin-gold/10 text-coin-gold"}`}>{campaign.verification === "verified" ? "Verified" : "Crowns"}</span></div><p className="mt-4 line-clamp-2 font-body text-sm leading-relaxed text-haze-2">{campaign.summary}</p><div className="mt-5 flex items-center justify-between border-t border-[var(--border-1)] pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-haze-3"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {formatRushDate(campaign.manifest.startsAt)}</span><span className="inline-flex items-center gap-1.5 text-[var(--brand-primary)]">Inspect rules <ArrowRight size={13} /></span></div></Link>)}</div> : null}
    </section>
  );
}
