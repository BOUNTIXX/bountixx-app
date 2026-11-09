"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, FileLock2, PenLine, ShieldCheck, Trophy } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppPage } from "@/components/landing/_section";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { formatRushDate, shortHash, type RushCampaign } from "@/lib/rushCampaign";
import { rushVaultTestnetId, rushVaultTestnetUrl } from "@/lib/rushConfig";
import { RushActivityList } from "./RushActivityList";
import { RushProofMarks } from "./RushProofMarks";

export function RushDetail({ slug }: { slug: string }) {
  const [campaign, setCampaign] = useState<RushCampaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetchWithAuth(`/api/rushes/${encodeURIComponent(slug)}`);
        const body = (await response.json().catch(() => ({}))) as { campaign?: RushCampaign; error?: string };
        if (!response.ok || !body.campaign) throw new Error(body.error ?? "Community Rush not found.");
        if (!cancelled) setCampaign(body.campaign);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Community Rush not found.");
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return <AppLayout><AppPage>{!campaign && !error ? <Loading /> : null}{error ? <Unavailable message={error} /> : null}{campaign ? <CampaignContent campaign={campaign} /> : null}</AppPage></AppLayout>;
}

function Loading() {
  return <div className="max-w-5xl animate-pulse space-y-5"><div className="h-8 w-36 rounded bg-[var(--surface-hover)]" /><div className="h-64 rounded-2xl bg-[var(--surface-inset)]" /></div>;
}

function Unavailable({ message }: { message: string }) {
  return <div className="max-w-xl rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-8"><CircleAlert size={24} className="text-danger" /><h1 className="mt-4 font-display text-2xl text-haze">This Rush is unavailable.</h1><p className="mt-3 font-body text-sm leading-relaxed text-haze-2">{message}</p><Link href="/rush" className="mt-6 inline-block"><Button variant="secondary">Back to Community Rush</Button></Link></div>;
}

function CampaignContent({ campaign }: { campaign: RushCampaign }) {
  const { manifest } = campaign;
  const isDraft = campaign.status === "draft";
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
    <header className="flex flex-col gap-5 border-b border-[var(--border-1)] pb-7 sm:flex-row sm:items-start sm:justify-between"><div><Link href="/rush" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-haze-3 transition hover:text-haze"><ArrowLeft size={13} /> Community Rush</Link><div className="mt-5 flex flex-wrap items-center gap-3"><span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${isDraft ? "border-coin-gold/30 bg-coin-gold/10 text-coin-gold" : campaign.verification === "verified" ? "border-success/30 bg-success/10 text-success" : "border-[var(--border-accent)] bg-[var(--void-tint)] text-[var(--brand-primary)]"}`}>{isDraft ? "Private draft" : campaign.verification === "verified" ? "Verified Rush" : "Standard Rush"}</span><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-haze-3">{campaign.community}</span></div><h1 className="mt-4 font-display text-3xl leading-tight text-haze sm:text-5xl">{campaign.name}</h1><p className="mt-5 max-w-3xl font-body text-base leading-relaxed text-haze-2">{campaign.summary}</p></div>{campaign.isOwner && isDraft ? <Link href={`/rush/${campaign.slug}/edit`}><Button><PenLine size={16} /> Continue draft</Button></Link> : null}</header>
    {isDraft ? <div className="flex gap-3 rounded-xl border border-coin-gold/30 bg-coin-gold/10 p-4"><CircleAlert size={18} className="mt-0.5 shrink-0 text-coin-gold" /><p className="font-body text-sm leading-relaxed text-haze-2">Only you can see this draft. Publish when its schedule, programme, scoring, and reward terms are ready to become an immutable campaign record.</p></div> : null}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-6"><Rules manifest={manifest} /><RushActivityList activities={campaign.activities} /><RushProofMarks attestations={campaign.attestations} />{campaign.verification === "verified" ? <VerifiedNotice /> : null}</div><aside className="h-fit space-y-4 lg:sticky lg:top-24"><RewardCard campaign={campaign} /><ProofCard campaign={campaign} /></aside></div>
  </div>;
}

function Rules({ manifest }: { manifest: RushCampaign["manifest"] }) {
  return <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-6 sm:p-8"><h2 className="font-display text-2xl text-haze">The event rules</h2><dl className="mt-6 grid gap-5 sm:grid-cols-2"><Rule label="Challenge" value={manifest.challengeType} /><Rule label="Scoring" value={manifest.scoringMethod} /><Rule label="Starts" value={formatRushDate(manifest.startsAt)} /><Rule label="Ends" value={formatRushDate(manifest.endsAt)} /><Rule label="Payout" value={manifest.payout === "ranked" ? "Ranked rewards" : "Winner takes all"} /><Rule label="Result policy" value={manifest.resultPolicy === "deterministic" ? "Deterministic" : "Organiser reviewed"} /></dl></section>;
}

function VerifiedNotice() {
  return <section className="rounded-2xl border border-success/25 bg-success/5 p-6 sm:p-8"><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-success" /><h2 className="font-display text-2xl text-haze">Verified Rush status</h2></div><p className="mt-4 font-body text-sm leading-relaxed text-haze-2">This is a published Testnet XLM rule record. A sponsor-funded vault, verifier attestation, and settlement transaction are separate steps and are not represented as live here.</p><a href={rushVaultTestnetUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-success transition hover:text-haze">View the Testnet vault reference <span aria-hidden>↗</span></a></section>;
}

function RewardCard({ campaign }: { campaign: RushCampaign }) {
  const { manifest } = campaign;
  return <><div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-5"><Trophy size={19} className="text-coin-gold" /><p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-haze-3">Reward</p><p className="mt-2 font-display text-3xl text-haze">{manifest.prize.amount} <span className="text-xl text-coin-gold">{manifest.prize.asset}</span></p><p className="mt-2 font-body text-xs leading-relaxed text-haze-3">{campaign.verification === "verified" ? "Testnet rules only. Funding is not implied." : "Non-transferable Bountixx points."}</p></div>{campaign.verification === "verified" ? <div className="rounded-2xl border border-success/25 bg-success/5 p-5"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-success">Testnet vault</p><p className="mt-2 break-all font-mono text-xs leading-relaxed text-haze-2">{rushVaultTestnetId}</p><p className="mt-3 font-body text-xs leading-relaxed text-haze-3">A deployed empty vault. It is not evidence that this campaign has funding.</p></div> : null}</>;
}

function ProofCard({ campaign }: { campaign: RushCampaign }) {
  return <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-5"><FileLock2 size={18} className="text-[var(--brand-primary)]" /><p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-haze-3">Manifest proof</p><p className="mt-2 break-all font-mono text-xs leading-relaxed text-haze-2">{shortHash(campaign.manifestHash)}</p><p className="mt-3 font-body text-xs leading-relaxed text-haze-3">{campaign.manifestHash ? "Canonical rules locked at publication." : "The manifest will be hashed when published."}</p></div>;
}

function Rule({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-haze-3">{label}</dt><dd className="mt-2 font-body text-sm leading-relaxed text-haze">{value}</dd></div>;
}
