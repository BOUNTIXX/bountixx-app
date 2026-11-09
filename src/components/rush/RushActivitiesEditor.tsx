"use client";

import { Plus, Trash2 } from "lucide-react";
import type { CommunityRushActivity, CommunityRushActivityKind } from "@/lib/rushCampaign";

type Props = {
  activities: CommunityRushActivity[];
  onChange: (activities: CommunityRushActivity[]) => void;
};

const kinds: { value: CommunityRushActivityKind; label: string; description: string }[] = [
  { value: "arena", label: "Arena", description: "A scored Bountixx challenge." },
  { value: "quest", label: "Quest", description: "A guided learning or discovery task." },
  { value: "workshop", label: "Workshop", description: "A live or self-paced community session." },
  { value: "bounty", label: "Bounty", description: "A defined contribution with an outcome." },
];

const inputClass = "w-full rounded-xl border border-[var(--border-2)] bg-[var(--surface-inset)] px-4 py-3 font-body text-sm text-haze outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] placeholder:text-haze-3";

function blankActivity(): CommunityRushActivity {
  return { kind: "arena", title: "", description: "", time: "", points: 100 };
}

export function RushActivitiesEditor({ activities, onChange }: Props) {
  function update(index: number, patch: Partial<CommunityRushActivity>) {
    onChange(activities.map((activity, itemIndex) => itemIndex === index ? { ...activity, ...patch } : activity));
  }

  return (
    <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-coin-gold">Programme</p>
          <h2 className="mt-2 font-display text-xl text-haze">What happens in this Rush?</h2>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-haze-2">Build the actual programme: competitive Arenas, learning Quests, Workshops, and contribution Bounties. These details publish with the public campaign.</p>
        </div>
        <button type="button" onClick={() => onChange([...activities, blankActivity()])} disabled={activities.length >= 12} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-accent)] px-3 py-2 font-body text-sm font-semibold text-haze transition hover:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={16} /> Add activity
        </button>
      </div>

      <div className="mt-6 space-y-5">
        {activities.map((activity, index) => (
          <article key={`${index}-${activity.kind}`} className="rounded-xl border border-[var(--border-2)] bg-[var(--surface-inset)] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-haze-3">Activity {index + 1}</span>
              <button type="button" aria-label={`Remove activity ${index + 1}`} onClick={() => onChange(activities.filter((_, itemIndex) => itemIndex !== index))} disabled={activities.length === 1} className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-danger transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 size={14} /> Remove
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-haze-2">Type</span><select value={activity.kind} onChange={(event) => update(index, { kind: event.target.value as CommunityRushActivityKind })} className={inputClass}>{kinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label} — {kind.description}</option>)}</select></label>
              <label className="block"><span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-haze-2">Crowns available</span><input required min={0} max={100000} type="number" inputMode="numeric" value={activity.points} onChange={(event) => update(index, { points: Number(event.target.value) })} className={inputClass} /></label>
              <label className="block sm:col-span-2"><span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-haze-2">Activity title</span><input required maxLength={120} value={activity.title} onChange={(event) => update(index, { title: event.target.value })} className={inputClass} placeholder="Build an on-chain score verifier" /></label>
              <label className="block sm:col-span-2"><span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-haze-2">What participants do</span><textarea required maxLength={600} rows={3} value={activity.description} onChange={(event) => update(index, { description: event.target.value })} className={`${inputClass} resize-y`} placeholder="Complete the challenge, show your proof, and earn your place on the board." /></label>
              <label className="block sm:col-span-2"><span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-haze-2">When or where</span><input required maxLength={120} value={activity.time} onChange={(event) => update(index, { time: event.target.value })} className={inputClass} placeholder="Week 1 · Online · 90 minutes" /></label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
