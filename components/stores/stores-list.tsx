"use client";

import {useEffect, useState, type KeyboardEvent, type MouseEvent} from "react";
import {Eye, Pencil, Search} from "lucide-react";
import { useTranslations } from "next-intl";

import { useStores } from "@/hook/queries/use-stores";
import {useToggleStoreStatus} from "@/hook/mutations/use-toggle-store-status";
import { Link } from "@/i18n/navigation";
import { normalizeApiError } from "@/lib/api-error";
import { useRouter } from "@/i18n/navigation";
import type { StoreListSort, StoreListStatus } from "@/types/store";

const TABLE_COLUMN_COUNT = 5;
const PAGE_LIMIT = 20;

interface StatusUpdateError {
  id: string;
  message: string;
}

function getNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(
    target.closest("a, button, input, select, textarea, [role='button'], [role='link']"),
  );
}

export function StoresList() {
  const t = useTranslations("Stores");
  const common = useTranslations("Common");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StoreListStatus>("all");
  const [sort, setSort] = useState<StoreListSort>("newest");
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useStores({
    q: debouncedSearch || undefined,
    status,
    sort,
    page,
    limit: PAGE_LIMIT,
  });
  const toggleStoreStatusMutation = useToggleStoreStatus();
  const [statusUpdateError, setStatusUpdateError] = useState<StatusUpdateError>();
  const normalizedError = isError ? normalizeApiError(error) : undefined;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const toolbarDescription = isPending
    ? t("loading")
    : isError
      ? t("unableToLoadStores")
      : data
        ? t("results", { count: data.pagination.total })
        : t("empty");

  function handleStatusChange(nextStatus: StoreListStatus) {
    setStatus(nextStatus);
    setPage(1);
  }

  function handleSortChange(nextSort: StoreListSort) {
    setSort(nextSort);
    setPage(1);
  }

  function openStore(id: string) {
    router.push(`/stores/${id}`);
  }

  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, id: string) {
    if (!isInteractiveTarget(event.target)) openStore(id);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target !== event.currentTarget && isInteractiveTarget(event.target)) return;

    event.preventDefault();
    openStore(id);
  }

  async function handleStoreStatusToggle(id: string, isActive: boolean) {
    if (toggleStoreStatusMutation.isPending) return;

    setStatusUpdateError(undefined);

    try {
      await toggleStoreStatusMutation.mutateAsync({id, isActive});
    } catch (mutationError) {
      const normalized = normalizeApiError(mutationError);
      if (normalized.status === 401) {
        router.replace("/login");
        return;
      }

      setStatusUpdateError({
        id,
        message: normalized.status === 403
          ? common("forbidden")
          : normalized.message ?? common(normalized.translationKey),
      });
    }
  }

  return (
    <section className="data-table-panel" aria-labelledby="stores-table-title">
      <div className="table-toolbar">
        <div className="table-toolbar-copy">
          <h2 id="stores-table-title">{t("tableTitle")}</h2>
          <p>{toolbarDescription}</p>
        </div>

        <div className="table-toolbar-actions">
          <Link className="primary-button" href="/stores/create">
            {t("createAction")}
          </Link>

          {isFetching && !isPending && (
            <span className="table-refreshing" aria-label={t("refreshing")}>
              <span className="spinner dark" aria-hidden="true" />
            </span>
          )}

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

          <label className="table-filter">
            <span className="sr-only">{t("statusFilter")}</span>
            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as StoreListStatus)}
              aria-label={t("statusFilter")}
            >
              <option value="all">{t("statusAll")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="inactive">{t("statusInactive")}</option>
            </select>
          </label>

          <label className="table-filter">
            <span className="sr-only">{t("sortFilter")}</span>
            <select
              value={sort}
              onChange={(event) => handleSortChange(event.target.value as StoreListSort)}
              aria-label={t("sortFilter")}
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="oldest">{t("sortOldest")}</option>
              <option value="name_asc">{t("sortNameAsc")}</option>
              <option value="name_desc">{t("sortNameDesc")}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-scroll">
        <table className="stores-table">
          <thead>
            <tr>
              <th scope="col">{t("store")}</th>
              <th scope="col">{t("phone")}</th>
              <th scope="col">{t("status")}</th>
              <th scope="col">{t("updated")}</th>
              <th scope="col">{t("actions")}</th>
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
                    <p>{normalizedError?.status === 401
                      ? t("sessionExpired")
                      : normalizedError?.message ?? common(normalizedError?.translationKey ?? "unexpectedError")}</p>
                    {normalizedError?.status === 401 ? (
                      <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>
                        {common("login")}
                      </button>
                    ) : (
                      <button className="secondary-button" type="button" onClick={() => refetch()}>
                        {common("retry")}
                      </button>
                    )}
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
            ) : (
              data.data.map((store) => {
                const name =
                  getNonEmptyString(store.name_i18n?.en) ||
                  getNonEmptyString(store.name) ||
                  getNonEmptyString(store.slug) ||
                  t("unnamedStore");
                const updatedAt = new Date(store.updated_at);
                const formattedUpdatedAt = Number.isNaN(updatedAt.getTime())
                  ? t("notAvailable")
                  : `${new Intl.NumberFormat("en-US", {useGrouping: false}).format(updatedAt.getUTCDate())} ${t(`months.${updatedAt.getUTCMonth()}`)} ${new Intl.NumberFormat("en-US", {useGrouping: false}).format(updatedAt.getUTCFullYear())}`;

                return (
                  <tr
                    key={store.id}
                    className="store-row table-navigation-row"
                    tabIndex={0}
                    aria-label={t("viewStoreDetails")}
                    onClick={(event) => handleRowClick(event, store.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, store.id)}
                  >
                    <td>
                      <div className="table-store">
                        <div className="table-store-logo">
                          {store.logo_url ? (
                            // The API accepts arbitrary HTTPS logo hosts, so an img avoids inventing a Next image host allowlist.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={store.logo_url} alt={t("logoAlt", { name })} />
                          ) : (
                            <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <Link
                          className="store-name-link"
                          href={`/stores/${store.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {name}
                        </Link>
                      </div>
                    </td>
                    <td>{store.phone || "—"}</td>
                    <td>
                      <button
                        className={`store-status store-status-control ${store.is_active ? "active" : "inactive"}`}
                        type="button"
                        disabled={toggleStoreStatusMutation.isPending}
                        aria-label={store.is_active ? t("deactivateStore") : t("activateStore")}
                        title={store.is_active ? t("deactivateStore") : t("activateStore")}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleStoreStatusToggle(store.id, !store.is_active);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        {toggleStoreStatusMutation.isPending && toggleStoreStatusMutation.variables?.id === store.id ? (
                          <span className="spinner dark" aria-label={t("updatingStatus")} />
                        ) : store.is_active ? t("active") : t("inactive")}
                      </button>
                      {statusUpdateError?.id === store.id && (
                        <p className="field-error" role="alert">{statusUpdateError.message}</p>
                      )}
                    </td>
                    <td className="date-cell">
                      {formattedUpdatedAt}
                    </td>
                    <td className="table-action-cell">
                      <div className="table-actions">
                        <Link
                          className="table-view-action"
                          href={`/stores/${store.id}`}
                          aria-label={t("viewStoreDetails")}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Eye size={18} aria-hidden="true" />
                        </Link>
                        <Link
                          className="table-view-action"
                          href={`/stores/${store.id}/edit`}
                          aria-label={t("editStore")}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.pagination.total_pages > 1 && (
        <div className="table-pagination" aria-label={t("pagination")}>
          <button
            className="secondary-button"
            type="button"
            disabled={!data.pagination.has_prev || isFetching}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          >
            {t("previous")}
          </button>
          <span>{t("page", { page: data.pagination.page, total: data.pagination.total_pages })}</span>
          <button
            className="secondary-button"
            type="button"
            disabled={!data.pagination.has_next || isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            {t("next")}
          </button>
        </div>
      )}
    </section>
  );
}

function TableLoadingRows({ label }: { label: string }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((row) => (
        <tr key={row} aria-label={label}>
          <td>
            <div className="table-store">
              <span className="skeleton table-store-logo" />
              <span className="skeleton table-line wide" />
            </div>
          </td>
          {[1, 2, 3, 4].map((cell) => (
            <td key={cell}><span className="skeleton table-line" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}
