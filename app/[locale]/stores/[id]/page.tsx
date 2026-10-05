import {getTranslations} from "next-intl/server";

import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreDetails} from "@/components/stores/store-details";
import {Link} from "@/i18n/navigation";
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
        actions={
          <div className="store-detail-actions">
            <Link className="primary-button" href={`/stores/${id}/edit`}>
              {t("editAction")}
            </Link>
            <Link className="secondary-button" href="/stores">
              {t("backToStores")}
            </Link>
          </div>
        }
      />
      <StoreDetails id={id} />
    </DashboardShell>
  );
}
