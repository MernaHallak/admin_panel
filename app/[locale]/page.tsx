import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {PageHeader} from "@/components/dashboard/page-header";
import {OverviewDashboard} from "@/components/overview/overview-dashboard";
import {requireDashboardSession} from "@/lib/require-dashboard-session";
import {getTranslations} from "next-intl/server";

interface HomePageProps {
  params: Promise<{locale: "ar" | "en"}>;
}

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;
  const t = await getTranslations("Overview");
  await requireDashboardSession(locale);

  return <DashboardShell><PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} /><OverviewDashboard /></DashboardShell>;
}
