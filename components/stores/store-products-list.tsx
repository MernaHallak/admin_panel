"use client";

import {useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Eye, Pencil, Search, Trash2} from "lucide-react";

import {useDeleteProduct, useToggleProductStatus} from "@/hook/mutations/use-product-mutations";
import {useStoreProducts} from "@/hook/queries/use-store-products";
import type {SupportedLocale} from "@/i18n/routing";
import {Link, useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";
import {getLocalizedValue} from "@/lib/i18n/get-localized-value";
import {MobileRowActions} from "@/components/mobile-row-actions";

const TABLE_COLUMN_COUNT = 7;
const PAGE_LIMIT = 20;

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, [role='button'], [role='link']"));
}

interface StoreProductsListProps {
  storeId: string;
}

export function StoreProductsList({storeId}: StoreProductsListProps) {
  const t = useTranslations("Stores.details.productsTab");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<{id: string; name: string} | null>(null);
  const [actionError, setActionError] = useState<string>();
  const [updatingProductId, setUpdatingProductId] = useState<string>();
  const deleteProductMutation = useDeleteProduct();
  const toggleProductStatusMutation = useToggleProductStatus();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const params = useMemo(() => ({
    store_id: storeId,
    q: debouncedSearch || undefined,
    status: "all" as const,
    sort: "newest" as const,
    page,
    limit: PAGE_LIMIT,
  }), [debouncedSearch, page, storeId]);
  const {data, isPending, isError, error, isFetching, refetch} = useStoreProducts(params);
  const normalizedError = isError ? normalizeApiError(error) : undefined;
  const toolbarDescription = isPending
    ? t("loading")
    : isError
      ? t("unableToLoad")
      : data
        ? t("results", {count: data.pagination.total})
        : t("empty");

  async function toggleStatus(product: {id: string; is_active: boolean}) {
    setActionError(undefined);
    setUpdatingProductId(product.id);
    try {
      await toggleProductStatusMutation.mutateAsync({
        id: product.id,
        is_active: !product.is_active,
      });
    } catch (mutationError) {
      const normalized = normalizeApiError(mutationError);
      setActionError(common(normalized.translationKey));
    } finally {
      setUpdatingProductId(undefined);
    }
  }

  async function deleteProduct() {
    if (!productToDelete) return;
    setActionError(undefined);
    try {
      await deleteProductMutation.mutateAsync({id: productToDelete.id});
      setProductToDelete(null);
    } catch (mutationError) {
      const normalized = normalizeApiError(mutationError);
      setActionError(common(normalized.translationKey));
    }
  }

  function openProduct(id: string) { router.push(`/products/${id}`); }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if ((event.key !== "Enter" && event.key !== " ") || (event.target !== event.currentTarget && isInteractiveTarget(event.target))) return;
    event.preventDefault();
    openProduct(id);
  }

  return (
    <section className="store-products-panel" aria-labelledby="store-products-title">
      <div className="table-toolbar">
        <div className="table-toolbar-copy">
          <h2 id="store-products-title">{t("title")}</h2>
          <p>{toolbarDescription}</p>
        </div>
        <div className="table-toolbar-actions">
          {isFetching && !isPending ? (
            <span className="table-refreshing" aria-label={t("refreshing")}>
              <span className="spinner dark" aria-hidden="true" />
            </span>
          ) : null}
          <div className="stores-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => router.push({pathname: "/products/create", query: {storeId}})}
          >
            {t("addProduct")}
          </button>
        </div>
      </div>
      {actionError ? <p className="store-products-action-error" role="alert">{actionError}</p> : null}

      <div className="table-scroll desktop-list-table">
        <table className="stores-table store-products-table">
          <thead>
            <tr>
              <th className="store-products-name-column" scope="col">{t("product")}</th>
              <th scope="col">{t("category")}</th>
              <th scope="col">{t("subcategory")}</th>
              <th className="store-products-price-column" scope="col">{t("price")}</th>
              <th scope="col">{t("actions")}</th>
              <th scope="col">{t("status")}</th>
              <th scope="col">{t("updated")}</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <TableLoadingRows label={t("loading")} />
            ) : isError ? (
              <tr>
                <td colSpan={TABLE_COLUMN_COUNT}>
                  <div className="table-state" role="alert">
                    <span className="state-icon" aria-hidden="true">!</span>
                    <strong>{t("loadError")}</strong>
                    <p>
                      {normalizedError?.status === 401
                        ? t("sessionExpired")
                        : normalizedError?.status === 403
                          ? common("forbidden")
                          : common(normalizedError?.translationKey ?? "unexpectedError")}
                    </p>
                    {normalizedError?.status === 401 ? (
                      <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>
                        {common("login")}
                      </button>
                    ) : normalizedError?.status !== 403 ? (
                      <button className="secondary-button" type="button" disabled={isFetching} onClick={() => refetch()}>
                        {common("retry")}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : !data || !data.data.length ? (
              <tr>
                <td colSpan={TABLE_COLUMN_COUNT}>
                  <div className="table-state">
                    <span className="state-icon" aria-hidden="true">◇</span>
                    <p>{t("empty")}</p>
                  </div>
                </td>
              </tr>
            ) : data.data.map((product) => {
              const name = getLocalizedValue({
                localized: product.name_i18n,
                locale,
                fallback: product.name,
              }) || t("unnamedProduct");
              const category = getLocalizedValue({
                localized: product.category_i18n,
                locale,
                fallback: product.category,
              }) || t("unknownCategory");
              const subcategory = getLocalizedValue({
                localized: product.subcategory_i18n,
                locale,
                fallback: product.subcategory,
              });

              return (
                <tr key={product.id} className="table-navigation-row" tabIndex={0} aria-label={t("viewProduct")} onClick={(event: MouseEvent<HTMLTableRowElement>) => { if (!isInteractiveTarget(event.target)) openProduct(product.id); }} onKeyDown={(event) => handleRowKeyDown(event, product.id)}>
                  <td className="store-products-name-column">
                    <div className="store-product-copy">
                      <Link className="store-name-link" href={`/products/${product.id}`} title={name} onClick={(event) => event.stopPropagation()}><strong>{name}</strong></Link>
                    </div>
                  </td>
                  <td>{category}</td>
                  <td>{subcategory || "—"}</td>
                  <td className="store-products-price-column numeric-cell"><span className="table-price-full"><bdi>{formatPrice(product.price, locale)}</bdi></span><span className="table-price-compact"><bdi>{formatCompactPrice(product.price)}</bdi></span></td>
                  <td>
                    <div className="table-actions">
                      <button className="table-view-action" type="button" aria-label={t("viewProduct")} title={t("viewProduct")} onClick={(event) => { event.stopPropagation(); openProduct(product.id); }} onKeyDown={(event) => event.stopPropagation()}>
                        <Eye size={18} aria-hidden="true" />
                      </button>
                      <button className="table-view-action" type="button" aria-label={t("editProduct")} title={t("editProduct")} onClick={(event) => { event.stopPropagation(); router.push({pathname: `/products/${product.id}/edit`, query: {storeId}}); }} onKeyDown={(event) => event.stopPropagation()}>
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                      <button className="table-view-action danger" type="button" aria-label={t("deleteProduct")} title={t("deleteProduct")} disabled={deleteProductMutation.isPending} onClick={(event) => { event.stopPropagation(); setProductToDelete({id: product.id, name}); }} onKeyDown={(event) => event.stopPropagation()}>
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`store-status store-status-control ${product.is_active ? "active" : "inactive"}`}
                      type="button"
                      disabled={updatingProductId === product.id}
                      aria-busy={updatingProductId === product.id}
                      aria-label={product.is_active ? t("deactivateProduct") : t("activateProduct")}
                      title={product.is_active ? t("deactivateProduct") : t("activateProduct")}
                      onClick={(event) => { event.stopPropagation(); void toggleStatus(product); }}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {updatingProductId === product.id ? <span className="spinner dark" aria-label={t("updatingStatus")} /> : product.is_active ? t("active") : t("inactive")}
                    </button>
                  </td>
                  <td className="date-cell">{formatDate(product.updated_at, t)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-list" aria-label={t("title")}>
        {isPending ? <MobileStoreProductSkeletons label={t("loading")} /> : null}
        {isError ? <div className="mobile-list-state" role="alert"><strong>{t("loadError")}</strong><p>{normalizedError?.status === 401 ? t("sessionExpired") : normalizedError?.status === 403 ? common("forbidden") : common(normalizedError?.translationKey ?? "unexpectedError")}</p>{normalizedError?.status === 401 ? <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>{common("login")}</button> : normalizedError?.status !== 403 ? <button className="secondary-button" type="button" onClick={() => refetch()}>{common("retry")}</button> : null}</div> : null}
        {!isPending && !isError && !data?.data.length ? <div className="mobile-list-state"><p>{t("empty")}</p></div> : null}
        {!isPending && !isError ? data?.data.map((product) => {
          const name = getLocalizedValue({localized: product.name_i18n, locale, fallback: product.name}) || t("unnamedProduct");
          const category = getLocalizedValue({localized: product.category_i18n, locale, fallback: product.category}) || t("unknownCategory");
          const subcategory = getLocalizedValue({localized: product.subcategory_i18n, locale, fallback: product.subcategory});
          const isUpdating = updatingProductId === product.id;
          return <article key={product.id} className="mobile-list-card mobile-product-card" tabIndex={0} role="link" aria-label={t("viewProduct")} onClick={() => openProduct(product.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openProduct(product.id); } }}>
            <div className="mobile-list-card-header"><Link className="mobile-list-title" href={`/products/${product.id}`} title={name} onClick={(event) => event.stopPropagation()}><strong dir="auto">{name}</strong></Link><MobileRowActions label={t("actions")} actions={[{label: t("viewProduct"), onSelect: () => openProduct(product.id)}, {label: t("editProduct"), onSelect: () => router.push({pathname: `/products/${product.id}/edit`, query: {storeId}})}, {label: product.is_active ? t("deactivateProduct") : t("activateProduct"), onSelect: () => { void toggleStatus(product); }, disabled: Boolean(updatingProductId)}, {label: t("deleteProduct"), onSelect: () => setProductToDelete({id: product.id, name}), destructive: true, disabled: deleteProductMutation.isPending}]} /></div>
            <p className="mobile-list-meta" dir="auto">{category}</p>{subcategory ? <p className="mobile-list-detail" dir="auto">{subcategory}</p> : null}
            <div className="mobile-list-card-footer"><strong className="mobile-list-price">{formatCompactPrice(product.price)}</strong><button className={`store-status store-status-control ${product.is_active ? "active" : "inactive"}`} type="button" disabled={isUpdating} aria-busy={isUpdating} aria-label={product.is_active ? t("deactivateProduct") : t("activateProduct")} onClick={(event) => { event.stopPropagation(); void toggleStatus(product); }}>{isUpdating ? <span className="spinner dark" aria-label={t("updatingStatus")} /> : product.is_active ? t("active") : t("inactive")}</button></div>
          </article>;
        }) : null}
      </div>

      {data && data.pagination.total_pages > 1 ? (
        <div className="table-pagination" aria-label={t("pagination")}>
          <button
            className="secondary-button"
            type="button"
            disabled={!data.pagination.has_prev || isFetching}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          >
            {t("previous")}
          </button>
          <span>{t("page", {page: data.pagination.page, total: data.pagination.total_pages})}</span>
          <button
            className="secondary-button"
            type="button"
            disabled={!data.pagination.has_next || isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            {t("next")}
          </button>
        </div>
      ) : null}

      {productToDelete ? (
        <div className="confirm-modal-backdrop" role="presentation" onClick={() => !deleteProductMutation.isPending && setProductToDelete(null)}>
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="delete-product-title">{t("deleteTitle")}</h2>
            <p>{t("deleteMessage")}</p>
            <strong>{productToDelete.name}</strong>
            {actionError ? <p className="error-message" role="alert">{actionError}</p> : null}
            <div className="confirm-modal-actions">
              <button className="secondary-button" type="button" disabled={deleteProductMutation.isPending} onClick={() => setProductToDelete(null)}>{t("cancel")}</button>
              <button className="danger-button" type="button" disabled={deleteProductMutation.isPending} onClick={deleteProduct}>
                {deleteProductMutation.isPending ? t("deleting") : t("confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatPrice(value: number, locale: SupportedLocale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatCompactPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string, t: ReturnType<typeof useTranslations>) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("notAvailable");

  const number = new Intl.NumberFormat("en-US", {useGrouping: false});
  return `${number.format(date.getUTCDate())} ${t(`months.${date.getUTCMonth()}`)} ${number.format(date.getUTCFullYear())}`;
}

function TableLoadingRows({label}: {label: string}) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((row) => (
        <tr key={row} aria-label={label}>
          {[0, 1, 2, 3, 4, 5, 6].map((cell) => (
            <td key={cell}>
              <span className="skeleton table-line" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function MobileStoreProductSkeletons({label}: {label: string}) {
  return <>{[0, 1, 2, 3].map((row) => <div className="mobile-list-card mobile-list-skeleton" key={row} aria-label={label}><span className="skeleton mobile-list-skeleton-title" /><span className="skeleton mobile-list-skeleton-line" /><span className="skeleton mobile-list-skeleton-footer" /></div>)}</>;
}
