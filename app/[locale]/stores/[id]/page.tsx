import {getTranslations} from "next-intl/server";

import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreDetails} from "@/components/stores/store-details";
import {requireDashboardSession} from "@/lib/require-dashboard-session";

interface StoreDetailsPageProps {
  params: Promise<{locale: "ar" | "en"; id: string}>;
}

export default async function StoreDetailsPage({params}: StoreDetailsPageProps) {
  const {locale, id} = await params;
  const t = await getTranslations("Stores.details");

  await requireDashboardSession(locale);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <StoreDetails id={id} />
    </DashboardShell>
  );
}
