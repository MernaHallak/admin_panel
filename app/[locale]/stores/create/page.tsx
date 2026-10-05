import {getTranslations} from "next-intl/server";

import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreCreateForm} from "@/components/stores/store-create-form";
import {Link} from "@/i18n/navigation";
import {requireDashboardSession} from "@/lib/require-dashboard-session";

interface CreateStorePageProps {
  params: Promise<{locale: "ar" | "en"}>;
}

export default async function CreateStorePage({params}: CreateStorePageProps) {
  const {locale} = await params;
  const t = await getTranslations("Stores.create");

  await requireDashboardSession(locale);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <Link className="secondary-button" href="/stores">
            {t("backToStores")}
          </Link>
        }
      />
      <StoreCreateForm />
    </DashboardShell>
  );
}
