"use client";

import {useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent} from "react";
import {useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import {Eye, Pencil, Search, Trash2} from "lucide-react";

import {useDeleteProduct, useToggleProductStatus} from "@/hook/mutations/use-product-mutations";
import {useGlobalProducts} from "@/hook/queries/use-global-products";
import {useCategories, useSubcategories} from "@/hook/queries/use-product-taxonomy";
import {useStores} from "@/hook/queries/use-stores";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import type {SupportedLocale} from "@/i18n/routing";
import {getLocalizedValue} from "@/lib/i18n/get-localized-value";
import {normalizeApiError} from "@/lib/api-error";
import type {SuperAdminProductSort, SuperAdminProductStatus} from "@/types/product";

const TABLE_COLUMN_COUNT = 8;
const PAGE_LIMIT = 20;
const PRODUCT_STATUSES: SuperAdminProductStatus[] = ["all", "active", "inactive"];
const PRODUCT_SORTS: SuperAdminProductSort[] = ["newest", "oldest", "name_asc", "name_desc", "price_asc", "price_desc"];

function getNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function getPositiveInteger(value: string | null, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, [role='button'], [role='link']"));
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

export function GlobalProductsList() {
  const t = useTranslations("Products");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const query = searchParams.get("q") ?? "";
  const storeId = searchParams.get("store_id") ?? "";
  const categorySlug = searchParams.get("category_slug") ?? "";
  const subcategoryId = searchParams.get("subcategory_id") ?? "";
  const rawStatus = searchParams.get("status");
  const status = PRODUCT_STATUSES.includes(rawStatus as SuperAdminProductStatus) ? rawStatus as SuperAdminProductStatus : "all";
  const rawSort = searchParams.get("sort");
  const sort = PRODUCT_SORTS.includes(rawSort as SuperAdminProductSort) ? rawSort as SuperAdminProductSort : "newest";
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const [search, setSearch] = useState(query);
  const [productToDelete, setProductToDelete] = useState<{id: string; name: string} | null>(null);
  const [actionError, setActionError] = useState<string>();
  const [updatingProductId, setUpdatingProductId] = useState<string>();
  const deleteProductMutation = useDeleteProduct();
  const toggleProductStatusMutation = useToggleProductStatus();
  const {data: categoriesData} = useCategories();
  const {data: storesData} = useStores({status: "all", sort: "name_asc", limit: 100});
  const selectedCategory = categoriesData?.data.find((category) => category.slug === categorySlug);
  const {data: subcategoriesData} = useSubcategories(selectedCategory?.id ?? "");

  const params = useMemo(() => ({
    q: query || undefined,
    store_id: storeId || undefined,
    category_slug: categorySlug || undefined,
    subcategory_id: subcategoryId || undefined,
    status,
    sort,
    page,
    limit: PAGE_LIMIT,
  }), [categorySlug, page, query, sort, status, storeId, subcategoryId]);
  const {data, isPending, isError, error, isFetching, refetch} = useGlobalProducts(params);
  const normalizedError = isError ? normalizeApiError(error) : undefined;

  function updateQuery(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParamString);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const nextSearch = next.toString();
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  }

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    const normalizedSearch = search.trim();
    if (normalizedSearch === query) return;
    const timeout = window.setTimeout(() => updateQuery({q: normalizedSearch || undefined, page: undefined}), 350);
    return () => window.clearTimeout(timeout);
  }, [query, search]);

  async function toggleStatus(product: {id: string; store_id: string; is_active: boolean}) {
    if (updatingProductId) return;
    setActionError(undefined);
    setUpdatingProductId(product.id);
    try {
      await toggleProductStatusMutation.mutateAsync({id: product.id, is_active: !product.is_active});
    } catch (mutationError) {
      const normalized = normalizeApiError(mutationError);
      if (normalized.status === 401) router.replace("/login");
      else setActionError(common(normalized.translationKey));
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
      if (normalized.status === 401) router.replace("/login");
      else setActionError(common(normalized.translationKey));
    }
  }

  function openProduct(id: string) { router.push(`/products/${id}`); }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if ((event.key !== "Enter" && event.key !== " ") || (event.target !== event.currentTarget && isInteractiveTarget(event.target))) return;
    event.preventDefault();
    openProduct(id);
  }

  const toolbarDescription = isPending ? t("loading") : isError ? t("unableToLoad") : data ? t("results", {count: data.pagination.total}) : t("empty");

  return (
    <section className="data-table-panel" aria-labelledby="products-table-title">
      <div className="table-toolbar global-products-toolbar">
        <div className="table-toolbar-copy">
          <h2 id="products-table-title">{t("tableTitle")}</h2>
          <p>{toolbarDescription}</p>
        </div>
        <div className="table-toolbar-actions">
          <Link className="primary-button" href="/products/create">{t("addProduct")}</Link>
          {isFetching && !isPending ? <span className="table-refreshing" aria-label={t("refreshing")}><span className="spinner dark" aria-hidden="true" /></span> : null}
          <div className="stores-search">
            <Search size={18} aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
          </div>
          <label className="table-filter"><span className="sr-only">{t("storeFilter")}</span><select value={storeId} onChange={(event) => updateQuery({store_id: event.target.value || undefined, page: undefined})} aria-label={t("storeFilter")}><option value="">{t("allStores")}</option>{storesData?.data.map((store) => <option key={store.id} value={store.id}>{store.name_i18n?.en?.trim() || store.name || store.slug}</option>)}</select></label>
          <label className="table-filter"><span className="sr-only">{t("categoryFilter")}</span><select value={categorySlug} onChange={(event) => updateQuery({category_slug: event.target.value || undefined, subcategory_id: undefined, page: undefined})} aria-label={t("categoryFilter")}><option value="">{t("allCategories")}</option>{categoriesData?.data.map((category) => <option key={category.id} value={category.slug}>{getLocalizedValue({localized: category.name_i18n, locale, fallback: category.name})}</option>)}</select></label>
          <label className="table-filter"><span className="sr-only">{t("subcategoryFilter")}</span><select value={subcategoryId} disabled={!selectedCategory} onChange={(event) => updateQuery({subcategory_id: event.target.value || undefined, page: undefined})} aria-label={t("subcategoryFilter")}><option value="">{selectedCategory ? t("allSubcategories") : t("selectCategoryFirst")}</option>{subcategoriesData?.data.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{getLocalizedValue({localized: subcategory.name_i18n, locale, fallback: subcategory.name})}</option>)}</select></label>
          <label className="table-filter"><span className="sr-only">{t("statusFilter")}</span><select value={status} onChange={(event) => updateQuery({status: event.target.value === "all" ? undefined : event.target.value, page: undefined})} aria-label={t("statusFilter")}><option value="all">{t("statusAll")}</option><option value="active">{t("active")}</option><option value="inactive">{t("inactive")}</option></select></label>
          <label className="table-filter"><span className="sr-only">{t("sortFilter")}</span><select value={sort} onChange={(event) => updateQuery({sort: event.target.value === "newest" ? undefined : event.target.value, page: undefined})} aria-label={t("sortFilter")}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option><option value="name_asc">{t("sortNameAsc")}</option><option value="name_desc">{t("sortNameDesc")}</option><option value="price_asc">{t("sortPriceAsc")}</option><option value="price_desc">{t("sortPriceDesc")}</option></select></label>
        </div>
      </div>

      {actionError ? <p className="store-products-action-error" role="alert">{actionError}</p> : null}
      <div className="table-scroll">
        <table className="stores-table global-products-table">
          <thead><tr><th scope="col">{t("product")}</th><th scope="col">{t("store")}</th><th scope="col">{t("category")}</th><th scope="col">{t("subcategory")}</th><th scope="col">{t("price")}</th><th scope="col">{t("status")}</th><th scope="col">{t("updated")}</th><th scope="col">{t("actions")}</th></tr></thead>
          <tbody>
            {isPending ? <LoadingRows label={t("loading")} /> : isError ? <tr><td colSpan={TABLE_COLUMN_COUNT}><div className="table-state" role="alert"><span className="state-icon" aria-hidden="true">!</span><strong>{t("loadError")}</strong><p>{normalizedError?.status === 401 ? t("sessionExpired") : normalizedError?.status === 403 ? common("forbidden") : common(normalizedError?.translationKey ?? "unexpectedError")}</p>{normalizedError?.status === 401 ? <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>{common("login")}</button> : normalizedError?.status !== 403 ? <button className="secondary-button" type="button" onClick={() => refetch()}>{common("retry")}</button> : null}</div></td></tr> : !data?.data.length ? <tr><td colSpan={TABLE_COLUMN_COUNT}><div className="table-state"><span className="state-icon" aria-hidden="true">◇</span><p>{t("empty")}</p></div></td></tr> : data.data.map((product) => {
              const name = getLocalizedValue({localized: product.name_i18n, locale, fallback: product.name}) || t("unnamedProduct");
              const category = getLocalizedValue({localized: product.category_i18n, locale, fallback: product.category}) || t("notAvailable");
              const subcategory = getLocalizedValue({localized: product.subcategory_i18n, locale, fallback: product.subcategory}) || "—";
              const store = getNonEmptyString(product.store_name) || getNonEmptyString(product.store?.slug) || t("notAvailable");
              return <tr key={product.id} className="table-navigation-row" tabIndex={0} aria-label={t("viewProduct")} onClick={(event: MouseEvent<HTMLTableRowElement>) => { if (!isInteractiveTarget(event.target)) openProduct(product.id); }} onKeyDown={(event) => handleRowKeyDown(event, product.id)}><td><div className="store-product-copy"><Link className="store-name-link" href={`/products/${product.id}`} onClick={(event) => event.stopPropagation()}><strong dir="auto">{name}</strong></Link></div></td><td dir="auto">{store}</td><td dir="auto">{category}</td><td dir="auto">{subcategory}</td><td className="numeric-cell">{formatPrice(product.price, locale)}</td><td><button className={`store-status store-status-control ${product.is_active ? "active" : "inactive"}`} type="button" disabled={updatingProductId === product.id} aria-busy={updatingProductId === product.id} aria-label={product.is_active ? t("deactivateProduct") : t("activateProduct")} onClick={(event) => { event.stopPropagation(); void toggleStatus(product); }} onKeyDown={(event) => event.stopPropagation()}>{updatingProductId === product.id ? <span className="spinner dark" aria-label={t("updatingStatus")} /> : product.is_active ? t("active") : t("inactive")}</button></td><td className="date-cell">{formatDate(product.updated_at, t)}</td><td className="table-action-cell"><div className="table-actions"><Link className="table-view-action" href={`/products/${product.id}`} aria-label={t("viewProduct")} onClick={(event) => event.stopPropagation()}><Eye size={18} aria-hidden="true" /></Link><Link className="table-view-action" href={{pathname: `/products/${product.id}/edit`, query: {storeId: product.store_id}}} aria-label={t("editProduct")} onClick={(event) => event.stopPropagation()}><Pencil size={18} aria-hidden="true" /></Link><button className="table-view-action danger" type="button" disabled={deleteProductMutation.isPending} aria-label={t("deleteProduct")} onClick={(event) => { event.stopPropagation(); setProductToDelete({id: product.id, name}); }}><Trash2 size={18} aria-hidden="true" /></button></div></td></tr>;
            })}
          </tbody>
        </table>
      </div>

      {data && data.pagination.total_pages > 1 ? <div className="table-pagination" aria-label={t("pagination")}><button className="secondary-button" type="button" disabled={!data.pagination.has_prev || isFetching} onClick={() => updateQuery({page: String(Math.max(1, data.pagination.page - 1))})}>{t("previous")}</button><span>{t("page", {page: data.pagination.page, total: data.pagination.total_pages})}</span><button className="secondary-button" type="button" disabled={!data.pagination.has_next || isFetching} onClick={() => updateQuery({page: String(data.pagination.page + 1)})}>{t("next")}</button></div> : null}

      {productToDelete ? <div className="confirm-modal-backdrop" role="presentation" onClick={() => !deleteProductMutation.isPending && setProductToDelete(null)}><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" onClick={(event) => event.stopPropagation()}><h2 id="delete-product-title">{t("deleteTitle")}</h2><p>{t("deleteMessage")}</p><strong dir="auto">{productToDelete.name}</strong><div className="confirm-modal-actions"><button className="secondary-button" type="button" disabled={deleteProductMutation.isPending} onClick={() => setProductToDelete(null)}>{t("cancel")}</button><button className="danger-button" type="button" disabled={deleteProductMutation.isPending} onClick={deleteProduct}>{deleteProductMutation.isPending ? t("deleting") : t("confirmDelete")}</button></div></div></div> : null}
    </section>
  );
}

function LoadingRows({label}: {label: string}) {
  return <>{[0, 1, 2, 3, 4].map((row) => <tr key={row} aria-label={label}>{Array.from({length: TABLE_COLUMN_COUNT}, (_, cell) => <td key={cell}><span className="skeleton table-line" /></td>)}</tr>)}</>;
}
