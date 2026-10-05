"use client";

import type {LucideIcon} from "lucide-react";
import {Boxes, Package, ShieldCheck, Store, Tags, Users} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {useOverview} from "@/hook/queries/use-overview";
import {useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";
import type {SupportedLocale} from "@/i18n/routing";
import type {OverviewStatusCounts} from "@/types/overview";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  locale: SupportedLocale;
}

function MetricCard({label, value, icon: Icon, locale}: MetricCardProps) {
  return (
    <article className="overview-metric-card">
      <span className="overview-metric-icon" aria-hidden="true"><Icon size={20} /></span>
      <span>{label}</span>
      <strong>{new Intl.NumberFormat(locale).format(value)}</strong>
    </article>
  );
}

export function OverviewDashboard() {
  const t = useTranslations("Overview");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const {data, isPending, isError, error, refetch, isFetching} = useOverview();
  const normalizedError = isError ? normalizeApiError(error) : undefined;

  if (isPending) {
    return (
      <section className="overview-panel" aria-busy="true">
        <div className="overview-metrics-grid">
          {[0, 1, 2, 3].map((item) => <span key={item} className="overview-metric-skeleton skeleton" />)}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    const status = normalizedError?.status;
    const message = status === 401
      ? t("sessionExpired")
      : status === 403
        ? common("forbidden")
        : common(normalizedError?.translationKey ?? "unexpectedError");

    return (
      <section className="overview-panel">
        <div className="table-state" role="alert">
          <span className="state-icon" aria-hidden="true">!</span>
          <strong>{t("loadError")}</strong>
          <p>{message}</p>
          {status === 401 ? <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>{common("login")}</button> : null}
          {status !== 401 && status !== 403 ? <button className="secondary-button" type="button" disabled={isFetching} onClick={() => refetch()}>{common("retry")}</button> : null}
        </div>
      </section>
    );
  }

  const statusRows: Array<{label: string; counts: OverviewStatusCounts}> = [
    {label: t("stores"), counts: data.stores},
    {label: t("products"), counts: data.products},
    {label: t("categories"), counts: data.categories},
    {label: t("subcategories"), counts: data.subcategories},
  ];

  return (
    <section className="overview-panel" aria-label={t("title")}>
      <section className="overview-section" aria-labelledby="overview-platform-title">
        <h2 id="overview-platform-title">{t("platformCounts")}</h2>
        <div className="overview-metrics-grid">
          <MetricCard label={t("stores")} value={data.stores.total} icon={Store} locale={locale} />
          <MetricCard label={t("products")} value={data.products.total} icon={Package} locale={locale} />
          <MetricCard label={t("categories")} value={data.categories.total} icon={Tags} locale={locale} />
          <MetricCard label={t("subcategories")} value={data.subcategories.total} icon={Boxes} locale={locale} />
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-access-title">
        <h2 id="overview-access-title">{t("accessCounts")}</h2>
        <div className="overview-metrics-grid">
          <MetricCard label={t("admins")} value={data.users.admins} icon={Users} locale={locale} />
          <MetricCard label={t("superAdmins")} value={data.users.super_admins} icon={ShieldCheck} locale={locale} />
          <MetricCard label={t("storeAdminAssignments")} value={data.store_admin_assignments.total} icon={Users} locale={locale} />
          <MetricCard label={t("activeAssignments")} value={data.store_admin_assignments.active} icon={ShieldCheck} locale={locale} />
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-status-title">
        <h2 id="overview-status-title">{t("statusBreakdown")}</h2>
        <div className="table-scroll">
          <table className="overview-status-table">
            <thead><tr><th scope="col">{t("entity")}</th><th scope="col">{t("total")}</th><th scope="col">{t("active")}</th><th scope="col">{t("inactive")}</th></tr></thead>
            <tbody>{statusRows.map(({label, counts}) => <tr key={label}><th scope="row">{label}</th><td>{new Intl.NumberFormat(locale).format(counts.total)}</td><td>{new Intl.NumberFormat(locale).format(counts.active)}</td><td>{new Intl.NumberFormat(locale).format(counts.inactive)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
