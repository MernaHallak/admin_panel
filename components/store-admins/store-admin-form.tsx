"use client";

import {useEffect, useState, type FormEvent, type ReactNode} from "react";
import {useTranslations} from "next-intl";

import {useCreateStoreAdmin, useUpdateStoreAdmin} from "@/hook/mutations/use-store-admin-mutations";
import {useStoreAdmin} from "@/hook/queries/use-store-admins";
import {useStores} from "@/hook/queries/use-stores";
import {useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";

export function StoreAdminForm({id}: {id?: string}) {
  const t = useTranslations("StoreAdmins");
  const common = useTranslations("Common");
  const router = useRouter();
  const editing = Boolean(id);
  const {data: detail, isPending: loadingDetail, isError: detailError, error: detailFailure, refetch} = useStoreAdmin(id ?? "", editing);
  const {data: storesData} = useStores({status: "active", sort: "name_asc", limit: 100});
  const createMutation = useCreateStoreAdmin();
  const updateMutation = useUpdateStoreAdmin();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeId, setStoreId] = useState("");
  const [profileActive, setProfileActive] = useState(true);
  const [assignmentActive, setAssignmentActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const assignment = detail?.assignment;
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!assignment) return;
    setFullName(assignment.profile.full_name);
    setStoreId(assignment.store_id);
    setProfileActive(assignment.profile_is_active);
    setAssignmentActive(assignment.assignment_is_active);
  }, [assignment]);

  if (editing && loadingDetail) return <StoreAdminFormSkeleton label={t("loading")} />;

  if (editing && (detailError || !assignment)) {
    const normalized = normalizeApiError(detailFailure);
    return <section className="store-form-panel store-admin-form-panel"><div className="table-state" role="alert"><strong>{t("loadError")}</strong><p>{normalized.status === 401 ? t("sessionExpired") : common(normalized.translationKey)}</p><button className="secondary-button" type="button" onClick={() => refetch()}>{common("retry")}</button></div></section>;
  }

  function focusFirstError(nextErrors: Record<string, string>) {
    const field = ["full_name", "email", "password", "store_id"].find((name) => nextErrors[name]);
    if (!field) return;
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
      element?.scrollIntoView({behavior: "smooth", block: "center"});
      element?.querySelector<HTMLInputElement | HTMLSelectElement>("input, select")?.focus();
    });
  }

  function clearError(field: string) {
    setErrors((current) => {
      const next = {...current};
      delete next[field];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.full_name = t("required", {field: t("fullName")});
    if (!storeId) nextErrors.store_id = t("required", {field: t("store")});
    if (!editing && (!email.trim() || !email.includes("@"))) nextErrors.email = t("invalidEmail");
    if (!editing && (password.length < 12 || password.length > 128)) nextErrors.password = t("invalidPassword");
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    if (!editing) {
      try {
        const result = await createMutation.mutateAsync({full_name: fullName.trim(), email: email.trim(), password, store_id: storeId});
        router.replace(`/store-admins/${result.assignment.id}`);
      } catch (failure) {
        const normalized = normalizeApiError(failure);
        const fieldErrors = localizedFieldErrors(normalized, t);
        if (Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
          focusFirstError(fieldErrors);
        } else setFormError(common(normalized.translationKey));
      }
      return;
    }

    if (!assignment) return;
    const payload = {
      ...(fullName.trim() !== assignment.profile.full_name ? {full_name: fullName.trim()} : {}),
      ...(storeId !== assignment.store_id ? {store_id: storeId} : {}),
      ...(profileActive !== assignment.profile_is_active ? {profile_is_active: profileActive} : {}),
      ...(assignmentActive !== assignment.assignment_is_active ? {assignment_is_active: assignmentActive} : {}),
    };
    if (!Object.keys(payload).length) {
      setFormError(t("noChanges"));
      return;
    }
    try {
      await updateMutation.mutateAsync({id: id!, payload});
      router.replace(`/store-admins/${id}`);
    } catch (failure) {
      const normalized = normalizeApiError(failure);
      const fieldErrors = localizedFieldErrors(normalized, t);
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        focusFirstError(fieldErrors);
      } else setFormError(common(normalized.translationKey));
    }
  }

  const currentStoreMissing = editing && assignment && !storesData?.data.some((store) => store.id === assignment.store_id);

  return <section className="store-form-panel store-admin-form-panel">
    <form className="store-form store-admin-form" noValidate onSubmit={submit}>
      <div className="store-form-sections">
        <FormSection title={t("accountInformation")} className="store-admin-form-account">
          <div className="store-form-grid">
            <Field field="full_name" label={t("fullName")} value={fullName} error={errors.full_name} className={!editing ? "store-form-full" : undefined} onChange={(value) => { setFullName(value); clearError("full_name"); }} />
            {!editing ? <><Field field="email" label={t("email")} value={email} error={errors.email} type="email" direction="ltr" onChange={(value) => { setEmail(value); clearError("email"); }} /><div className="field" data-field="password"><label htmlFor="store-admin-password">{t("password")}</label><input id="store-admin-password" type="password" value={password} aria-invalid={Boolean(errors.password)} onChange={(event) => { setPassword(event.target.value); clearError("password"); }} autoComplete="new-password" /><p className="field-hint">{t("passwordHint")}</p>{errors.password ? <p className="field-error">{errors.password}</p> : null}</div></> : null}
          </div>
        </FormSection>
        <FormSection title={t("assignment")}>
          <div className="store-form-grid"><div className="field store-form-full" data-field="store_id"><label htmlFor="store-admin-store">{t("store")}</label><select id="store-admin-store" value={storeId} aria-invalid={Boolean(errors.store_id)} onChange={(event) => { setStoreId(event.target.value); clearError("store_id"); }}><option value="">{t("selectStore")}</option>{currentStoreMissing ? <option value={assignment.store_id}>{assignment.store.name || assignment.store.slug}</option> : null}{storesData?.data.map((store) => <option key={store.id} value={store.id}>{store.name_i18n?.en?.trim() || store.name || store.slug}</option>)}</select>{errors.store_id ? <p className="field-error">{errors.store_id}</p> : null}</div></div>
        </FormSection>
        {editing ? <FormSection title={t("statusOverview")} className="store-admin-form-status"><div className="store-admin-status-controls"><StatusToggle id="profile-active" label={t("profileActive")} checked={profileActive} onChange={setProfileActive} /><StatusToggle id="assignment-active" label={t("assignmentActive")} checked={assignmentActive} onChange={setAssignmentActive} /></div></FormSection> : null}
      </div>
      {formError ? <p className="error-message" role="alert">{formError}</p> : null}
      <div className="store-form-actions"><button className="secondary-button" type="button" disabled={submitting} onClick={() => router.back()}>{t("cancel")}</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? editing ? t("saving") : t("creating") : editing ? t("save") : t("create")}</button></div>
    </form>
  </section>;
}

