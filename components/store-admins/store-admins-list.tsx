"use client";

import {useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent} from "react";
import {useSearchParams} from "next/navigation";
import {Eye, Pencil, Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {useStoreAdmins} from "@/hook/queries/use-store-admins";
import {useUpdateStoreAdmin} from "@/hook/mutations/use-store-admin-mutations";
import {useStores} from "@/hook/queries/use-stores";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";
import type {StoreAdminAssignmentStatus} from "@/types/store-admin";

const TABLE_COLUMN_COUNT = 8;
const PAGE_LIMIT = 20;
const STATUSES: StoreAdminAssignmentStatus[] = ["all", "active", "inactive"];

function pageValue(value: string | null) { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : 1; }
function isInteractiveTarget(target: EventTarget | null) { return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, [role='button'], [role='link']")); }

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
    event.preventDefault();
    openAssignment(id);
  }

  const toolbarDescription = isPending ? t("loading") : isError ? t("unableToLoad") : data ? t("results", {count: data.pagination.total}) : t("empty");
  return <section className="data-table-panel" aria-labelledby="store-admins-table-title">
    <div className="table-toolbar global-products-toolbar"><div className="table-toolbar-copy"><h2 id="store-admins-table-title">{t("tableTitle")}</h2><p>{toolbarDescription}</p></div><div className="table-toolbar-actions"><Link className="primary-button" href="/store-admins/create">{t("addAction")}</Link>{isFetching && !isPending ? <span className="table-refreshing" aria-label={t("refreshing")}><span className="spinner dark" /></span> : null}<div className="stores-search"><Search size={18} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} /></div><label className="table-filter"><span className="sr-only">{t("storeFilter")}</span><select value={storeId} onChange={(event) => updateQuery({store_id: event.target.value || undefined, page: undefined})} aria-label={t("storeFilter")}><option value="">{t("allStores")}</option>{storesData?.data.map((store) => <option key={store.id} value={store.id}>{store.name_i18n?.en?.trim() || store.name || store.slug}</option>)}</select></label><label className="table-filter"><span className="sr-only">{t("statusFilter")}</span><select value={status} onChange={(event) => updateQuery({status: event.target.value === "all" ? undefined : event.target.value, page: undefined})} aria-label={t("statusFilter")}><option value="all">{t("statusAll")}</option><option value="active">{t("active")}</option><option value="inactive">{t("inactive")}</option></select></label><label className="table-filter"><span className="sr-only">{t("sortFilter")}</span><select value={sort} onChange={(event) => updateQuery({sort: event.target.value === "newest" ? undefined : event.target.value, page: undefined})} aria-label={t("sortFilter")}><option value="newest">{t("sortNewest")}</option><option value="oldest">{t("sortOldest")}</option></select></label></div></div>
    {actionError ? <p className="store-products-action-error" role="alert">{actionError}</p> : null}
    <div className="table-scroll"><table className="stores-table global-products-table"><thead><tr><th>{t("name")}</th><th>{t("email")}</th><th>{t("store")}</th><th>{t("role")}</th><th>{t("assignmentStatus")}</th><th>{t("profileStatus")}</th><th>{t("effectiveStatus")}</th><th>{t("actions")}</th></tr></thead><tbody>{isPending ? <LoadingRows label={t("loading")} /> : isError ? <tr><td colSpan={TABLE_COLUMN_COUNT}><StateError t={t} common={common} status={normalizedError?.status} retry={refetch} login={() => router.replace("/login")} /></td></tr> : !data?.data.length ? <tr><td colSpan={TABLE_COLUMN_COUNT}><div className="table-state"><span className="state-icon">◇</span><p>{t("empty")}</p></div></td></tr> : data.data.map((assignment) => <tr key={assignment.id} className="table-navigation-row" tabIndex={0} aria-label={t("view")} onClick={(event: MouseEvent<HTMLTableRowElement>) => { if (!isInteractiveTarget(event.target)) openAssignment(assignment.id); }} onKeyDown={(event) => handleRowKeyDown(event, assignment.id)}><td dir="auto"><Link className="store-name-link" href={`/store-admins/${assignment.id}`} onClick={(event) => event.stopPropagation()}>{assignment.profile.full_name}</Link></td><td dir="ltr">{assignment.profile.email}</td><td dir="auto">{assignment.store.name || assignment.store.slug}</td><td>{assignment.profile.role}</td><td><button className={`store-status store-status-control ${assignment.assignment_is_active ? "active" : "inactive"}`} type="button" disabled={updatingId === assignment.id} aria-label={assignment.assignment_is_active ? t("deactivateAssignment") : t("activateAssignment")} onClick={(event) => { event.stopPropagation(); void toggleAssignment(assignment.id, assignment.assignment_is_active); }} onKeyDown={(event) => event.stopPropagation()}>{updatingId === assignment.id ? <span className="spinner dark" aria-label={t("updatingStatus")} /> : assignment.assignment_is_active ? t("active") : t("inactive")}</button></td><td><span className={`store-status ${assignment.profile_is_active ? "active" : "inactive"}`}>{assignment.profile_is_active ? t("active") : t("inactive")}</span></td><td><span className={`store-status ${assignment.effective_is_active ? "active" : "inactive"}`}>{assignment.effective_is_active ? t("active") : t("inactive")}</span></td><td className="table-action-cell"><div className="table-actions"><Link className="table-view-action" href={`/store-admins/${assignment.id}`} aria-label={t("view")} onClick={(event) => event.stopPropagation()}><Eye size={18} aria-hidden="true" /></Link><Link className="table-view-action" href={`/store-admins/${assignment.id}/edit`} aria-label={t("edit")} onClick={(event) => event.stopPropagation()}><Pencil size={18} aria-hidden="true" /></Link></div></td></tr>)}</tbody></table></div>
    {data && data.pagination.total_pages > 1 ? <div className="table-pagination" aria-label={t("pagination")}><button className="secondary-button" type="button" disabled={!data.pagination.has_prev || isFetching} onClick={() => updateQuery({page: String(Math.max(1, data.pagination.page - 1))})}>{t("previous")}</button><span>{t("page", {page: data.pagination.page, total: data.pagination.total_pages})}</span><button className="secondary-button" type="button" disabled={!data.pagination.has_next || isFetching} onClick={() => updateQuery({page: String(data.pagination.page + 1)})}>{t("next")}</button></div> : null}
  </section>;
}

function StateError({t, common, status, retry, login}: {t: ReturnType<typeof useTranslations>; common: ReturnType<typeof useTranslations>; status?: number; retry: () => void; login: () => void}) { return <div className="table-state" role="alert"><span className="state-icon">!</span><strong>{t("loadError")}</strong><p>{status === 401 ? t("sessionExpired") : status === 403 ? common("forbidden") : common("unexpectedError")}</p>{status === 401 ? <button className="secondary-button" type="button" onClick={login}>{common("login")}</button> : status !== 403 ? <button className="secondary-button" type="button" onClick={retry}>{common("retry")}</button> : null}</div>; }
function LoadingRows({label}: {label: string}) { return <>{[0,1,2,3,4].map((row) => <tr key={row} aria-label={label}>{Array.from({length: TABLE_COLUMN_COUNT}, (_, cell) => <td key={cell}><span className="skeleton table-line" /></td>)}</tr>)}</>; }
