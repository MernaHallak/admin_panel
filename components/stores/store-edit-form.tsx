"use client";

import {useEffect, useRef, useState, type FormEvent} from "react";
import {useTranslations} from "next-intl";

import {useUpdateStore} from "@/hook/mutations/use-update-store";
import {useStoreDetails} from "@/hook/queries/use-store-details";
import {Link, useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";
import {
  containsArabic,
  containsEnglish,
  validateTranslatedFields,
} from "@/lib/validation/store-validation";
import type {SuperAdminStore, UpdateStoreRequest} from "@/types/store";

type FieldErrors = Record<string, string>;

interface StoreEditFormProps {
  id: string;
}

interface AdditionalLink {
  id: string;
  name: string;
  url: string;
}

interface StoreEditValues {
  name: string;
  description: string;
  descriptionAr: string;
  location: string;
  locationAr: string;
  logoUrl: string;
  coverUrl: string;
  phone: string;
  whatsAppUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  telegramUrl: string;
  isActive: boolean;
}

const EMPTY_VALUES: StoreEditValues = {
  name: "",
  description: "",
  descriptionAr: "",
  location: "",
  locationAr: "",
  logoUrl: "",
  coverUrl: "",
  phone: "",
  whatsAppUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  telegramUrl: "",
  isActive: true,
};

const URL_FIELDS = [
  "logoUrl",
  "coverUrl",
  "whatsAppUrl",
  "facebookUrl",
  "instagramUrl",
  "telegramUrl",
] as const;

const FORM_FIELD_NAMES: Record<keyof StoreEditValues, string> = {
  name: "name",
  description: "description",
  descriptionAr: "description_ar",
  location: "location",
  locationAr: "location_ar",
  logoUrl: "logo_url",
  coverUrl: "cover_url",
  phone: "phone",
  whatsAppUrl: "whatsapp_url",
  facebookUrl: "facebook_url",
  instagramUrl: "instagram_url",
  telegramUrl: "telegram_url",
  isActive: "is_active",
};

function getNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function optionalString(value: string) {
  return getNonEmptyString(value);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getInitialValues(store: SuperAdminStore): StoreEditValues {
  return {
    name: store.name || "",
    description: store.description ?? "",
    descriptionAr: store.description_ar ?? "",
    location: store.location ?? "",
    locationAr: store.location_ar ?? "",
    logoUrl: store.logo_url ?? "",
    coverUrl: store.cover_url ?? "",
    phone: store.phone || "",
    whatsAppUrl: store.whatsapp_url || "",
    facebookUrl: store.facebook_url || "",
    instagramUrl: store.instagram_url || "",
    telegramUrl: store.telegram_url || "",
    isActive: store.is_active,
  };
}

function getInitialAdditionalLinks(store: SuperAdminStore): AdditionalLink[] {
  return Object.entries(store.social_links ?? {}).flatMap(([name, url], index) => {
    if (typeof url !== "string") return [];
    return [{id: `additional-link-${index + 1}`, name, url}];
  });
}

function additionalLinksFingerprint(links: AdditionalLink[]) {
  return JSON.stringify(
    links
      .map(({name, url}) => [name.trim(), url.trim()] as const)
      .filter(([name, url]) => name || url),
  );
}

export function StoreEditForm({id}: StoreEditFormProps) {
  const t = useTranslations("Stores.edit");
  const createT = useTranslations("Stores.create");
  const common = useTranslations("Common");
  const router = useRouter();
  const {data, isPending, isError, error, refetch, isFetching} = useStoreDetails(id);
  const updateStoreMutation = useUpdateStore();
  const initializedStoreId = useRef<string | undefined>(undefined);
  const nextAdditionalLinkId = useRef(0);
  const [values, setValues] = useState<StoreEditValues>(EMPTY_VALUES);
  const [initialValues, setInitialValues] = useState<StoreEditValues>();
  const [additionalLinks, setAdditionalLinks] = useState<AdditionalLink[]>([]);
  const [initialAdditionalLinks, setInitialAdditionalLinks] = useState<AdditionalLink[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const normalizedError = isError ? normalizeApiError(error) : undefined;

  useEffect(() => {
    if (!data || initializedStoreId.current === data.store.id) return;

    const nextValues = getInitialValues(data.store);
    const nextLinks = getInitialAdditionalLinks(data.store);
    initializedStoreId.current = data.store.id;
    nextAdditionalLinkId.current = nextLinks.length;
    setValues(nextValues);
    setInitialValues(nextValues);
    setAdditionalLinks(nextLinks);
    setInitialAdditionalLinks(nextLinks);
    setFieldErrors({});
    setFormError(undefined);
  }, [data]);

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = {...current};
      delete next[field];
      return next;
    });
  }

  function setValue<Field extends keyof StoreEditValues>(field: Field, value: StoreEditValues[Field]) {
    setValues((current) => ({...current, [field]: value}));
    clearFieldError(FORM_FIELD_NAMES[field]);
  }

  function getAdditionalLinkField(linkId: string, field: "name" | "url") {
    return `social_links.${linkId}.${field}`;
  }

  function updateAdditionalLink(id: string, field: "name" | "url", value: string) {
    setAdditionalLinks((current) => current.map((link) => link.id === id ? {...link, [field]: value} : link));
    clearFieldError("social_links");
    clearFieldError(getAdditionalLinkField(id, field));
  }

  function addAdditionalLink() {
    nextAdditionalLinkId.current += 1;
    setAdditionalLinks((current) => [
      ...current,
      {id: `additional-link-${nextAdditionalLinkId.current}`, name: "", url: ""},
    ]);
  }

  function removeAdditionalLink(id: string) {
    setAdditionalLinks((current) => current.filter((link) => link.id !== id));
    clearFieldError("social_links");
  }

  function focusFirstError(errors: FieldErrors) {
    const field = Object.keys(errors)[0];
    if (!field) return;

    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
      element?.scrollIntoView({behavior: "smooth", block: "center"});
      element?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")?.focus();
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!initialValues) return;

    setFormError(undefined);
    const errors: FieldErrors = {};
    const changed = <Field extends keyof StoreEditValues>(field: Field) =>
      values[field] !== initialValues[field];

    const trimmedName = values.name.trim();
    const trimmedDescription = values.description.trim();
    const trimmedDescriptionAr = values.descriptionAr.trim();
    const trimmedLocation = values.location.trim();
    const trimmedLocationAr = values.locationAr.trim();

    if (!trimmedName) {
      errors.name = createT("validation.nameRequired");
    } else if (trimmedName.length > 200) {
      errors.name = createT("validation.nameTooLong");
    } else if (containsArabic(trimmedName)) {
      errors.name = createT("validation.englishOnly");
    }

    if (changed("description") && trimmedDescription.length > 5000) errors.description = createT("validation.descriptionTooLong");
    if (changed("descriptionAr") && trimmedDescriptionAr.length > 5000) errors.description_ar = createT("validation.descriptionTooLong");
    if (changed("location") && trimmedLocation.length > 250) errors.location = createT("validation.locationTooLong");
    if (changed("locationAr") && trimmedLocationAr.length > 250) errors.location_ar = createT("validation.locationTooLong");
    if (changed("phone") && values.phone.trim().length > 50) errors.phone = createT("validation.phoneTooLong");

    if (changed("description") && trimmedDescription && containsArabic(trimmedDescription)) {
      errors.description = createT("validation.englishOnly");
    }
    if (changed("descriptionAr") && trimmedDescriptionAr && containsEnglish(trimmedDescriptionAr)) {
      errors.description_ar = createT("validation.arabicOnly");
    }
    if (changed("location") && trimmedLocation && containsArabic(trimmedLocation)) {
      errors.location = createT("validation.englishOnly");
    }
    if (changed("locationAr") && trimmedLocationAr && containsEnglish(trimmedLocationAr)) {
      errors.location_ar = createT("validation.arabicOnly");
    }

    if (changed("description") || changed("descriptionAr")) {
      Object.assign(
        errors,
        validateTranslatedFields(
          optionalString(values.description),
          optionalString(values.descriptionAr),
          "description",
          "description_ar",
          createT("validation.translationEnRequired", {field: createT("validation.fields.description")} ),
          createT("validation.translationArRequired", {field: createT("validation.fields.description")} ),
        ),
      );
    }

    if (changed("location") || changed("locationAr")) {
      Object.assign(
        errors,
        validateTranslatedFields(
          optionalString(values.location),
          optionalString(values.locationAr),
          "location",
          "location_ar",
          createT("validation.translationEnRequired", {field: createT("validation.fields.location")} ),
          createT("validation.translationArRequired", {field: createT("validation.fields.location")} ),
        ),
      );
    }

    const urlValues: Record<(typeof URL_FIELDS)[number], string> = {
      logoUrl: values.logoUrl,
      coverUrl: values.coverUrl,
      whatsAppUrl: values.whatsAppUrl,
      facebookUrl: values.facebookUrl,
      instagramUrl: values.instagramUrl,
      telegramUrl: values.telegramUrl,
    };
    const apiFieldNames: Record<(typeof URL_FIELDS)[number], string> = {
      logoUrl: "logo_url",
      coverUrl: "cover_url",
      whatsAppUrl: "whatsapp_url",
      facebookUrl: "facebook_url",
      instagramUrl: "instagram_url",
      telegramUrl: "telegram_url",
    };

    for (const field of URL_FIELDS) {
      if (changed(field) && urlValues[field].trim() && !isHttpUrl(urlValues[field].trim())) {
        errors[apiFieldNames[field]] = createT("validation.invalidUrl");
      }
    }

    const additionalLinksChanged = additionalLinksFingerprint(additionalLinks) !== additionalLinksFingerprint(initialAdditionalLinks);
    const additionalLinkEntries: Array<[string, string]> = [];
    const linkNames = new Set<string>();

    if (additionalLinksChanged) {
      for (const link of additionalLinks) {
        const linkName = link.name.trim();
        const linkUrl = link.url.trim();
        const nameField = getAdditionalLinkField(link.id, "name");
        const urlField = getAdditionalLinkField(link.id, "url");

        if (!linkName && !linkUrl) continue;
        if (!linkName) errors[nameField] = createT("validation.linkNameRequired");
        if (!linkUrl) errors[urlField] = createT("validation.linkUrlRequired");
        if (linkUrl && !isHttpUrl(linkUrl)) errors[urlField] = createT("validation.invalidUrl");
        if (linkName && linkNames.has(linkName)) errors[nameField] = createT("validation.duplicateLinkName");

        if (linkName) linkNames.add(linkName);
        if (linkName && linkUrl && isHttpUrl(linkUrl)) additionalLinkEntries.push([linkName, linkUrl]);
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstError(errors);
      return;
    }

    const updates: UpdateStoreRequest = {};
    if (trimmedName !== initialValues.name.trim()) updates.name = trimmedName;

    const updateNullableField = (
      field: Exclude<keyof UpdateStoreRequest, "name" | "name_ar" | "slug" | "social_links" | "is_active">,
      value: string,
      initialValue: string,
    ) => {
      const nextValue = optionalString(value);
      if (nextValue !== optionalString(initialValue)) updates[field] = nextValue || null;
    };

    updateNullableField("description", values.description, initialValues.description);
    updateNullableField("description_ar", values.descriptionAr, initialValues.descriptionAr);
    updateNullableField("location", values.location, initialValues.location);
    updateNullableField("location_ar", values.locationAr, initialValues.locationAr);
    updateNullableField("logo_url", values.logoUrl, initialValues.logoUrl);
    updateNullableField("cover_url", values.coverUrl, initialValues.coverUrl);
    updateNullableField("phone", values.phone, initialValues.phone);
    updateNullableField("whatsapp_url", values.whatsAppUrl, initialValues.whatsAppUrl);
    updateNullableField("facebook_url", values.facebookUrl, initialValues.facebookUrl);
    updateNullableField("instagram_url", values.instagramUrl, initialValues.instagramUrl);
    updateNullableField("telegram_url", values.telegramUrl, initialValues.telegramUrl);

    if (values.isActive !== initialValues.isActive) updates.is_active = values.isActive;
    if (additionalLinksChanged) updates.social_links = Object.fromEntries(additionalLinkEntries);
    if (!Object.keys(updates).length) {
      setFormError(t("noChanges"));
      return;
    }

    try {
      await updateStoreMutation.mutateAsync({id, store: updates});
      router.replace(`/stores/${id}`);
    } catch (mutationError) {
      const normalized = normalizeApiError(mutationError);
      if (normalized.status === 401) {
        router.replace("/login");
        return;
      }

      setFieldErrors(normalized.fieldErrors);
      setFormError(
        normalized.status === 403
          ? common("forbidden")
          : normalized.status === 404
            ? t("notFound")
            : normalized.message ?? common(normalized.translationKey),
      );
    }
  }

  if (isError || (!isPending && !data)) {
    const status = normalizedError?.status;
    const message = status === 401
      ? t("sessionExpired")
      : status === 403
        ? common("forbidden")
        : status === 404
          ? t("notFound")
          : common(normalizedError?.translationKey ?? "unexpectedError");

    return (
      <section className="store-form-panel">
        <div className="table-state" role="alert">
          <span className="state-icon" aria-hidden="true">!</span>
          <strong>{status === 404 ? t("notFoundTitle") : t("loadError")}</strong>
          <p>{message}</p>
          {status === 401 ? (
            <button className="secondary-button" type="button" onClick={() => router.replace("/login")}>
              {common("login")}
            </button>
          ) : status === 404 ? (
            <Link className="secondary-button" href="/stores">
              {t("backToStore")}
            </Link>
          ) : status !== 403 ? (
            <button className="secondary-button" type="button" disabled={isFetching} onClick={() => refetch()}>
              {common("retry")}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (isPending || !initialValues) {
    return (
      <section className="store-form-panel" aria-busy="true">
        <div className="store-details-loading">
          <span className="skeleton store-details-line wide" />
          <span className="skeleton store-details-line" />
          <span className="skeleton store-details-line" />
        </div>
      </section>
    );
  }

  return (
    <section className="store-form-panel" aria-labelledby="store-edit-form-title">
      <form className="store-form" noValidate onSubmit={handleSubmit}>
        <h2 className="sr-only" id="store-edit-form-title">{t("title")}</h2>
        <div className="store-form-grid">
          <TextField id="name" field="name" label={createT("name")} value={values.name} error={fieldErrors.name} onChange={(value) => setValue("name", value)} required />
          <TextField id="phone" field="phone" label={createT("phone")} value={values.phone} error={fieldErrors.phone} onChange={(value) => setValue("phone", value)} />
          <TextAreaField id="description" field="description" label={createT("descriptionField")} value={values.description} error={fieldErrors.description} onChange={(value) => setValue("description", value)} />
          <TextAreaField id="description-ar" field="description_ar" label={createT("descriptionAr")} value={values.descriptionAr} error={fieldErrors.description_ar} dir="rtl" onChange={(value) => setValue("descriptionAr", value)} />
          <TextField id="location" field="location" label={createT("location")} value={values.location} error={fieldErrors.location} onChange={(value) => setValue("location", value)} />
          <TextField id="location-ar" field="location_ar" label={createT("locationAr")} value={values.locationAr} error={fieldErrors.location_ar} dir="rtl" onChange={(value) => setValue("locationAr", value)} />
          <TextField id="logo-url" field="logo_url" label={createT("logoUrl")} value={values.logoUrl} error={fieldErrors.logo_url} type="url" onChange={(value) => setValue("logoUrl", value)} />
          <TextField id="cover-url" field="cover_url" label={createT("coverUrl")} value={values.coverUrl} error={fieldErrors.cover_url} type="url" onChange={(value) => setValue("coverUrl", value)} />
          <TextField id="whatsapp-url" field="whatsapp_url" label={createT("whatsappUrl")} value={values.whatsAppUrl} error={fieldErrors.whatsapp_url} type="url" onChange={(value) => setValue("whatsAppUrl", value)} />
          <TextField id="facebook-url" field="facebook_url" label={createT("facebookUrl")} value={values.facebookUrl} error={fieldErrors.facebook_url} type="url" onChange={(value) => setValue("facebookUrl", value)} />
          <TextField id="instagram-url" field="instagram_url" label={createT("instagramUrl")} value={values.instagramUrl} error={fieldErrors.instagram_url} type="url" onChange={(value) => setValue("instagramUrl", value)} />
          <TextField id="telegram-url" field="telegram_url" label={createT("telegramUrl")} value={values.telegramUrl} error={fieldErrors.telegram_url} type="url" onChange={(value) => setValue("telegramUrl", value)} />
          <div className="field store-form-full" data-field="is_active">
            <span>{t("status")}</span>
            <label className="store-active-control">
              <input type="checkbox" checked={values.isActive} onChange={(event) => setValue("isActive", event.target.checked)} />
              {values.isActive ? t("active") : t("inactive")}
            </label>
          </div>
          <div className="field store-form-full" data-field="social_links">
            <label>{createT("socialLinks")}</label>
            <p className="field-hint">{createT("socialLinksHint")}</p>
            {additionalLinks.map((link, index) => (
              <div className="additional-link-row" key={link.id}>
                <div className="additional-link-control" data-field={getAdditionalLinkField(link.id, "name")}>
                  <label htmlFor={`${link.id}-name`}>{createT("linkName")}</label>
                  <input id={`${link.id}-name`} type="text" value={link.name} onChange={(event) => updateAdditionalLink(link.id, "name", event.target.value)} />
                  {fieldErrors[getAdditionalLinkField(link.id, "name")] && <p className="field-error">{fieldErrors[getAdditionalLinkField(link.id, "name")]}</p>}
                </div>
                <div className="additional-link-control" data-field={getAdditionalLinkField(link.id, "url")}>
                  <label htmlFor={`${link.id}-url`}>{createT("linkUrl")}</label>
                  <input id={`${link.id}-url`} type="url" value={link.url} onChange={(event) => updateAdditionalLink(link.id, "url", event.target.value)} />
                  {fieldErrors[getAdditionalLinkField(link.id, "url")] && <p className="field-error">{fieldErrors[getAdditionalLinkField(link.id, "url")]}</p>}
                </div>
                <button className="secondary-button" type="button" onClick={() => removeAdditionalLink(link.id)} aria-label={createT("removeAdditionalLink", {number: index + 1})}>
                  {createT("remove")}
                </button>
              </div>
            ))}
            <button className="secondary-button additional-link-add" type="button" onClick={addAdditionalLink}>
              {createT("addAdditionalLink")}
            </button>
            {fieldErrors.social_links && <p className="field-error">{fieldErrors.social_links}</p>}
          </div>
        </div>

        {formError && <p className="error-message" role="alert">{formError}</p>}

        <div className="store-form-actions">
          <button className="secondary-button" type="button" disabled={updateStoreMutation.isPending} onClick={() => router.push(`/stores/${id}`)}>
            {createT("cancel")}
          </button>
          <button className="primary-button" type="submit" disabled={updateStoreMutation.isPending}>
            {updateStoreMutation.isPending && <span className="spinner" aria-hidden="true" />}
            {updateStoreMutation.isPending ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </section>
  );
}

interface TextFieldProps {
  id: string;
  field: string;
  label: string;
  value: string;
  error?: string;
  type?: "text" | "url";
  dir?: "rtl";
  required?: boolean;
  onChange: (value: string) => void;
}

function TextField({id, field, label, value, error, type = "text", dir, required, onChange}: TextFieldProps) {
  return (
    <div className="field" data-field={field}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} dir={dir} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

interface TextAreaFieldProps {
  id: string;
  field: string;
  label: string;
  value: string;
  error?: string;
  dir?: "rtl";
  onChange: (value: string) => void;
}

function TextAreaField({id, field, label, value, error, dir, onChange}: TextAreaFieldProps) {
  return (
    <div className="field store-form-full" data-field={field}>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={4} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

