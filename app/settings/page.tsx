import { SettingsPageClient } from './settings-page-client';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage(props: PageProps) {
  await props.searchParams;
  return <SettingsPageClient />;
}
