import {getTranslations} from "next-intl/server";

import {ProductDetails} from "@/components/products/product-details";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";

export default async function ProductDetailsPage({params}: {params: Promise<{locale: "ar" | "en"; id: string}>}) {
  const {locale, id} = await params;
  const t = await getTranslations("Stores.details.productDetails");
  await requireDashboardSession(locale);
  return <DashboardShell><PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("pageDescription")} /><ProductDetails id={id} /></DashboardShell>;
}
