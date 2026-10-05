import {getTranslations} from "next-intl/server";
import {CategoriesList} from "@/components/categories/categories-list";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function CategoriesPage({params}: {params: Promise<{locale: "ar" | "en"}>}) { const {locale} = await params; const t = await getTranslations("Categories"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} /><CategoriesList /></DashboardShell>; }
