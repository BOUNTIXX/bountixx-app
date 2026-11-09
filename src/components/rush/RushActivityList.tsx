import { BookOpen, Flag, Swords, Target } from "lucide-react";
import type { CommunityRushActivity, CommunityRushActivityKind } from "@/lib/rushCampaign";

const iconByKind: Record<CommunityRushActivityKind, typeof Swords> = {
  arena: Swords,
  quest: Target,
  workshop: BookOpen,
  bounty: Flag,
};

const labelByKind: Record<CommunityRushActivityKind, string> = {
  arena: "Arena",
  quest: "Quest",
  workshop: "Workshop",
  bounty: "Bounty",
};

export function RushActivityList({ activities }: { activities: CommunityRushActivity[] }) {
  if (activities.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-raised)] p-6 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-coin-gold">Programme board</p>
      <h2 className="mt-3 font-display text-2xl text-haze">Ways to take part</h2>
      <div className="mt-6 grid gap-3">
        {activities.map((activity, index) => {
          const Icon = iconByKind[activity.kind];
          return (
            <article key={`${activity.kind}-${activity.title}-${index}`} className="grid gap-4 rounded-xl border border-[var(--border-2)] bg-[var(--surface-inset)] p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--void-tint)] text-[var(--brand-primary)]"><Icon size={18} /></div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-haze-3">{labelByKind[activity.kind]} · {activity.time}</p>
                <h3 className="mt-2 font-display text-lg text-haze">{activity.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-haze-2">{activity.description}</p>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-coin-gold">+{activity.points} Crowns</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
