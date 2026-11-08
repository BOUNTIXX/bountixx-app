"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  FileLock2,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppPage } from "@/components/landing/_section";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { RushCampaign, RushVerification } from "@/lib/rushCampaign";

type FormState = {
  slug: string;
  title: string;
  community: string;
  summary: string;
  arenaId: string;
  challengeType: "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme" | "mixed";
  scoringMethod: string;
  startsAt: string;
  endsAt: string;
  amount: string;
  payout: "ranked" | "winner-takes-all";
  resultPolicy: "deterministic" | "organizer-reviewed";
  verification: RushVerification;
};

const challengeOptions: { value: FormState["challengeType"]; label: string }[] = [
  { value: "coding", label: "Coding" },
  { value: "trivia", label: "Trivia" },
  { value: "logic", label: "Logic" },
  { value: "math", label: "Math" },
  { value: "writing", label: "Writing" },
  { value: "design", label: "Design" },
  { value: "meme", label: "Meme" },
  { value: "mixed", label: "Mixed" },
];

function dateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function defaultState(): FormState {
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    slug: "",
    title: "",
    community: "",
    summary: "",
    arenaId: "",
    challengeType: "coding",
    scoringMethod: "Published deterministic test cases",
    startsAt: dateTimeLocal(startsAt),
    endsAt: dateTimeLocal(endsAt),
    amount: "500",
    payout: "ranked",
    resultPolicy: "deterministic",
    verification: "standard",
  };
}

function stateFromCampaign(campaign: RushCampaign): FormState {
  const manifest = campaign.manifest;
  return {
    slug: campaign.slug,
    title: campaign.name,
    community: campaign.community,
    summary: campaign.summary,
    arenaId: manifest.arenaId,
    challengeType: manifest.challengeType,
    scoringMethod: manifest.scoringMethod,
    startsAt: dateTimeLocal(new Date(manifest.startsAt)),
    endsAt: dateTimeLocal(new Date(manifest.endsAt)),
    amount: manifest.prize.amount,
    payout: manifest.payout,
    resultPolicy: manifest.resultPolicy,
    verification: campaign.verification,
  };
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-haze-2">{label}</span>
      {children}
      {help ? <span className="mt-2 block font-body text-xs leading-relaxed text-haze-3">{help}</span> : null}
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-[var(--border-2)] bg-[var(--surface-inset)] px-4 py-3 font-body text-sm text-haze outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] placeholder:text-haze-3";

