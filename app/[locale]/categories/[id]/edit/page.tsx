import {getTranslations} from "next-intl/server";
import {CategoryForm} from "@/components/categories/category-form";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function EditCategoryPage({params}: {params: Promise<{locale: "ar" | "en";id:string}>}) { const {locale,id} = await params; const t = await getTranslations("Categories"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("eyebrow")} title={t("editTitle")} description={t("editDescription")} /><CategoryForm id={id} /></DashboardShell>; }
