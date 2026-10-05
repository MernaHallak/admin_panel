import {getTranslations} from "next-intl/server";

import {ProductForm} from "@/components/products/product-form";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";

export default async function CreateProductPage({params, searchParams}: {params: Promise<{locale: "ar" | "en"}>; searchParams: Promise<{storeId?: string}>}) {
  const {locale} = await params;
  const {storeId} = await searchParams;
  const t = await getTranslations("Stores.details.productForm");
  await requireDashboardSession(locale);
  return <DashboardShell><PageHeader eyebrow={t("createTitle")} title={t("createTitle")} description="" /><ProductForm storeId={storeId} /></DashboardShell>;
}
