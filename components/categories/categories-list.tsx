"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useDeleteCategory } from "@/hook/mutations/use-category-mutations";
import { useSuperAdminCategories } from "@/hook/queries/use-super-admin-categories";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getLocalizedValue } from "@/lib/i18n/get-localized-value";
import { normalizeApiError } from "@/lib/api-error";
import { MobileRowActions } from "@/components/mobile-row-actions";
import type { SupportedLocale } from "@/i18n/routing";
import type { SuperAdminCategoriesParams } from "@/types/category";

const TABLE_COLUMN_COUNT = 4;
const DEFAULT_LIMIT = 20;
const MAX_QUERY_LENGTH = 150;
const SEARCH_DEBOUNCE_MS = 350;
const SORTS = ["name_asc", "name_desc", "newest", "oldest"] as const;

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, select, textarea, [role='button'], [role='link']",
      ),
    )
  );
}

function pageFrom(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function CategoriesList() {
  const t = useTranslations("Categories");
  const controls = useTranslations("TaxonomyList");
  const common = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const remove = useDeleteCategory();
  const [candidate, setCandidate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string>();

  const q = searchParams.get("q") ?? "";
  const [searchValue, setSearchValue] = useState(q);
  const status =
    searchParams.get("status") === "active" ||
    searchParams.get("status") === "inactive"
      ? searchParams.get("status")!
      : "all";
  const requestedSort = searchParams.get("sort");
  const sort = SORTS.includes(requestedSort as (typeof SORTS)[number])
    ? (requestedSort as (typeof SORTS)[number])
    : "name_asc";
  const page = pageFrom(searchParams.get("page"));
  const requestedLimit = Number(searchParams.get("limit"));
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : DEFAULT_LIMIT;
  const params: SuperAdminCategoriesParams = {
    q: q || undefined,
    status: status as SuperAdminCategoriesParams["status"],
    sort,
    page,
    limit,
  };
  const { data, isPending, isError, error, refetch, isFetching } =
    useSuperAdminCategories(params);
  const normalized = isError ? normalizeApiError(error) : undefined;
  const hasActiveFilters =
    Boolean(q) ||
    status !== "all" ||
    sort !== "name_asc" ||
    page !== 1 ||
    limit !== DEFAULT_LIMIT;

  function updateParams(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextQuery = searchValue.trim();
      if (nextQuery === q) return;
      updateParams({ q: nextQuery || undefined, page: undefined });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [q, searchValue, searchParams, pathname, router]);

  function openCategory(id: string) {
    router.push(`/categories/${id}`);
  }

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    id: string,
  ) {
    if (
      (event.key !== "Enter" && event.key !== " ") ||
      (event.target !== event.currentTarget &&
        isInteractiveTarget(event.target))
    )
      return;
    event.preventDefault();
    openCategory(id);
  }

  async function confirmDelete() {
    if (!candidate) return;
    try {
      await remove.mutateAsync(candidate.id);
      setCandidate(null);
    } catch (failure) {
      const apiError = normalizeApiError(failure);
      if (apiError.status === 401) {
        router.replace("/login");
        return;
      }
      setActionError(common(apiError.translationKey));
    }
  }

  return (
    <section className="data-table-panel">
      <div className="table-toolbar global-products-toolbar">
        <div className="table-toolbar-copy">
          <h2>{t("tableTitle")}</h2>
          <p>
            {isPending
              ? t("loading")
              : data
                ? t("results", {
                    count: data.pagination.total ?? data.data.length,
                  })
                : t("empty")}
          </p>
        </div>
        <div className="table-toolbar-actions">
          <Link className="primary-button" href="/categories/create">
            {t("add")}
          </Link>
          <label className="stores-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <input
              type="search"
              value={searchValue}
              maxLength={MAX_QUERY_LENGTH}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>
          <label className="table-filter">
            <span className="sr-only">{controls("statusFilter")}</span>
            <select
              aria-label={controls("statusFilter")}
              value={status}
              onChange={(event) =>
                updateParams({
                  status:
                    event.target.value === "all"
                      ? undefined
                      : event.target.value,
                  page: undefined,
                })
              }
            >
              <option value="all">{controls("all")}</option>
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </select>
          </label>
          <label className="table-filter">
            <span className="sr-only">{controls("sortFilter")}</span>
            <select
              aria-label={controls("sortFilter")}
              value={sort}
              onChange={(event) =>
                updateParams({
                  sort:
                    event.target.value === "name_asc"
                      ? undefined
                      : event.target.value,
                  page: undefined,
                })
              }
            >
              <option value="name_asc">{controls("nameAsc")}</option>
              <option value="name_desc">{controls("nameDesc")}</option>
              <option value="newest">{controls("newest")}</option>
              <option value="oldest">{controls("oldest")}</option>
            </select>
          </label>
          {hasActiveFilters ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                updateParams({
                  q: undefined,
                  status: undefined,
                  sort: undefined,
                  page: undefined,
                  limit: undefined,
                })
              }
            >
              {controls("reset")}
            </button>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p className="store-products-action-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="table-scroll">
        <table className="stores-table categories-table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              {/* <th>{t("slug")}</th> */}
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <LoadingRows />
            ) : isError ? (
              <tr>
                <td colSpan={TABLE_COLUMN_COUNT}>
                  <div className="table-state" role="alert">
                    <strong>{t("loadError")}</strong>
                    <p>
                      {normalized?.status === 403
                        ? common("forbidden")
                        : common(
                            normalized?.translationKey ?? "unexpectedError",
                          )}
                    </p>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => refetch()}
                    >
                      {common("retry")}
                    </button>
                  </div>
                </td>
              </tr>
            ) : !data?.data.length ? (
              <tr>
                <td colSpan={TABLE_COLUMN_COUNT}>
                  <div className="table-state">
                    <p>
                      {hasActiveFilters ? controls("noMatches") : t("empty")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.data.map((category) => {
                const name =
                  getLocalizedValue({
                    localized: category.name_i18n,
                    locale,
                    fallback: category.name,
                  }) || t("unnamed");
                return (
                  <tr
                    key={category.id}
                    className="table-navigation-row"
                    tabIndex={0}
                    onClick={(event: MouseEvent<HTMLTableRowElement>) => {
                      if (!isInteractiveTarget(event.target))
                        openCategory(category.id);
                    }}
                    onKeyDown={(event) => handleRowKeyDown(event, category.id)}
                  >
                    <td>
                      <Link
                        className="store-name-link"
                        href={`/categories/${category.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {name}
                      </Link>
                    </td>
                    {/* <td>{category.slug}</td> */}
                    <td>
                      <span
                        className={`store-status ${category.is_active ? "active" : "inactive"}`}
                      >
                        {category.is_active ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="table-view-action"
                          href={`/categories/${category.id}`}
                          aria-label={t("view")}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          className="table-view-action"
                          href={`/categories/${category.id}/edit`}
                          aria-label={t("edit")}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Pencil size={18} />
                        </Link>
                        <button
                          className="table-view-action danger"
                          type="button"
                          disabled={remove.isPending}
                          aria-label={t("delete")}
                          onClick={(event) => {
                            event.stopPropagation();
                            setCandidate({ id: category.id, name });
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <MobileRowActions
                        label={t("actions")}
                        actions={[
                          {label: t("view"), onSelect: () => router.push(`/categories/${category.id}`)},
                          {label: t("edit"), onSelect: () => router.push(`/categories/${category.id}/edit`)},
                          {label: t("delete"), onSelect: () => setCandidate({id: category.id, name}), destructive: true, disabled: remove.isPending},
                        ]}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.pagination.total_pages > 1 ? (
        <div className="table-pagination">
          <button
            className="secondary-button"
            type="button"
            disabled={!data.pagination.has_prev || isFetching}
            onClick={() =>
              updateParams({
                page: String(Math.max(1, data.pagination.page - 1)),
              })
            }
          >
            {controls("previous")}
          </button>
          <span>
            {controls("page", {
              page: data.pagination.page,
              total: data.pagination.total_pages,
            })}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={!data.pagination.has_next || isFetching}
            onClick={() =>
              updateParams({ page: String(data.pagination.page + 1) })
            }
          >
            {controls("next")}
          </button>
        </div>
      ) : null}

      {candidate ? (
        <div className="confirm-modal-backdrop">
          <div className="confirm-modal" role="alertdialog">
            <h2>{t("deleteTitle")}</h2>
            <p>{t("deleteMessage")}</p>
            <div className="confirm-modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setCandidate(null)}
              >
                {t("cancel")}
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={remove.isPending}
                onClick={confirmDelete}
              >
                {remove.isPending ? t("deleting") : t("confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LoadingRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <tr key={row}>
          {Array.from({ length: TABLE_COLUMN_COUNT }, (_, cell) => (
            <td key={cell}>
              <span className="skeleton table-line" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
