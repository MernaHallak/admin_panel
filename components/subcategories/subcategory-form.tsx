"use client";

import {useEffect, useState, type FormEvent} from "react";
import {useTranslations} from "next-intl";

import {useCreateSubcategory, useUpdateSubcategory} from "@/hook/mutations/use-subcategory-mutations";
import {useSuperAdminSubcategory} from "@/hook/queries/use-super-admin-subcategories";
import {useCategories} from "@/hook/queries/use-product-taxonomy";
import {Link, useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";

interface SubcategoryFormProps { id?: string; }
type FieldErrors = Record<string, string>;

export function SubcategoryForm({id}: SubcategoryFormProps) {
  const t = useTranslations("Subcategories");
  const detailT = useTranslations("SubcategoryDetails");
  const common = useTranslations("Common");
  const router = useRouter();
  const {data: categories} = useCategories();
  const {data: detail, isPending: isLoadingDetail, isError: isDetailError, error: detailError, refetch} = useSuperAdminSubcategory(id ?? "", Boolean(id));
  const create = useCreateSubcategory();
  const update = useUpdateSubcategory();
  const mutation = id ? update : create;
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  useEffect(() => {
    if (!detail?.subcategory) return;
    const subcategory = detail.subcategory;
    setCategoryId(subcategory.category_id);
    setName(subcategory.name);
    setNameAr(subcategory.name_ar ?? "");
    setDescription(subcategory.description ?? "");
    setDescriptionAr(subcategory.description_ar ?? "");
    setActive(subcategory.is_active);
    setErrors({});
    setFormError(undefined);
  }, [detail]);

  function clearError(field: string) { setErrors((current) => { if (!current[field]) return current; const next = {...current}; delete next[field]; return next; }); }
  function focusFirstError(nextErrors: FieldErrors) { const field = Object.keys(nextErrors)[0]; if (!field) return; requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="${field}"]`)?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")?.focus()); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const nextErrors: FieldErrors = {};
    if (!categoryId) nextErrors.category_id = t("categoryRequired");
    if (!name.trim()) nextErrors.name = t("nameRequired");
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); focusFirstError(nextErrors); return; }

    const payload = {category_id: categoryId, name: name.trim(), name_ar: nameAr.trim() || null, description: description.trim() || null, description_ar: descriptionAr.trim() || null, is_active: active};
    try {
      if (id) await update.mutateAsync({id, payload}); else await create.mutateAsync(payload);
      router.replace(id ? `/subcategories/${id}` : "/subcategories");
    } catch (failure) {
      const normalized = normalizeApiError(failure);
      if (normalized.status === 401) { router.replace("/login"); return; }
      if (Object.keys(normalized.fieldErrors).length) { setErrors(normalized.fieldErrors); focusFirstError(normalized.fieldErrors); }
      else setFormError(normalized.status === 403 ? common("forbidden") : common(normalized.translationKey));
    }
  }

  if (id && isLoadingDetail) return <section className="store-form-panel"><div className="table-state">{common("loading")}</div></section>;
  if (id && (isDetailError || !detail)) { const normalized = normalizeApiError(detailError); return <section className="store-form-panel"><div className="table-state" role="alert"><strong>{detailT("loadError")}</strong><p>{normalized.status === 404 ? detailT("notFound") : common(normalized.translationKey)}</p><button className="secondary-button" type="button" onClick={() => refetch()}>{common("retry")}</button></div></section>; }

  return <section className="store-form-panel"><form className="store-form" noValidate onSubmit={submit}><div className="store-form-grid">
    <div className="field" data-field="category_id"><label htmlFor="subcategory-category">{t("category")}</label><select id="subcategory-category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); clearError("category_id"); }}><option value="">{t("selectCategory")}</option>{categories?.data.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.category_id ? <p className="field-error">{errors.category_id}</p> : null}</div>
    <Field id="subcategory-name" field="name" label={t("name")} value={name} error={errors.name} onChange={(value) => { setName(value); clearError("name"); }} />
    <Field id="subcategory-name-ar" field="name_ar" label={t("nameAr")} value={nameAr} error={errors.name_ar} dir="rtl" onChange={(value) => { setNameAr(value); clearError("name_ar"); }} />
    <TextArea id="subcategory-description" field="description" label={detailT("description")} value={description} error={errors.description} onChange={(value) => { setDescription(value); clearError("description"); }} />
    <TextArea id="subcategory-description-ar" field="description_ar" label={detailT("descriptionAr")} value={descriptionAr} error={errors.description_ar} dir="rtl" onChange={(value) => { setDescriptionAr(value); clearError("description_ar"); }} />
    <div className="field" data-field="is_active"><span>{t("status")}</span><label className="store-active-control"><input type="checkbox" checked={active} onChange={(event) => { setActive(event.target.checked); clearError("is_active"); }} />{active ? t("active") : t("inactive")}</label>{errors.is_active ? <p className="field-error">{errors.is_active}</p> : null}</div>
  </div>{formError ? <p className="error-message" role="alert">{formError}</p> : null}<div className="store-form-actions"><Link className="secondary-button" href={id ? `/subcategories/${id}` : "/subcategories"}>{t("cancel")}</Link><button className="primary-button" type="submit" disabled={mutation.isPending}>{mutation.isPending ? (id ? detailT("saving") : t("saving")) : (id ? detailT("save") : t("create"))}</button></div></form></section>;
}

function Field({id, field, label, value, error, onChange, dir}: {id: string; field: string; label: string; value: string; error?: string; onChange: (value: string) => void; dir?: "rtl"}) { return <div className="field" data-field={field}><label htmlFor={id}>{label}</label><input id={id} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} />{error ? <p className="field-error">{error}</p> : null}</div>; }
function TextArea({id, field, label, value, error, onChange, dir}: {id: string; field: string; label: string; value: string; error?: string; onChange: (value: string) => void; dir?: "rtl"}) { return <div className="field store-form-full" data-field={field}><label htmlFor={id}>{label}</label><textarea id={id} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} />{error ? <p className="field-error">{error}</p> : null}</div>; }
