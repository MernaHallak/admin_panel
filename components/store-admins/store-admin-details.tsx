"use client";

import {Pencil} from "lucide-react";
import {useTranslations} from "next-intl";
import {useStoreAdmin} from "@/hook/queries/use-store-admins";
import {Link, useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";

export function StoreAdminDetails({id}: {id: string}) {
  const t = useTranslations("StoreAdmins"); const common = useTranslations("Common"); const router = useRouter();
  const {data, isPending, isError, error, refetch, isFetching} = useStoreAdmin(id);
  if (isPending) return <section className="product-details-panel"><div className="table-state">{common("loading")}</div></section>;
  if (isError || !data) { const normalized = normalizeApiError(error); const status = normalized.status; return <section className="product-details-panel"><div className="table-state" role="alert"><strong>{status === 404 ? t("notFoundTitle") : t("loadError")}</strong><p>{status === 401 ? t("sessionExpired") : status === 403 ? common("forbidden") : status === 404 ? t("notFound") : common(normalized.translationKey)}</p>{status === 401 ? <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>{common("login")}</button> : status === 404 ? <Link className="secondary-button" href="/store-admins">{t("backToList")}</Link> : status !== 403 ? <button className="secondary-button" type="button" disabled={isFetching} onClick={() => refetch()}>{common("retry")}</button> : null}</div></section>; }
  const {assignment} = data;
  return <section className="product-details-panel"><header className="product-details-header"><div className="product-details-identity"><div><h2 dir="auto">{assignment.profile.full_name}</h2><div className="product-details-status"><span>{t("effectiveStatus")}</span><span className={`store-status ${assignment.effective_is_active ? "active" : "inactive"}`}>{assignment.effective_is_active ? t("active") : t("inactive")}</span></div></div></div><Link className="primary-button" href={`/store-admins/${id}/edit`}><Pencil size={18} />{t("edit")}</Link></header><section className="product-details-section"><h3>{t("account")}</h3><div className="product-details-grid"><Detail label={t("fullName")} value={assignment.profile.full_name} /><Detail label={t("email")} value={assignment.profile.email} /><Detail label={t("role")} value={assignment.profile.role} /><Detail label={t("profileStatus")} value={assignment.profile_is_active ? t("active") : t("inactive")} /></div></section><section className="product-details-section"><h3>{t("assignment")}</h3><div className="product-details-grid"><Detail label={t("store")} value={assignment.store.name || assignment.store.slug} /><Detail label={t("assignmentStatus")} value={assignment.assignment_is_active ? t("active") : t("inactive")} /><Detail label={t("effectiveStatus")} value={assignment.effective_is_active ? t("active") : t("inactive")} /></div></section></section>;
}
function Detail({label, value}: {label: string; value: string}) { return <div className="product-details-item"><span>{label}</span><strong dir="auto">{value}</strong></div>; }
