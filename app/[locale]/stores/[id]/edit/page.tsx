import {getTranslations} from "next-intl/server";

import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreEditForm} from "@/components/stores/store-edit-form";
import {Link} from "@/i18n/navigation";
import {requireDashboardSession} from "@/lib/require-dashboard-session";

interface StoreEditPageProps {
  params: Promise<{locale: "ar" | "en"; id: string}>;
}

export default async function StoreEditPage({params}: StoreEditPageProps) {
  const {locale, id} = await params;
  const t = await getTranslations("Stores.edit");

  await requireDashboardSession(locale);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <Link className="secondary-button" href={`/stores/${id}`}>
            {t("backToStore")}
          </Link>
        }
      />
      <StoreEditForm id={id} />
    </DashboardShell>
  );
}
