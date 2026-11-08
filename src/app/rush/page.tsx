import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bolt,
  BookOpen,
  CircleDollarSign,
  Flag,
  Rocket,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppPage } from "@/components/landing/_section";
import { Button } from "@/components/ui/Button";
import { featuredRush, rushPrinciples, type RushTrack } from "@/lib/communityRush";

const trackIcon: Record<RushTrack, typeof Swords> = {
  arena: Swords,
  quest: Target,
  workshop: BookOpen,
  bounty: Flag,
};

const trackTone: Record<RushTrack, { background: string; border: string; color: string }> = {
  arena: { background: "rgba(124, 92, 255, 0.14)", border: "rgba(124, 92, 255, 0.32)", color: "#A78BFA" },
  quest: { background: "rgba(34, 211, 238, 0.11)", border: "rgba(34, 211, 238, 0.28)", color: "#22D3EE" },
  workshop: { background: "rgba(240, 165, 0, 0.12)", border: "rgba(240, 165, 0, 0.30)", color: "#F0A500" },
  bounty: { background: "rgba(110, 231, 183, 0.11)", border: "rgba(110, 231, 183, 0.28)", color: "#6EE7B7" },
};

export default function CommunityRushPage() {
  const rush = featuredRush;

  return (
    <AppLayout>
      <AppPage className="gap-10 md:gap-14">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border-accent)] bg-[var(--void-tint)] px-6 py-8 sm:px-9 sm:py-10 md:px-12 md:py-14">
          <div
            className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full opacity-70"
            style={{ background: "radial-gradient(circle, rgba(124,92,255,0.36), transparent 67%)" }}
            aria-hidden
          />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-end">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-accent)] bg-[var(--surface-raised)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
                  <Rocket size={13} aria-hidden /> Community Rush
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-haze-3">
                  {rush.community}
                </span>
              </div>
              <h1 className="max-w-3xl font-display text-4xl leading-[1.06] text-haze sm:text-5xl lg:text-6xl">
                A season of arenas, quests, and proof.
              </h1>
              <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-haze-2 sm:text-lg">
                Community Rush gives an organiser one home for the activities their people already care about. Play, learn, build, contribute, and make capable people visible through real work.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/create">
                  <Button size="lg" magnetic className="w-full gap-2 sm:w-auto">
                    Create an arena <ArrowRight size={16} aria-hidden />
                  </Button>
                </Link>
                <a
                  href="#verified-rush"
                  className="cursor-target inline-flex h-12 items-center justify-center rounded-xl border border-[var(--border-2)] px-6 font-body text-sm font-semibold text-haze-2 transition-colors hover:border-[var(--border-accent)] hover:bg-[var(--surface-hover)] hover:text-haze"
                >
                  See verified rewards
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-2)] bg-[var(--surface-raised)] p-5 sm:p-6">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-haze-3">Campaign example</p>
                  <h2 className="mt-2 font-display text-xl text-haze">{rush.name}</h2>
                </div>
                <span className="rounded-full border border-coin-gold/35 bg-coin-gold/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-coin-gold">
                  {rush.status}
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--void-tint)] text-[var(--brand-primary)]"><Trophy size={16} aria-hidden /></div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-haze-3">Progression</p>
                    <p className="font-body text-sm text-haze">{rush.tracks.length} linked activity types</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success"><BadgeCheck size={16} aria-hidden /></div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-haze-3">Verification</p>
                    <p className="font-body text-sm text-haze">{rush.verification}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-coin-gold/10 text-coin-gold"><CircleDollarSign size={16} aria-hidden /></div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-haze-3">Reward path</p>
                    <p className="font-body text-sm leading-snug text-haze">{rush.rewardLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand-primary)]">The campaign board</p>
              <h2 className="mt-3 font-display text-2xl text-haze sm:text-3xl">One rhythm, different ways to show up.</h2>
            </div>
            <p className="max-w-sm font-body text-sm leading-relaxed text-haze-3">A Rush is not a single contest. It gives each community a credible path from curiosity to contribution.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rush.tracks.map((track, index) => {
              const Icon = trackIcon[track.kind];
              const tone = trackTone[track.kind];
              return (
                <article key={track.title} className="group relative min-h-72 overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-6 transition-colors hover:border-[var(--border-accent)]">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-haze-3">0{index + 1}</span>
                  <div className="mt-8 flex h-11 w-11 items-center justify-center rounded-xl border" style={{ background: tone.background, borderColor: tone.border, color: tone.color }}>
                    <Icon size={19} aria-hidden />
                  </div>
                  <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-haze-3">{track.kind}</p>
                  <h3 className="mt-2 font-display text-lg leading-tight text-haze">{track.title}</h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-haze-2">{track.description}</p>
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between border-t border-[var(--border-1)] pt-4 font-mono text-[10px] uppercase tracking-wider text-haze-3">
                    <span>{track.time}</span>
                    <span className="text-coin-gold">+{track.points} Crowns</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="verified-rush" className="scroll-mt-24 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-6 sm:p-9 md:p-11">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-success">Verified Rush</p>
              <h2 className="mt-4 font-display text-3xl leading-tight text-haze sm:text-4xl">Stellar is the settlement rail, not the whole product.</h2>
              <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-haze-2">
                Most activity stays fast, social, and wallet-free. When an organiser adds a sponsor-funded reward, the published result can be verified off-chain and settled through a Soroban vault on Stellar Testnet.
              </p>
              <div className="mt-7 rounded-xl border border-success/25 bg-success/5 px-4 py-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-success" size={18} aria-hidden />
                  <p className="font-body text-sm leading-relaxed text-haze-2">No player entry pool. No private-key custody. No reward is promised until the organiser funds and publishes its campaign rules.</p>
                </div>
              </div>
            </div>
            <ol className="grid gap-3">
              {[
                ["01", "Organiser publishes the Rush", "Challenge rules, scoring, eligibility, and reward terms are locked into the campaign manifest."],
                ["02", "People complete real work", "Arenas and community activities produce scores, submissions, and evidence without forcing a wallet connection."],
                ["03", "Verifier signs the result", "The Rush verifier checks the deterministic result and issues an auditable attestation."],
                ["04", "Sponsor reward settles", "Only then can a funded Testnet vault release an XLM reward to the verified winner."],
              ].map(([number, title, description]) => (
                <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-4 sm:p-5">
                  <span className="font-stats text-lg text-[var(--brand-primary)]">{number}</span>
                  <div>
                    <h3 className="font-body text-sm font-semibold text-haze">{title}</h3>
                    <p className="mt-1.5 font-body text-sm leading-relaxed text-haze-3">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {rushPrinciples.map((principle, index) => (
            <article key={principle.label} className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-6">
              <div className="flex items-center gap-3">
                <Bolt size={16} className="text-[var(--brand-primary)]" aria-hidden />
                <span className="font-mono text-[10px] tracking-[0.14em] text-haze-3">0{index + 1}</span>
              </div>
              <h2 className="mt-7 font-display text-lg text-haze">{principle.label}</h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-haze-2">{principle.detail}</p>
            </article>
          ))}
        </section>
      </AppPage>
    </AppLayout>
  );
}
