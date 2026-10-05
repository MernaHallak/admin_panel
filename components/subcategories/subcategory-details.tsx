"use client";

import {Pencil} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {useSuperAdminSubcategory} from "@/hook/queries/use-super-admin-subcategories";
import {Link} from "@/i18n/navigation";
import {getLocalizedValue} from "@/lib/i18n/get-localized-value";
import {normalizeApiError} from "@/lib/api-error";
import type {SupportedLocale} from "@/i18n/routing";

function nonEmpty(value: string | null | undefined) { return value?.trim() || undefined; }

export function SubcategoryDetails({id}: {id: string}) {
  const t = useTranslations("Subcategories");
  const detailT = useTranslations("SubcategoryDetails");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const {data, isPending, isError, error, refetch} = useSuperAdminSubcategory(id);
  if (isPending) return <section className="product-details-panel"><div className="table-state">{common("loading")}</div></section>;
  if (isError || !data) { const apiError = normalizeApiError(error); return <section className="product-details-panel"><div className="table-state" role="alert"><strong>{detailT("loadError")}</strong><p>{apiError.status === 404 ? detailT("notFound") : common(apiError.translationKey)}</p><button className="secondary-button" type="button" onClick={() => refetch()}>{common("retry")}</button></div></section>; }

  const subcategory = data.subcategory;
  const displayName = locale === "ar" ? nonEmpty(subcategory.name_ar) || detailT("notAvailable") : nonEmpty(subcategory.name) || detailT("notAvailable");
  const description = locale === "ar" ? nonEmpty(subcategory.description_ar) : nonEmpty(subcategory.description);
  const categoryName = getLocalizedValue({localized: undefined, locale, fallback: subcategory.category_slug}) || detailT("notAvailable");
  return <section className="product-details-panel"><header className="product-details-header"><div className="product-details-identity"><div><h2 dir="auto">{displayName}</h2><span className={`store-status ${subcategory.is_active ? "active" : "inactive"}`}>{subcategory.is_active ? t("active") : t("inactive")}</span></div></div><div className="store-detail-actions"><Link className="primary-button" href={`/subcategories/${id}/edit`}><Pencil size={18} aria-hidden="true" />{detailT("editAction")}</Link></div></header><section className="product-details-section"><h3>{detailT("details")}</h3><div className="product-details-grid"><Item label={t("name")} value={subcategory.name || detailT("notAvailable")} /><Item label={t("nameAr")} value={subcategory.name_ar || detailT("notAvailable")} /><Item label={t("category")} value={categoryName} /><Item label={t("status")} value={subcategory.is_active ? t("active") : t("inactive")} /><Item label={detailT("description")} value={description || detailT("notAvailable")} /><Item label={detailT("createdAt")} value={subcategory.created_at || detailT("notAvailable")} /><Item label={detailT("updatedAt")} value={subcategory.updated_at || detailT("notAvailable")} /></div></section></section>;
}

function Item({label, value}: {label: string; value: string}) { return <div className="product-details-item"><span>{label}</span><strong dir="auto">{value}</strong></div>; }
