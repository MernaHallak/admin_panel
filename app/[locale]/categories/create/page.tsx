import {getTranslations} from "next-intl/server";
import {CategoryForm} from "@/components/categories/category-form";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function CreateCategoryPage({params}: {params: Promise<{locale: "ar" | "en"}>}) { const {locale} = await params; const t = await getTranslations("Categories"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("eyebrow")} title={t("createTitle")} description={t("createDescription")} /><CategoryForm /></DashboardShell>; }
