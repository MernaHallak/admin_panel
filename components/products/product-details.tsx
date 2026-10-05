"use client";

import type {ReactNode} from "react";
import {Pencil} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Link, useRouter} from "@/i18n/navigation";
import type {SupportedLocale} from "@/i18n/routing";
import {useProduct} from "@/hook/queries/use-product";
import {getLocalizedValue} from "@/lib/i18n/get-localized-value";
import {normalizeApiError} from "@/lib/api-error";

interface ProductDetailsProps {
  id: string;
}

function getNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function getImageUrl(image: {url?: string; secure_url?: string}) {
  return getNonEmptyString(image.secure_url) || getNonEmptyString(image.url);
}

function formatPrice(value: number, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale, {style: "currency", currency: "USD"}).format(value);
}

function formatDate(value: string, t: ReturnType<typeof useTranslations>) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("notAvailable");

  const number = new Intl.NumberFormat("en-US", {useGrouping: false});
  return `${number.format(date.getUTCDate())} ${t(`months.${date.getUTCMonth()}`)} ${number.format(date.getUTCFullYear())}`;
}

export function ProductDetails({id}: ProductDetailsProps) {
  const t = useTranslations("Stores.details.productDetails");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const {data, isPending, isError, error, refetch, isFetching} = useProduct(id);
  const normalizedError = isError ? normalizeApiError(error) : undefined;

  if (isPending) {
    return <section className="product-details-panel" aria-busy="true"><div className="table-state">{common("loading")}</div></section>;
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
      <section className="product-details-panel">
        <div className="table-state" role="alert">
          <span className="state-icon" aria-hidden="true">!</span>
          <strong>{title}</strong>
          <p>{message}</p>
          {status === 401 ? <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>{common("login")}</button> : null}
          {status === 404 ? <Link className="secondary-button" href="/stores">{t("backToStores")}</Link> : null}
          {status !== 401 && status !== 403 && status !== 404 ? <button className="secondary-button" type="button" disabled={isFetching} onClick={() => refetch()}>{common("retry")}</button> : null}
        </div>
      </section>
    );
  }

  const product = data.product;
  const name = getLocalizedValue({localized: product.name_i18n, locale, fallback: product.name}) || t("unnamedProduct");
  // Avoid backend-generated Arabic fallbacks: show only content explicitly saved for the active language.
  const description = getNonEmptyString(locale === "ar" ? product.description_ar : product.description) || t("notAvailable");
  const category = getLocalizedValue({localized: product.category_i18n, locale, fallback: product.category}) || t("notAvailable");
  const subcategory = getLocalizedValue({localized: product.subcategory_i18n, locale, fallback: product.subcategory}) || t("notAvailable");
  const storeName = getNonEmptyString(product.store_name) || getNonEmptyString(product.store?.slug) || t("notAvailable");
  const primaryImageUrl = getNonEmptyString(product.image_url);
  const persistedImages = product.images?.flatMap((image) => {
    const url = getImageUrl(image);
    return url ? [{publicId: image.public_id, url}] : [];
  }) ?? [];
  const images = persistedImages.length
    ? persistedImages
    : primaryImageUrl
      ? [{publicId: "primary-image", url: primaryImageUrl}]
      : [];

  return (
    <section className="product-details-panel">
      <header className="product-details-header">
        <div className="product-details-identity">
          <div>
            <h2 dir="auto">{name}</h2>
            <div className="product-details-status">
              <span>{t("status")}</span>
              <span className={`store-status ${product.is_active ? "active" : "inactive"}`}>{product.is_active ? t("active") : t("inactive")}</span>
            </div>
          </div>
        </div>
        <button className="primary-button" type="button" onClick={() => router.push({pathname: `/products/${id}/edit`, query: {storeId: product.store_id}})}>
          <Pencil size={18} aria-hidden="true" />
          {t("edit")}
        </button>
      </header>

      <section className="product-details-section" aria-labelledby="product-information-title">
        <h3 id="product-information-title">{t("information")}</h3>
        <div className="product-details-grid">
          <DetailItem label={t("store")} value={storeName} />
          <DetailItem label={t("category")} value={category} />
          <DetailItem label={t("subcategory")} value={subcategory} />
          <DetailItem label={t("price")} value={formatPrice(product.price, locale)} />
          <DetailItem label={t("createdAt")} value={formatDate(product.created_at, t)} />
          <DetailItem label={t("updatedAt")} value={formatDate(product.updated_at, t)} />
        </div>
      </section>

      <section className="product-details-section" aria-labelledby="product-description-title">
        <h3 id="product-description-title">{t("description")}</h3>
        <div className="product-details-description" dir="auto">{description}</div>
      </section>

      <section className="product-details-section product-details-images" aria-labelledby="product-images-title">
        <h3 id="product-images-title">{t("images")}</h3>
        {images.length ? (
          <div className="product-details-image-grid">
            {images.map((image) => (
              <div key={image.publicId} className="product-details-image">
                {/* Product image hosts are controlled by the backend and may vary per store. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={t("imageAlt", {name})} />
              </div>
            ))}
          </div>
        ) : <p>{t("noImages")}</p>}
      </section>
    </section>
  );
}

interface DetailItemProps {
  label: string;
  value: ReactNode;
  className?: string;
}

function DetailItem({label, value, className}: DetailItemProps) {
  return <div className={`product-details-item${className ? ` ${className}` : ""}`}><span>{label}</span><strong dir="auto">{value}</strong></div>;
}
