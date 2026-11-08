import type { RushManifest } from "@bountixx/rush-sdk";

export type RushCampaignStatus = "draft" | "published" | "archived";
export type RushVerification = "standard" | "verified";

export type RushCampaign = {
  id: string;
  slug: string;
  name: string;
  community: string;
  summary: string;
  status: RushCampaignStatus;
  verification: RushVerification;
  manifest: RushManifest;
  manifestHash: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
};

export function formatRushDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be confirmed";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function shortHash(hash: string | null): string {
  return hash ? `${hash.slice(0, 12)}…${hash.slice(-8)}` : "Draft not locked";
}
