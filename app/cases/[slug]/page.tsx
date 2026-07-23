import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseView } from "@/components/cases/case-view";
import { JsonLd, caseJsonLd } from "@/components/seo/json-ld";
import { getCaseBySlug, getCaseSlugs } from "@/lib/cases";
import { getTeamMemberBySlug } from "@/lib/team";

// Новые кейсы появляются без пересборки (ISR).
export const revalidate = 60;

type CaseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getCaseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CaseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) return {};

  const url = `/cases/${slug}`;
  const images = item.coverImage ? [{ url: item.coverImage }] : undefined;

  return {
    title: item.title,
    description: item.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: item.title,
      description: item.excerpt,
      url,
      type: "article",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: item.excerpt,
      ...(item.coverImage ? { images: [item.coverImage] } : {}),
    },
  };
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);

  if (!item) notFound();

  const doctor = item.doctorSlug
    ? await getTeamMemberBySlug(item.doctorSlug)
    : null;

  return (
    <>
      <JsonLd
        data={caseJsonLd({
          title: item.title,
          slug,
          excerpt: item.excerpt,
          image: item.coverImage,
        })}
      />
      <CaseView item={item} doctor={doctor} />
    </>
  );
}