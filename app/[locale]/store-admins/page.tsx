import {getTranslations} from "next-intl/server";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreAdminsList} from "@/components/store-admins/store-admins-list";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function StoreAdminsPage({params}: {params: Promise<{locale: "ar" | "en"}>}) { const {locale} = await params; const t = await getTranslations("StoreAdmins"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} /><StoreAdminsList /></DashboardShell>; }
