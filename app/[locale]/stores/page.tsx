import {getTranslations} from "next-intl/server";

import {StoresList} from "@/components/stores/stores-list";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";

interface StoresPageProps {
  params: Promise<{locale: "ar" | "en"}>;
}

export default async function StoresPage({params}: StoresPageProps) {
  const {locale} = await params;
  const t = await getTranslations("Stores");

  await requireDashboardSession(locale);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <StoresList />
    </DashboardShell>
  );
}
