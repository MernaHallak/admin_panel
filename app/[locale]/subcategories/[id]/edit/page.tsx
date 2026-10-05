import {getTranslations} from "next-intl/server";

import {SubcategoryForm} from "@/components/subcategories/subcategory-form";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";

export default async function EditSubcategoryPage({params}: {params: Promise<{locale: "ar" | "en"; id: string}>}) {
  const {locale, id} = await params;
  const t = await getTranslations("SubcategoryDetails");
  await requireDashboardSession(locale);
  return <DashboardShell><PageHeader eyebrow="" title={t("editTitle")} description={t("editDescription")} /><SubcategoryForm id={id} /></DashboardShell>;
}
