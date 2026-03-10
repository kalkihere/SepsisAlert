import { PatientsPageClient } from './patients-page-client';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientsPage(props: PageProps) {
  await props.searchParams;
  return <PatientsPageClient />;
}
