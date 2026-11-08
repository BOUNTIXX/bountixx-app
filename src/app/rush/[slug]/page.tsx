import { RushDetail } from "@/components/rush/RushDetail";

export default async function RushDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RushDetail slug={slug} />;
}
