import { ScanPageClient } from './scan-page-client';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ScanPage(props: PageProps) {
  await props.searchParams;
  return <ScanPageClient />;
}
