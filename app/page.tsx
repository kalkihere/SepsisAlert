import { HomePageClient } from './home-page-client';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage(props: PageProps) {
  await props.searchParams;
  return <HomePageClient />;
}
