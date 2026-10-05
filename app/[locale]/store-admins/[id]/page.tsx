import {getTranslations} from "next-intl/server";
import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {StoreAdminDetails} from "@/components/store-admins/store-admin-details";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
export default async function StoreAdminDetailsPage({params}: {params: Promise<{locale: "ar" | "en"; id: string}>}) { const {locale, id} = await params; const t = await getTranslations("StoreAdmins"); await requireDashboardSession(locale); return <DashboardShell><PageHeader eyebrow={t("title")} title={t("detailsTitle")} description={t("detailsDescription")} /><StoreAdminDetails id={id} /></DashboardShell>; }
