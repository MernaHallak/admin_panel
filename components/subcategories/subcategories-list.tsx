"use client";

import {useState, type KeyboardEvent, type MouseEvent} from "react";
import {useSearchParams} from "next/navigation";
import {Eye, Pencil, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Link, usePathname, useRouter} from "@/i18n/navigation";
import {useDeleteSubcategory} from "@/hook/mutations/use-subcategory-mutations";
import {useSuperAdminSubcategories} from "@/hook/queries/use-super-admin-subcategories";
import {useSuperAdminCategories} from "@/hook/queries/use-super-admin-categories";
import {getLocalizedValue} from "@/lib/i18n/get-localized-value";
import {normalizeApiError} from "@/lib/api-error";
import type {SupportedLocale} from "@/i18n/routing";
import type {SuperAdminSubcategoriesParams} from "@/types/category";

const TABLE_COLUMN_COUNT = 4;
const DEFAULT_LIMIT = 20;
const SORTS = ["name_asc", "name_desc", "newest", "oldest"] as const;

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, [role='button'], [role='link']"));
}

function pageFrom(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function SubcategoriesList() {
  const t = useTranslations("Subcategories");
  const detailT = useTranslations("SubcategoryDetails");
  const controls = useTranslations("TaxonomyList");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {data: categories} = useSuperAdminCategories({status: "all", sort: "name_asc", limit: 100});
  const [target, setTarget] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const remove = useDeleteSubcategory();

  const categoryId = searchParams.get("category_id") ?? "";
  const status = searchParams.get("status") === "active" || searchParams.get("status") === "inactive"
    ? searchParams.get("status")!
    : "all";
  const requestedSort = searchParams.get("sort");
  const sort = SORTS.includes(requestedSort as typeof SORTS[number])
    ? requestedSort as typeof SORTS[number]
    : "name_asc";
  const page = pageFrom(searchParams.get("page"));
  const requestedLimit = Number(searchParams.get("limit"));
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : DEFAULT_LIMIT;
  const params: SuperAdminSubcategoriesParams = {
    category_id: categoryId || undefined,
    status: status as SuperAdminSubcategoriesParams["status"],
    sort,
    page,
    limit,
  };
  const {data, isPending, isError, error, refetch, isFetching} = useSuperAdminSubcategories(params);
  const normalized = isError ? normalizeApiError(error) : undefined;
  const hasActiveFilters = Boolean(categoryId) || status !== "all" || sort !== "name_asc" || page !== 1 || limit !== DEFAULT_LIMIT;

  function updateParams(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function openSubcategory(id: string) {
    router.push(`/subcategories/${id}`);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if ((event.key !== "Enter" && event.key !== " ") || (event.target !== event.currentTarget && isInteractiveTarget(event.target))) return;
    event.preventDefault();
    openSubcategory(id);
  }

  async function confirmDelete() {
    if (!target) return;
    try {
      await remove.mutateAsync(target);
      setTarget(undefined);
    } catch (failure) {
      const apiError = normalizeApiError(failure);
      if (apiError.status === 401) {
        router.replace("/login");
        return;
      }
      setActionError(common(apiError.translationKey));
    }
  }

  return <section className="data-table-panel">
    <div className="table-toolbar global-products-toolbar">
      <div className="table-toolbar-copy">
        <h2>{t("tableTitle")}</h2>
        <p>{isPending ? t("loading") : data ? t("results", {count: data.pagination.total ?? data.data.length}) : t("empty")}</p>
      </div>
      <div className="table-toolbar-actions">
        <Link className="primary-button" href="/subcategories/create">{t("add")}</Link>
        <label className="table-filter">
          <span className="sr-only">{t("category")}</span>
          <select aria-label={t("category")} value={categoryId} onChange={(event) => updateParams({category_id: event.target.value || undefined, page: undefined})}>
            <option value="">{controls("allCategories")}</option>
            {categories?.data.map((category) => {
              const categoryName = getLocalizedValue({localized: category.name_i18n, locale, fallback: category.name}) || category.name;
              return <option key={category.id} value={category.id}>{categoryName}</option>;
            })}
          </select>
        </label>
        <label className="table-filter">
          <span className="sr-only">{controls("statusFilter")}</span>
          <select aria-label={controls("statusFilter")} value={status} onChange={(event) => updateParams({status: event.target.value === "all" ? undefined : event.target.value, page: undefined})}>
            <option value="all">{controls("all")}</option>
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
        </label>
        <label className="table-filter">
          <span className="sr-only">{controls("sortFilter")}</span>
          <select aria-label={controls("sortFilter")} value={sort} onChange={(event) => updateParams({sort: event.target.value === "name_asc" ? undefined : event.target.value, page: undefined})}>
            <option value="name_asc">{controls("nameAsc")}</option>
            <option value="name_desc">{controls("nameDesc")}</option>
            <option value="newest">{controls("newest")}</option>
            <option value="oldest">{controls("oldest")}</option>
          </select>
        </label>
        {hasActiveFilters ? <button className="secondary-button" type="button" onClick={() => updateParams({category_id: undefined, status: undefined, sort: undefined, page: undefined, limit: undefined})}>{controls("reset")}</button> : null}
      </div>
    </div>

    {actionError ? <p className="store-products-action-error" role="alert">{actionError}</p> : null}

    <div className="table-scroll">
      <table className="stores-table">
        <thead><tr><th>{t("name")}</th><th>{t("category")}</th><th>{t("status")}</th><th>{t("actions")}</th></tr></thead>
        <tbody>
          {isPending ? <LoadingRows /> : isError ? <tr><td colSpan={TABLE_COLUMN_COUNT}><div className="table-state" role="alert"><strong>{t("loadError")}</strong><p>{normalized?.status === 403 ? common("forbidden") : common(normalized?.translationKey ?? "unexpectedError")}</p><button className="secondary-button" type="button" onClick={() => refetch()}>{common("retry")}</button></div></td></tr> : !data?.data.length ? <tr><td colSpan={TABLE_COLUMN_COUNT}><div className="table-state"><p>{hasActiveFilters ? controls("noMatches") : t("empty")}</p></div></td></tr> : data.data.map((item) => {
            const name = getLocalizedValue({localized: item.name_i18n, locale, fallback: item.name}) || detailT("unnamed");
            return <tr key={item.id} className="table-navigation-row" tabIndex={0} aria-label={t("view")} onClick={(event: MouseEvent<HTMLTableRowElement>) => { if (!isInteractiveTarget(event.target)) openSubcategory(item.id); }} onKeyDown={(event) => handleRowKeyDown(event, item.id)}>
              <td dir="auto"><Link className="store-name-link" href={`/subcategories/${item.id}`} onClick={(event) => event.stopPropagation()}>{name}</Link></td>
              <td dir="auto">{item.category_slug}</td>
              <td><span className={`store-status ${item.is_active ? "active" : "inactive"}`}>{item.is_active ? t("active") : t("inactive")}</span></td>
              <td className="table-action-cell"><div className="table-actions">
                <Link className="table-view-action" href={`/subcategories/${item.id}`} aria-label={t("view")} onClick={(event) => event.stopPropagation()}><Eye size={18} aria-hidden="true" /></Link>
                <Link className="table-view-action" href={`/subcategories/${item.id}/edit`} aria-label={t("edit")} onClick={(event) => event.stopPropagation()}><Pencil size={18} aria-hidden="true" /></Link>
                <button className="table-view-action danger" type="button" disabled={remove.isPending} aria-label={t("delete")} onClick={(event) => { event.stopPropagation(); setTarget(item.id); }}><Trash2 size={18} aria-hidden="true" /></button>
              </div></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>

    {data && data.pagination.total_pages > 1 ? <div className="table-pagination">
      <button className="secondary-button" type="button" disabled={!data.pagination.has_prev || isFetching} onClick={() => updateParams({page: String(Math.max(1, data.pagination.page - 1))})}>{controls("previous")}</button>
      <span>{controls("page", {page: data.pagination.page, total: data.pagination.total_pages})}</span>
      <button className="secondary-button" type="button" disabled={!data.pagination.has_next || isFetching} onClick={() => updateParams({page: String(data.pagination.page + 1)})}>{controls("next")}</button>
    </div> : null}

    {target ? <div className="confirm-modal-backdrop"><div className="confirm-modal" role="alertdialog" aria-modal="true"><h2>{t("deleteTitle")}</h2><p>{t("deleteMessage")}</p><div className="confirm-modal-actions"><button className="secondary-button" type="button" disabled={remove.isPending} onClick={() => setTarget(undefined)}>{t("cancel")}</button><button className="danger-button" type="button" disabled={remove.isPending} onClick={confirmDelete}>{remove.isPending ? t("deleting") : t("confirmDelete")}</button></div></div></div> : null}
  </section>;
}

function LoadingRows() {
  return <>{[0, 1, 2].map((row) => <tr key={row}>{Array.from({length: TABLE_COLUMN_COUNT}, (_, column) => <td key={column}><span className="skeleton table-line" /></td>)}</tr>)}</>;
}
