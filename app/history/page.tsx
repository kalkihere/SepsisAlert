import { HistoryPageClient } from './history-page-client';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HistoryPage(props: PageProps) {
  await props.searchParams;
  return <HistoryPageClient />;
}
