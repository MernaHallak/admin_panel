"use client";

import {Pencil} from "lucide-react";
import {useTranslations} from "next-intl";

import {useStoreAdmin} from "@/hook/queries/use-store-admins";
import {Link, useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";

export function StoreAdminDetails({id}: {id: string}) {
  const t = useTranslations("StoreAdmins");
  const common = useTranslations("Common");
  const router = useRouter();
  const {data, isPending, isError, error, refetch, isFetching} = useStoreAdmin(id);

  if (isPending) return <StoreAdminDetailsSkeleton label={t("loading")} />;

  if (isError || !data) {
    const normalized = normalizeApiError(error);
    const status = normalized.status;
    return <section className="store-admin-details-panel"><div className="table-state" role="alert"><strong>{status === 404 ? t("notFoundTitle") : t("loadError")}</strong><p>{status === 401 ? t("sessionExpired") : status === 403 ? common("forbidden") : status === 404 ? t("notFound") : common(normalized.translationKey)}</p>{status === 401 ? <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>{common("login")}</button> : status === 404 ? <Link className="secondary-button" href="/store-admins">{t("backToList")}</Link> : status !== 403 ? <button className="secondary-button" type="button" disabled={isFetching} onClick={() => refetch()}>{common("retry")}</button> : null}</div></section>;
  }

  const {assignment} = data;
  const storeName = assignment.store.name || assignment.store.slug;

  return <section className="store-admin-details-panel">
    <header className="store-admin-details-hero">
      <div className="store-admin-details-identity">
        <div>
          <h2 dir="auto">{assignment.profile.full_name}</h2>
          <div className="store-admin-details-primary-status"><span>{t("effectiveStatus")}</span><StatusValue active={assignment.effective_is_active} t={t} /></div>
        </div>
      </div>
      <div className="store-admin-details-actions">
        <Link className="primary-button" href={`/store-admins/${id}/edit`}><Pencil size={18} aria-hidden="true" />{t("edit")}</Link>
        <Link className="secondary-button" href="/store-admins">{t("backToList")}</Link>
      </div>
    </header>
    <div className="store-admin-details-content">
      <DetailsSection title={t("identity")}><Detail label={t("fullName")} value={assignment.profile.full_name} /><Detail label={t("email")} value={assignment.profile.email} direction="ltr" /><Detail label={t("role")} value={assignment.profile.role} /></DetailsSection>
      <DetailsSection title={t("assignment")}><Detail label={t("store")} value={storeName} /><Detail label={t("assignmentStatus")} value={<StatusValue active={assignment.assignment_is_active} t={t} />} /></DetailsSection>
      <DetailsSection title={t("account")}><Detail label={t("profileStatus")} value={<StatusValue active={assignment.profile_is_active} t={t} />} /><Detail label={t("effectiveStatus")} value={<StatusValue active={assignment.effective_is_active} t={t} />} /></DetailsSection>
    </div>
  </section>;
}

function DetailsSection({title, children}: {title: string; children: React.ReactNode}) {
  return <section className="store-admin-details-section"><h3 className="form-section-title">{title}</h3><div className="store-admin-details-grid">{children}</div></section>;
}

function Detail({label, value, direction = "auto"}: {label: string; value: React.ReactNode; direction?: "auto" | "ltr"}) {
  return <div className="store-admin-detail-item"><span>{label}</span><div dir={direction}>{value}</div></div>;
}

function StatusValue({active, t}: {active: boolean; t: ReturnType<typeof useTranslations>}) {
  return <span className={`store-status ${active ? "active" : "inactive"}`}>{active ? t("active") : t("inactive")}</span>;
}

function StoreAdminDetailsSkeleton({label}: {label: string}) {
  return <section className="store-admin-details-panel store-admin-details-skeleton" aria-label={label}>
    <header className="store-admin-details-hero"><div><span className="skeleton store-admin-skeleton-title" /><span className="skeleton store-admin-skeleton-status" /></div><div className="store-admin-details-actions"><span className="skeleton store-admin-skeleton-button" /><span className="skeleton store-admin-skeleton-button" /></div></header>
    <div className="store-admin-details-content">{[0, 1, 2].map((section) => <section className="store-admin-details-section" key={section}><span className="skeleton store-admin-skeleton-section-title" /><div className="store-admin-details-grid"><span className="skeleton store-admin-skeleton-field" /><span className="skeleton store-admin-skeleton-field" /></div></section>)}</div>
  </section>;
}
