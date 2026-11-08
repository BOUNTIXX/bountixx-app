import { RushComposer } from "@/components/rush/RushComposer";

export default async function EditRushPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RushComposer draftSlug={slug} />;
}