export function RushComposer({ draftSlug }: { draftSlug?: string }) {
  const router = useRouter();
  const intentRef = useRef<"draft" | "publish">("draft");
  const [form, setForm] = useState<FormState>(defaultState);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftSlug));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftSlug) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetchWithAuth(`/api/rushes/${encodeURIComponent(draftSlug)}`);
        const body = (await response.json().catch(() => ({}))) as { campaign?: RushCampaign; error?: string };
        if (!response.ok || !body.campaign) throw new Error(body.error ?? "Draft not found.");
        if (body.campaign.status !== "draft") throw new Error("Only drafts can be edited.");
        if (!cancelled) setForm(stateFromCampaign(body.campaign));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this draft.");
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();
    return () => { cancelled = true; };
  }, [draftSlug]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function setVerification(verification: RushVerification) {
    setForm((previous) => ({
      ...previous,
      verification,
      amount: verification === "verified" ? "25" : previous.amount || "500",
      resultPolicy: verification === "verified" ? "deterministic" : previous.resultPolicy,
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const publish = intentRef.current === "publish";

    if (publish && !window.confirm("Publish this Rush? Its manifest will be locked and cannot be edited.")) return;

    setSaving(true);
    try {
      const response = await fetchWithAuth(draftSlug ? `/api/rushes/${encodeURIComponent(draftSlug)}` : "/api/rushes", {
        method: draftSlug ? "PATCH" : "POST",
        body: JSON.stringify({
          slug: form.slug,
          community: form.community,
          summary: form.summary,
          verification: form.verification,
          publish,
          manifest: {
            arenaId: form.arenaId,
            title: form.title,
            challengeType: form.challengeType,
            rulesVersion: 1,
            scoringMethod: form.scoringMethod,
            startsAt: new Date(form.startsAt).toISOString(),
            endsAt: new Date(form.endsAt).toISOString(),
            prize: {
              asset: form.verification === "verified" ? "XLM" : "CROWNS",
              amount: form.amount,
              network: "TESTNET",
            },
            payout: form.payout,
            resultPolicy: form.resultPolicy,
          },
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { campaign?: RushCampaign; error?: string };
      if (!response.ok || !body.campaign) throw new Error(body.error ?? "Could not save this Community Rush.");
      router.push(`/rush/${body.campaign.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this Community Rush.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingDraft) {
    return (
      <AppLayout><AppPage><div className="max-w-4xl animate-pulse space-y-4"><div className="h-10 w-56 rounded bg-[var(--surface-hover)]" /><div className="h-96 rounded-2xl bg-[var(--surface-inset)]" /></div></AppPage></AppLayout>
    );
  }

  return (
    <AppLayout>
      <AppPage className="gap-8 md:gap-10">
        <div className="flex flex-col gap-5 border-b border-[var(--border-1)] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href={draftSlug ? `/rush/${draftSlug}` : "/rush"} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-haze-3 transition hover:text-haze">
              <ArrowLeft size={13} /> Back to Community Rush
            </Link>
            <h1 className="mt-5 font-display text-3xl leading-tight text-haze sm:text-4xl">{draftSlug ? "Shape the draft" : "Start a Community Rush"}</h1>
            <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-haze-2">Define the public rules first. A published manifest is the proof record participants and the verifier can rely on.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-accent)] bg-[var(--void-tint)] px-4 py-3 text-sm text-haze-2">
            <FileLock2 size={17} className="shrink-0 text-[var(--brand-primary)]" />
            <span>Drafts stay private. Publishing locks the rules.</span>
          </div>
        </div>

        <form onSubmit={submit} className="grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-7">
            <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3"><Rocket size={18} className="text-[var(--brand-primary)]" /><h2 className="font-display text-xl text-haze">Campaign identity</h2></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Campaign name"><input required value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={160} className={inputClass} placeholder="Stellar Builder Rush" /></Field>
                <Field label="Community"><input required value={form.community} onChange={(e) => update("community", e.target.value)} maxLength={120} className={inputClass} placeholder="Stellar developer community" /></Field>
                <div className="sm:col-span-2"><Field label="Public URL slug" help="Lowercase letters, numbers, and hyphens only. It cannot change after the first save."><input required disabled={Boolean(draftSlug)} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={80} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`} placeholder="stellar-builder-rush" /></Field></div>
                <div className="sm:col-span-2"><Field label="Campaign summary"><textarea required value={form.summary} onChange={(e) => update("summary", e.target.value)} maxLength={600} rows={4} className={`${inputClass} resize-y`} placeholder="What people will build, learn, or prove together." /></Field></div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3"><Sparkles size={18} className="text-coin-gold" /><h2 className="font-display text-xl text-haze">Challenge and scoring</h2></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Arena or challenge ID" help="Use the Bountixx Arena ID that produces the result."><input required value={form.arenaId} onChange={(e) => update("arenaId", e.target.value)} maxLength={128} className={inputClass} placeholder="planned-builder-arena" /></Field>
                <Field label="Challenge type"><select value={form.challengeType} onChange={(e) => update("challengeType", e.target.value as FormState["challengeType"])} className={inputClass}>{challengeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
                <div className="sm:col-span-2"><Field label="Scoring method" help="Describe the published method participants can understand before they join."><textarea required value={form.scoringMethod} onChange={(e) => update("scoringMethod", e.target.value)} maxLength={400} rows={3} className={`${inputClass} resize-y`} placeholder="Published deterministic test cases" /></Field></div>
                <Field label="Starts"><input required type="datetime-local" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} className={inputClass} /></Field>
                <Field label="Ends"><input required type="datetime-local" value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} className={inputClass} /></Field>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3"><ShieldCheck size={18} className="text-success" /><h2 className="font-display text-xl text-haze">Reward and verification</h2></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["standard", "verified"] as RushVerification[]).map((kind) => {
                  const active = form.verification === kind;
                  return <button key={kind} type="button" onClick={() => setVerification(kind)} className={`rounded-xl border p-4 text-left transition ${active ? "border-[var(--brand-primary)] bg-[var(--void-tint)]" : "border-[var(--border-2)] bg-[var(--surface-inset)] hover:border-[var(--border-accent)]"}`}>
                    <span className="block font-body text-sm font-semibold text-haze">{kind === "standard" ? "Standard Rush" : "Verified Rush"}</span>
                    <span className="mt-1.5 block font-body text-xs leading-relaxed text-haze-3">{kind === "standard" ? "Crowns, no wallet, social competition." : "Testnet XLM concept, deterministic result proof."}</span>
                  </button>;
                })}
              </div>
              {form.verification === "verified" ? <div className="mt-5 flex gap-3 rounded-xl border border-success/25 bg-success/5 p-4"><CircleAlert size={17} className="mt-0.5 shrink-0 text-success" /><p className="font-body text-sm leading-relaxed text-haze-2">This only publishes a Testnet XLM rules record. It does not fund a vault, connect a wallet, or promise a payout.</p></div> : null}
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <Field label={form.verification === "verified" ? "XLM amount" : "Crowns"}><input required inputMode="decimal" value={form.amount} onChange={(e) => update("amount", e.target.value)} className={inputClass} /></Field>
                <Field label="Payout structure"><select value={form.payout} onChange={(e) => update("payout", e.target.value as FormState["payout"])} className={inputClass}><option value="ranked">Ranked</option><option value="winner-takes-all">Winner takes all</option></select></Field>
                <Field label="Result policy"><select disabled={form.verification === "verified"} value={form.resultPolicy} onChange={(e) => update("resultPolicy", e.target.value as FormState["resultPolicy"])} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}><option value="deterministic">Deterministic</option><option value="organizer-reviewed">Organiser reviewed</option></select></Field>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-5 lg:sticky lg:top-24">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-haze-3">Release check</p>
            <h2 className="mt-3 font-display text-xl text-haze">Rules before rewards.</h2>
            <ul className="mt-5 space-y-3 font-body text-sm leading-relaxed text-haze-2"><li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />Drafts are private to you.</li><li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />Publishing records an immutable manifest hash.</li><li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />Verified is Testnet-only until the full settlement path exists.</li></ul>
            {error ? <p role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-3 font-body text-sm text-danger">{error}</p> : null}
            <div className="mt-7 space-y-3"><Button type="submit" loading={saving} onClick={() => { intentRef.current = "draft"; }} variant="secondary" fullWidth><Save size={16} /> Save private draft</Button><Button type="submit" loading={saving} onClick={() => { intentRef.current = "publish"; }} fullWidth><FileLock2 size={16} /> Publish and lock</Button></div>
          </aside>
        </form>
      </AppPage>
    </AppLayout>
  );
}
