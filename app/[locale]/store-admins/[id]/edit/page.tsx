import {getTranslations} from "next-intl/server";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreAdminForm} from "@/components/store-admins/store-admin-form";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function EditStoreAdminPage({params}: {params: Promise<{locale: "ar" | "en"; id: string}>}) { const {locale, id} = await params; const t = await getTranslations("StoreAdmins"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("title")} title={t("editTitle")} description={t("editDescription")} /><StoreAdminForm id={id} /></DashboardShell>; }
