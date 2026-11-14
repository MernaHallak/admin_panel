"use client";

import {useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent} from "react";
import {useSearchParams} from "next/navigation";
import {Eye, Pencil, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {MobileRowActions} from "@/components/mobile-row-actions";
import {useStoreAdmins} from "@/hook/queries/use-store-admins";
import {useUpdateStoreAdmin} from "@/hook/mutations/use-store-admin-mutations";
import {useStores} from "@/hook/queries/use-stores";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";
import type {StoreAdminAssignment, StoreAdminAssignmentStatus} from "@/types/store-admin";

const TABLE_COLUMN_COUNT = 7;
const PAGE_LIMIT = 20;
const STATUSES: StoreAdminAssignmentStatus[] = ["all", "active", "inactive"];

function pageValue(value: string | null) { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : 1; }
function isInteractiveTarget(target: EventTarget | null) { return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, [role='button'], [role='link']")); }
function storeName(assignment: StoreAdminAssignment) { return assignment.store.name || assignment.store.slug; }

export function StoreAdminsList() {
  const t = useTranslations("StoreAdmins");
  const common = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const q = searchParams.get("q") ?? "";
  const storeId = searchParams.get("store_id") ?? "";
  const rawStatus = searchParams.get("status");
  const status = STATUSES.includes(rawStatus as StoreAdminAssignmentStatus) ? rawStatus as StoreAdminAssignmentStatus : "all";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" as const : "newest" as const;
  const page = pageValue(searchParams.get("page"));
  const hasActiveFilters = Boolean(q || storeId || status !== "all");
  const [search, setSearch] = useState(q);
  const [updatingId, setUpdatingId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const {data: storesData} = useStores({status: "all", sort: "name_asc", limit: 100});
  const params = useMemo(() => ({q: q || undefined, store_id: storeId || undefined, status, sort, page, limit: PAGE_LIMIT}), [q, storeId, status, sort, page]);
  const {data, isPending, isError, error, isFetching, refetch} = useStoreAdmins(params);
  const updateMutation = useUpdateStoreAdmin();
  const normalizedError = isError ? normalizeApiError(error) : undefined;

  function updateQuery(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParamString);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => setSearch(q), [q]);
  useEffect(() => { const value = search.trim(); if (value === q) return; const timeout = window.setTimeout(() => updateQuery({q: value || undefined, page: undefined}), 350); return () => window.clearTimeout(timeout); }, [q, search]);

  async function toggleAssignment(id: string, assignmentIsActive: boolean) {
    if (updatingId) return;
    setUpdatingId(id); setActionError(undefined);
    try { await updateMutation.mutateAsync({id, payload: {assignment_is_active: !assignmentIsActive}}); }
    catch (mutationError) { const normalized = normalizeApiError(mutationError); if (normalized.status === 401) router.replace("/login"); else setActionError(normalized.status === 403 ? common("forbidden") : common(normalized.translationKey)); }
    finally { setUpdatingId(undefined); }
  }

  function openAssignment(id: string) { router.push(`/store-admins/${id}`); }
  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if ((event.key !== "Enter" && event.key !== " ") || (event.target !== event.currentTarget && isInteractiveTarget(event.target))) return;
    event.preventDefault(); openAssignment(id);
  }

  const emptyMessage = hasActiveFilters ? t("noResults") : t("empty");
  const toolbarDescription = isPending ? t("loading") : isError ? t("unableToLoad") : data ? t("results", {count: data.pagination.total}) : emptyMessage;

  return <section className="data-table-panel store-admins-directory-panel" aria-labelledby="store-admins-table-title">
    <header className="store-admins-directory-header">
      <div className="table-toolbar-copy"><h2 id="store-admins-table-title">{t("tableTitle")}</h2><p>{toolbarDescription}</p></div>
      <div className="store-admins-directory-actions">
        <div className="stores-search"><Search size={18} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} /></div>
        <Link className="primary-button" href="/store-admins/create">{t("addAction")}</Link>
        {isFetching && !isPending ? <span className="table-refreshing" aria-label={t("refreshing")}><span className="spinner dark" /></span> : null}
      </div>
    </header>
    <div className="store-admins-filter-bar" aria-label={t("filters")}>
      <label className="table-filter"><span className="sr-only">{t("storeFilter")}</span><select value={storeId} onChange={(event) => updateQuery({store_id: event.target.value || undefined, page: undefined})} aria-label={t("storeFilter")}><option value="">{t("allStores")}</option>{storesData?.data.map((store) => <option key={store.id} value={store.id}>{store.name_i18n?.en?.trim() || store.name || store.slug}</option>)}</select></label>
      <label className="table-filter"><span className="sr-only">{t("statusFilter")}</span><select value={status} onChange={(event) => updateQuery({status: event.target.value === "all" ? undefined : event.target.value, page: undefined})} aria-label={t("statusFilter")}><option value="all">{t("statusAll")}</option><option value="active">{t("active")}</option><option value="inactive">{t("inactive")}</option></select></label>
      <label className="table-filter"><span className="sr-only">{t("sortFilter")}</span><select value={sort} onChange={(event) => updateQuery({sort: event.target.value === "newest" ? undefined : event.target.value, page: undefined})} aria-label={t("sortFilter")}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option></select></label>
    </div>
    {actionError ? <p className="store-products-action-error" role="alert">{actionError}</p> : null}
    <div className="table-scroll desktop-list-table"><table className="stores-table store-admins-table"><thead><tr><th className="store-admins-column store-admins-name-column">{t("name")}</th><th className="store-admins-column store-admins-email-column">{t("email")}</th><th className="store-admins-column store-admins-store-column">{t("store")}</th><th className="store-admins-column store-admins-assignment-column">{t("assignmentStatus")}</th><th className="store-admins-column store-admins-profile-column">{t("profileStatus")}</th><th className="store-admins-column store-admins-effective-column">{t("effectiveStatus")}</th><th className="store-admins-column store-admins-actions-column">{t("actions")}</th></tr></thead><tbody>{isPending ? <LoadingRows label={t("loading")} /> : isError ? <tr><td colSpan={TABLE_COLUMN_COUNT}><StateError t={t} common={common} status={normalizedError?.status} retry={refetch} login={() => router.replace("/login")} /></td></tr> : !data?.data.length ? <tr><td colSpan={TABLE_COLUMN_COUNT}><div className="table-state"><span className="state-icon">◇</span><p>{emptyMessage}</p></div></td></tr> : data.data.map((assignment) => <tr key={assignment.id} className="table-navigation-row" tabIndex={0} aria-label={t("view")} onClick={(event: MouseEvent<HTMLTableRowElement>) => { if (!isInteractiveTarget(event.target)) openAssignment(assignment.id); }} onKeyDown={(event) => handleRowKeyDown(event, assignment.id)}><td className="store-admins-column store-admins-name-column store-admin-name-cell"><Link className="store-name-link" href={`/store-admins/${assignment.id}`} title={assignment.profile.full_name} onClick={(event) => event.stopPropagation()}><span dir="auto">{assignment.profile.full_name}</span></Link></td><td className="store-admins-column store-admins-email-column store-admin-email-cell"><span className="store-admin-email-value" dir="ltr">{assignment.profile.email}</span></td><td className="store-admins-column store-admins-store-column store-admin-store-cell" title={storeName(assignment)}><span dir="auto">{storeName(assignment)}</span></td><td className="store-admins-column store-admins-assignment-column"><div className="store-admins-status-cell-content"><StatusControl assignment={assignment} updating={updatingId === assignment.id} t={t} onToggle={() => void toggleAssignment(assignment.id, assignment.assignment_is_active)} /></div></td><td className="store-admins-column store-admins-profile-column"><div className="store-admins-status-cell-content"><StatusBadge active={assignment.profile_is_active} t={t} /></div></td><td className="store-admins-column store-admins-effective-column"><div className="store-admins-status-cell-content"><StatusBadge active={assignment.effective_is_active} t={t} /></div></td><td className="store-admins-column store-admins-actions-column table-action-cell"><div className="table-actions store-admins-actions-content"><Link className="table-view-action" href={`/store-admins/${assignment.id}`} aria-label={t("view")} onClick={(event) => event.stopPropagation()}><Eye size={18} aria-hidden="true" /></Link><Link className="table-view-action" href={`/store-admins/${assignment.id}/edit`} aria-label={t("edit")} onClick={(event) => event.stopPropagation()}><Pencil size={18} aria-hidden="true" /></Link></div></td></tr>)}</tbody></table></div>
    <div className="mobile-list store-admins-mobile-list" aria-label={t("tableTitle")}>
      {isPending ? <MobileStoreAdminSkeletons label={t("loading")} /> : null}
      {isError ? <div className="mobile-list-state" role="alert"><strong>{t("loadError")}</strong><p>{normalizedError?.status === 401 ? t("sessionExpired") : normalizedError?.status === 403 ? common("forbidden") : common("unexpectedError")}</p>{normalizedError?.status === 401 ? <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>{common("login")}</button> : normalizedError?.status !== 403 ? <button className="secondary-button" type="button" onClick={() => refetch()}>{common("retry")}</button> : null}</div> : null}
      {!isPending && !isError && !data?.data.length ? <div className="mobile-list-state"><p>{emptyMessage}</p></div> : null}
      {!isPending && !isError ? data?.data.map((assignment) => <article key={assignment.id} className="mobile-list-card store-admin-mobile-card" role="link" tabIndex={0} aria-label={t("view")} onClick={() => openAssignment(assignment.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openAssignment(assignment.id); } }}><div className="mobile-list-card-header"><Link className="mobile-list-title" href={`/store-admins/${assignment.id}`} title={assignment.profile.full_name} onClick={(event) => event.stopPropagation()}><strong dir="auto">{assignment.profile.full_name}</strong></Link><MobileRowActions label={t("actions")} actions={[{label: t("view"), onSelect: () => openAssignment(assignment.id)}, {label: t("edit"), onSelect: () => router.push(`/store-admins/${assignment.id}/edit`)}, {label: assignment.assignment_is_active ? t("deactivateAssignment") : t("activateAssignment"), onSelect: () => void toggleAssignment(assignment.id, assignment.assignment_is_active), disabled: Boolean(updatingId)}]} /></div><p className="mobile-list-meta store-admin-mobile-email" dir="ltr">{assignment.profile.email}</p><p className="mobile-list-detail store-admin-mobile-store"><span className="store-admin-mobile-store-label">{t("store")}:</span>{" "}<span className="store-admin-mobile-store-value" dir="auto">{storeName(assignment)}</span></p><div className="mobile-list-card-footer store-admin-mobile-status"><span>{t("effectiveStatus")}</span><StatusBadge active={assignment.effective_is_active} t={t} /></div></article>) : null}
    </div>
    {data && data.pagination.total_pages > 1 ? <div className="table-pagination" aria-label={t("pagination")}><button className="secondary-button" type="button" disabled={!data.pagination.has_prev || isFetching} onClick={() => updateQuery({page: String(Math.max(1, data.pagination.page - 1))})}>{t("previous")}</button><span>{t("page", {page: data.pagination.page, total: data.pagination.total_pages})}</span><button className="secondary-button" type="button" disabled={!data.pagination.has_next || isFetching} onClick={() => updateQuery({page: String(data.pagination.page + 1)})}>{t("next")}</button></div> : null}
  </section>;
}