function FormSection({title, children, className = ""}: {title: string; children: ReactNode; className?: string}) {
  return <section className={`store-form-section ${className}`}><h2 className="form-section-title">{title}</h2>{children}</section>;
}

function Field({field, label, value, error, type = "text", direction, className, onChange}: {field: string; label: string; value: string; error?: string; type?: string; direction?: "ltr"; className?: string; onChange: (value: string) => void}) {
  const id = `store-admin-${field}`;
  return <div className={`field ${className ?? ""}`} data-field={field}><label htmlFor={id}>{label}</label><input id={id} dir={direction} type={type} value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />{error ? <p className="field-error">{error}</p> : null}</div>;
}

function StatusToggle({id, label, checked, onChange}: {id: string; label: string; checked: boolean; onChange: (checked: boolean) => void}) {
  return <label className="store-active-control" htmlFor={id}><input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}

function StoreAdminFormSkeleton({label}: {label: string}) {
  return <section className="store-form-panel store-admin-form-panel"><div className="store-form-skeleton" aria-label={label}>{[0, 1, 2].map((section) => <div className="store-form-skeleton-section" key={section}><span className="skeleton store-form-skeleton-title" /><span className="skeleton store-form-skeleton-input" /><span className="skeleton store-form-skeleton-input" /></div>)}<div className="store-form-actions"><span className="skeleton store-admin-skeleton-button" /><span className="skeleton store-admin-skeleton-button" /></div></div></section>;
}

function localizedFieldErrors(error: ReturnType<typeof normalizeApiError>, t: ReturnType<typeof useTranslations>) {
  const message = error.message?.toLowerCase() ?? "";
  if (error.code?.toUpperCase() === "ADMIN_ALREADY_ASSIGNED" || message.includes("admin_already_assigned")) return {store_id: t("alreadyAssigned")};
  if (["EMAIL_EXISTS", "EMAIL_ALREADY_EXISTS", "USER_ALREADY_EXISTS"].includes(error.code ?? "") || /email.*(already|exist|use)|already.*email/.test(message)) return {email: t("emailExists")};
  if (/store.*(invalid|not found|inactive)|invalid.*store/.test(message)) return {store_id: t("invalidStore")};
  if (/full.?name|name.*invalid/.test(message)) return {full_name: t("invalidFullName")};
  if (/password/.test(message)) return {password: t("invalidPassword")};
  const supportedFields = new Set(["full_name", "email", "password", "store_id", "profile_is_active", "assignment_is_active"]);
  return Object.fromEntries(Object.keys(error.fieldErrors).filter((field) => supportedFields.has(field)).map((field) => [field, field === "email" ? t("invalidEmail") : field === "password" ? t("invalidPassword") : t("invalidField")]));
}
