import { PatientDetailClient } from './patient-detail-client';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientDetailPage(props: PageProps) {
  await props.params;
  await props.searchParams;
  return <PatientDetailClient />;
}
