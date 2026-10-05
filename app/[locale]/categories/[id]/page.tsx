import {getTranslations} from "next-intl/server";
import {CategoryDetails} from "@/components/categories/category-details";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function CategoryPage({params}: {params: Promise<{locale: "ar" | "en";id:string}>}) { const {locale,id} = await params; const t = await getTranslations("Categories"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("eyebrow")} title={t("detailsTitle")} description={t("detailsDescription")} /><CategoryDetails id={id} /></DashboardShell>; }
