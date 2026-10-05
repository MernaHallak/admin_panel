import {getTranslations} from "next-intl/server";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreAdminForm} from "@/components/store-admins/store-admin-form";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function CreateStoreAdminPage({params}: {params: Promise<{locale: "ar" | "en"}>}) { const {locale} = await params; const t = await getTranslations("StoreAdmins"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("title")} title={t("createTitle")} description={t("createDescription")} /><StoreAdminForm /></DashboardShell>; }
