"use client";

import {useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {useStoreDetails} from "@/hook/queries/use-store-details";
import {StoreProductsList} from "@/components/stores/store-products-list";
import {Link, useRouter} from "@/i18n/navigation";
import type {SupportedLocale} from "@/i18n/routing";
import {normalizeApiError} from "@/lib/api-error";

interface StoreDetailsProps {
  id: string;
}

type StoreDetailsTab = "details" | "products";

function getActiveTab(value: string | null): StoreDetailsTab {
  return value === "products" || value === "details" ? value : "details";
}

function getNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getAdminEnteredLocalizedText(
  locale: SupportedLocale,
  englishValue: string | null,
  arabicValue: string | null,
) {
  return getNonEmptyString(locale === "ar" ? arabicValue : englishValue) || "";
}

function getSummaryCounts(value: unknown) {
  if (!value || typeof value !== "object") return undefined;

  const counts = value as Record<string, unknown>;
  if (typeof counts.total !== "number" || typeof counts.active !== "number") {
    return undefined;
  }

  return {total: counts.total, active: counts.active};
}

export function StoreDetails({id}: StoreDetailsProps) {
  const t = useTranslations("Stores.details");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = getActiveTab(searchParams.get("tab"));
  const {data, isPending, isError, error, refetch, isFetching} = useStoreDetails(id);
  const normalizedError = isError ? normalizeApiError(error) : undefined;

  if (isPending) {
    return (
      <section className="store-details-panel" aria-busy="true">
        <div className="store-details-loading">
          <span className="skeleton store-details-cover-skeleton" />
          <span className="skeleton store-details-line wide" />
          <span className="skeleton store-details-line" />
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
        : status === 404
          ? t("notFound")
          : common(normalizedError?.translationKey ?? "unexpectedError");
    const title = status === 404 ? t("notFoundTitle") : t("loadError");

    return (
      <section className="store-details-panel">
        <div className="table-state" role="alert">
          <span className="state-icon" aria-hidden="true">!</span>
          <strong>{title}</strong>
          <p>{message}</p>
          {status === 401 ? (
            <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>
              {common("login")}
            </button>
          ) : status === 404 ? (
            <Link className="secondary-button" href="/stores">
              {t("backToStores")}
            </Link>
          ) : status !== 403 ? (
            <button className="secondary-button" type="button" disabled={isFetching} onClick={() => refetch()}>
              {common("retry")}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const {store, summary} = data;
  const name =
    getNonEmptyString(store.name_i18n?.en) ||
    getNonEmptyString(store.name) ||
    getNonEmptyString(store.slug) ||
    t("unnamedStore");
  const description = getAdminEnteredLocalizedText(
    locale,
    store.description,
    store.description_ar,
  );
  const location = getAdminEnteredLocalizedText(
    locale,
    store.location,
    store.location_ar,
  );
  const productSummary = getSummaryCounts(summary?.products);
  const storeAdminAssignmentsSummary = getSummaryCounts(summary?.store_admin_assignments);
  const additionalLinks = Object.entries(store.social_links ?? {}).filter(
    (entry): entry is [string, string] => isHttpUrl(entry[1]),
  );

  return (
    <section className="store-details-panel">
      <div className="store-details-tabs" role="tablist" aria-label={t("tabs.label")}>
        <button
          id="store-details-tab"
          className={`store-details-tab${activeTab === "details" ? " active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "details"}
          aria-controls="store-details-panel"
          onClick={() => router.replace({pathname: `/stores/${id}`, query: {tab: "details"}})}
        >
          {t("tabs.storeDetails")}
        </button>
        <button
          id="store-products-tab"
          className={`store-details-tab${activeTab === "products" ? " active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "products"}
          aria-controls="store-products-panel"
          onClick={() => router.replace({pathname: `/stores/${id}`, query: {tab: "products"}})}
        >
          {t("tabs.products")}
        </button>
      </div>

      {activeTab === "details" ? (
        <div id="store-details-panel" role="tabpanel" aria-labelledby="store-details-tab">
      {isHttpUrl(store.cover_url) && (
        // Store image URLs can be hosted on arbitrary backend-approved domains.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="store-details-cover" src={store.cover_url} alt={t("coverAlt", {name})} />
      )}

      <div className="store-details-profile">
        {isHttpUrl(store.logo_url) ? (
          // Store image URLs can be hosted on arbitrary backend-approved domains.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="store-details-logo" src={store.logo_url} alt={t("logoAlt", {name})} />
        ) : (
          <span className="store-details-logo store-details-logo-fallback" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h2 id="store-details-name">{name}</h2>
        </div>
        <span className={`store-status ${store.is_active ? "active" : "inactive"}`}>
          {store.is_active ? t("active") : t("inactive")}
        </span>
      </div>

      <div className="store-details-grid">
        <DetailItem label={t("name")} value={name} />
        <DetailItem label={t("location")} value={location || t("notAvailable")} />
        <DetailItem label={t("phone")} value={getNonEmptyString(store.phone) || t("notAvailable")} />
        <UrlDetailItem label={t("logoUrl")} value={store.logo_url} fallback={t("notAvailable")} />
        <UrlDetailItem label={t("coverUrl")} value={store.cover_url} fallback={t("notAvailable")} />
        <DetailItem label={t("createdAt")} value={formatDate(store.created_at, t)} />
        <DetailItem label={t("updatedAt")} value={formatDate(store.updated_at, t)} />
        <DetailItem className="store-details-full" label={t("descriptionField")} value={description || t("notAvailable")} />
      </div>

      <section className="store-details-section" aria-labelledby="store-contact-title">
        <h3 id="store-contact-title">{t("contactLinks")}</h3>
        <div className="store-details-grid">
          <UrlDetailItem label={t("whatsapp")} value={store.whatsapp_url} fallback={t("notAvailable")} />
          <UrlDetailItem label={t("facebook")} value={store.facebook_url} fallback={t("notAvailable")} />
          <UrlDetailItem label={t("instagram")} value={store.instagram_url} fallback={t("notAvailable")} />
          <UrlDetailItem label={t("telegram")} value={store.telegram_url} fallback={t("notAvailable")} />
        </div>
      </section>

      <section className="store-details-section" aria-labelledby="store-additional-links-title">
        <h3 id="store-additional-links-title">{t("additionalLinks")}</h3>
        {additionalLinks.length ? (
          <div className="store-details-grid">
            {additionalLinks.map(([label, url]) => (
              <UrlDetailItem key={label} label={label} value={url} fallback={t("notAvailable")} />
            ))}
          </div>
        ) : (
          <p className="store-details-empty">{t("noAdditionalLinks")}</p>
        )}
      </section>

      {(productSummary || storeAdminAssignmentsSummary) && (
        <section className="store-details-section" aria-labelledby="store-summary-title">
          <h3 id="store-summary-title">{t("summary")}</h3>
          <div className="store-summary-grid">
            {productSummary && (
              <SummaryItem label={t("products")} total={productSummary.total} active={productSummary.active} t={t} />
            )}
            {storeAdminAssignmentsSummary && (
              <SummaryItem label={t("storeAdminAssignments")} total={storeAdminAssignmentsSummary.total} active={storeAdminAssignmentsSummary.active} t={t} />
            )}
          </div>
        </section>
      )}
        </div>
      ) : (
        <div id="store-products-panel" role="tabpanel" aria-labelledby="store-products-tab">
          <StoreProductsList storeId={id} />
        </div>
      )}
    </section>
  );
}

function formatDate(value: string, t: ReturnType<typeof useTranslations>) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("notAvailable");

  const number = new Intl.NumberFormat("en-US", {useGrouping: false});
  return `${number.format(date.getUTCDate())} ${t(`months.${date.getUTCMonth()}`)} ${number.format(date.getUTCFullYear())}`;
}

interface DetailItemProps {
  label: string;
  value: string;
  className?: string;
}

function DetailItem({label, value, className}: DetailItemProps) {
  return (
    <div className={`store-details-item${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

interface UrlDetailItemProps {
  label: string;
  value: string | null;
  fallback: string;
}

function UrlDetailItem({label, value, fallback}: UrlDetailItemProps) {
  return (
    <div className="store-details-item">
      <span>{label}</span>
      {isHttpUrl(value) ? (
        <a className="store-details-url" href={value} target="_blank" rel="noopener noreferrer" title={value} dir="ltr">{value}</a>
      ) : (
        <strong>{fallback}</strong>
      )}
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  total: number;
  active: number;
  t: ReturnType<typeof useTranslations>;
}

function SummaryItem({label, total, active, t}: SummaryItemProps) {
  return (
    <div className="store-summary-item">
      <span>{label}</span>
      <strong>{t("summaryTotal", {count: total})}</strong>
      <small>{t("summaryActive", {count: active})}</small>
    </div>
  );
}