function StatusBadge({active, t}: {active: boolean; t: ReturnType<typeof useTranslations>}) { return <span className={`store-status ${active ? "active" : "inactive"}`}>{active ? t("active") : t("inactive")}</span>; }
function StatusControl({assignment, updating, t, onToggle}: {assignment: StoreAdminAssignment; updating: boolean; t: ReturnType<typeof useTranslations>; onToggle: () => void}) { return <button className={`store-status store-status-control ${assignment.assignment_is_active ? "active" : "inactive"}`} type="button" disabled={updating} aria-busy={updating} aria-label={assignment.assignment_is_active ? t("deactivateAssignment") : t("activateAssignment")} onClick={(event) => { event.stopPropagation(); onToggle(); }} onKeyDown={(event) => event.stopPropagation()}>{updating ? <span className="spinner dark" aria-label={t("updatingStatus")} /> : assignment.assignment_is_active ? t("active") : t("inactive")}</button>; }
function StateError({t, common, status, retry, login}: {t: ReturnType<typeof useTranslations>; common: ReturnType<typeof useTranslations>; status?: number; retry: () => void; login: () => void}) { return <div className="table-state" role="alert"><span className="state-icon">!</span><strong>{t("loadError")}</strong><p>{status === 401 ? t("sessionExpired") : status === 403 ? common("forbidden") : common("unexpectedError")}</p>{status === 401 ? <button className="secondary-button" type="button" onClick={login}>{common("login")}</button> : status !== 403 ? <button className="secondary-button" type="button" onClick={retry}>{common("retry")}</button> : null}</div>; }
function LoadingRows({label}: {label: string}) { return <>{[0,1,2,3,4].map((row) => <tr key={row} aria-label={label}>{Array.from({length: TABLE_COLUMN_COUNT}, (_, cell) => <td key={cell}><span className="skeleton table-line" /></td>)}</tr>)}</>; }
function MobileStoreAdminSkeletons({label}: {label: string}) { return <>{[0, 1, 2, 3].map((row) => <div className="mobile-list-card mobile-list-skeleton" key={row} aria-label={label}><span className="skeleton mobile-list-skeleton-title" /><span className="skeleton mobile-list-skeleton-line" /><span className="skeleton mobile-list-skeleton-footer" /></div>)}</>; }
