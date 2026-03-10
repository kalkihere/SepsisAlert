import { ScanDetailClient } from './scan-detail-client';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ScanDetailPage(props: PageProps) {
  await props.params;
  await props.searchParams;
  return <ScanDetailClient />;
}
