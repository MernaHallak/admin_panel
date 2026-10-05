"use client";

import {useRef, useState, type FormEvent} from "react";
import {useTranslations} from "next-intl";

import {useCreateStore} from "@/hook/mutations/use-create-store";
import {useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";
import {
  containsArabic,
  containsEnglish,
  validateTranslatedFields,
} from "@/lib/validation/store-validation";
import type {CreateStoreRequest} from "@/types/store";

type FieldErrors = Record<string, string>;

interface AdditionalLink {
  id: string;
  name: string;
  url: string;
}

const URL_FIELDS = [
  "logo_url",
  "cover_url",
  "whatsapp_url",
  "facebook_url",
  "instagram_url",
  "telegram_url",
] as const;

function optionalString(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function StoreCreateForm() {
  const t = useTranslations("Stores.create");
  const common = useTranslations("Common");
  const router = useRouter();
  const createStoreMutation = useCreateStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [location, setLocation] = useState("");
  const [locationAr, setLocationAr] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [additionalLinks, setAdditionalLinks] = useState<AdditionalLink[]>([]);
  const nextAdditionalLinkId = useRef(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = {...current};
      delete next[field];
      return next;
    });
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

  function getAdditionalLinkField(id: string, field: "name" | "url") {
    return `social_links.${id}.${field}`;
  }

  function updateAdditionalLink(
    id: string,
    field: "name" | "url",
    value: string,
  ) {
    setAdditionalLinks((current) =>
      current.map((link) => link.id === id ? {...link, [field]: value} : link),
    );
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const errors: FieldErrors = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = t("validation.nameRequired");
    } else if (trimmedName.length > 200) {
      errors.name = t("validation.nameTooLong");
    }

    const trimmedDescription = description.trim();
    const trimmedDescriptionAr = descriptionAr.trim();
    const trimmedLocation = location.trim();
    const trimmedLocationAr = locationAr.trim();

    if (trimmedDescription.length > 5000) errors.description = t("validation.descriptionTooLong");
    if (trimmedDescriptionAr.length > 5000) errors.description_ar = t("validation.descriptionTooLong");
    if (trimmedLocation.length > 250) errors.location = t("validation.locationTooLong");
    if (trimmedLocationAr.length > 250) errors.location_ar = t("validation.locationTooLong");
    if (phone.trim().length > 50) errors.phone = t("validation.phoneTooLong");

    if (trimmedDescription && containsArabic(trimmedDescription)) {
      errors.description = t("validation.englishOnly");
    }
    if (trimmedDescriptionAr && containsEnglish(trimmedDescriptionAr)) {
      errors.description_ar = t("validation.arabicOnly");
    }
    if (trimmedLocation && containsArabic(trimmedLocation)) {
      errors.location = t("validation.englishOnly");
    }
    if (trimmedLocationAr && containsEnglish(trimmedLocationAr)) {
      errors.location_ar = t("validation.arabicOnly");
    }

    Object.assign(
      errors,
      validateTranslatedFields(
        optionalString(description),
        optionalString(descriptionAr),
        "description",
        "description_ar",
        t("validation.translationEnRequired", {field: t("validation.fields.description")}),
        t("validation.translationArRequired", {field: t("validation.fields.description")}),
      ),
      validateTranslatedFields(
        optionalString(location),
        optionalString(locationAr),
        "location",
        "location_ar",
        t("validation.translationEnRequired", {field: t("validation.fields.location")}),
        t("validation.translationArRequired", {field: t("validation.fields.location")}),
      ),
    );

    const urls: Record<(typeof URL_FIELDS)[number], string> = {
      logo_url: logoUrl,
      cover_url: coverUrl,
      whatsapp_url: whatsAppUrl,
      facebook_url: facebookUrl,
      instagram_url: instagramUrl,
      telegram_url: telegramUrl,
    };

    for (const field of URL_FIELDS) {
      if (urls[field].trim() && !isHttpUrl(urls[field].trim())) {
        errors[field] = t("validation.invalidUrl");
      }
    }

    const additionalLinkEntries: Array<[string, string]> = [];
    const linkNames = new Set<string>();

    for (const link of additionalLinks) {
      const linkName = link.name.trim();
      const linkUrl = link.url.trim();
      const nameField = getAdditionalLinkField(link.id, "name");
      const urlField = getAdditionalLinkField(link.id, "url");

      if (!linkName && !linkUrl) continue;

      if (!linkName) errors[nameField] = t("validation.linkNameRequired");
      if (!linkUrl) errors[urlField] = t("validation.linkUrlRequired");
      if (linkUrl && !isHttpUrl(linkUrl)) errors[urlField] = t("validation.invalidUrl");

      if (linkName && linkNames.has(linkName)) {
        errors[nameField] = t("validation.duplicateLinkName");
      }

      if (linkName) linkNames.add(linkName);
      if (linkName && linkUrl && isHttpUrl(linkUrl)) {
        additionalLinkEntries.push([linkName, linkUrl]);
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstError(errors);
      return;
    }

    const store: CreateStoreRequest = {
      name: trimmedName,
      description: optionalString(description),
      description_ar: optionalString(descriptionAr),
      location: optionalString(location),
      location_ar: optionalString(locationAr),
      logo_url: optionalString(logoUrl),
      cover_url: optionalString(coverUrl),
      phone: optionalString(phone),
      whatsapp_url: optionalString(whatsAppUrl),
      facebook_url: optionalString(facebookUrl),
      instagram_url: optionalString(instagramUrl),
      telegram_url: optionalString(telegramUrl),
      social_links: additionalLinkEntries.length
        ? Object.fromEntries(additionalLinkEntries)
        : undefined,
    };

    try {
      await createStoreMutation.mutateAsync(store);
      router.replace("/stores");
    } catch (error) {
      const normalizedError = normalizeApiError(error);

      if (normalizedError.status === 401) {
        router.replace("/login");
        return;
      }

      setFieldErrors(normalizedError.fieldErrors);
      setFormError(normalizedError.message ?? common(normalizedError.translationKey));
    }
  }

  return (
    <section className="store-form-panel" aria-labelledby="store-create-form-title">
      <form className="store-form" noValidate onSubmit={handleSubmit}>
        <h2 className="sr-only" id="store-create-form-title">{t("title")}</h2>
        <div className="store-form-grid">
          <TextField id="name" field="name" label={t("name")} value={name} error={fieldErrors.name} onChange={(value) => { setName(value); clearFieldError("name"); }} required />
          <TextField id="phone" field="phone" label={t("phone")} value={phone} error={fieldErrors.phone} onChange={(value) => { setPhone(value); clearFieldError("phone"); }} />
          <TextAreaField id="description" field="description" label={t("descriptionField")} value={description} error={fieldErrors.description} onChange={(value) => { setDescription(value); clearFieldError("description"); }} />
          <TextAreaField id="description-ar" field="description_ar" label={t("descriptionAr")} value={descriptionAr} error={fieldErrors.description_ar} dir="rtl" onChange={(value) => { setDescriptionAr(value); clearFieldError("description_ar"); }} />
          <TextField id="location" field="location" label={t("location")} value={location} error={fieldErrors.location} onChange={(value) => { setLocation(value); clearFieldError("location"); }} />
          <TextField id="location-ar" field="location_ar" label={t("locationAr")} value={locationAr} error={fieldErrors.location_ar} dir="rtl" onChange={(value) => { setLocationAr(value); clearFieldError("location_ar"); }} />
          <TextField id="logo-url" field="logo_url" label={t("logoUrl")} value={logoUrl} error={fieldErrors.logo_url} type="url" onChange={(value) => { setLogoUrl(value); clearFieldError("logo_url"); }} />
          <TextField id="cover-url" field="cover_url" label={t("coverUrl")} value={coverUrl} error={fieldErrors.cover_url} type="url" onChange={(value) => { setCoverUrl(value); clearFieldError("cover_url"); }} />
          <TextField id="whatsapp-url" field="whatsapp_url" label={t("whatsappUrl")} value={whatsAppUrl} error={fieldErrors.whatsapp_url} type="url" onChange={(value) => { setWhatsAppUrl(value); clearFieldError("whatsapp_url"); }} />
          <TextField id="facebook-url" field="facebook_url" label={t("facebookUrl")} value={facebookUrl} error={fieldErrors.facebook_url} type="url" onChange={(value) => { setFacebookUrl(value); clearFieldError("facebook_url"); }} />
          <TextField id="instagram-url" field="instagram_url" label={t("instagramUrl")} value={instagramUrl} error={fieldErrors.instagram_url} type="url" onChange={(value) => { setInstagramUrl(value); clearFieldError("instagram_url"); }} />
          <TextField id="telegram-url" field="telegram_url" label={t("telegramUrl")} value={telegramUrl} error={fieldErrors.telegram_url} type="url" onChange={(value) => { setTelegramUrl(value); clearFieldError("telegram_url"); }} />
          <div className="field store-form-full" data-field="social_links">
            <label>{t("socialLinks")}</label>
            <p className="field-hint">{t("socialLinksHint")}</p>
            {additionalLinks.map((link, index) => (
              <div className="additional-link-row" key={link.id}>
                <div className="additional-link-control" data-field={getAdditionalLinkField(link.id, "name")}>
                  <label htmlFor={`${link.id}-name`}>{t("linkName")}</label>
                  <input
                    id={`${link.id}-name`}
                    type="text"
                    value={link.name}
                    onChange={(event) => updateAdditionalLink(link.id, "name", event.target.value)}
                  />
                  {fieldErrors[getAdditionalLinkField(link.id, "name")] && (
                    <p className="field-error">{fieldErrors[getAdditionalLinkField(link.id, "name")]}</p>
                  )}
                </div>
                <div className="additional-link-control" data-field={getAdditionalLinkField(link.id, "url")}>
                  <label htmlFor={`${link.id}-url`}>{t("linkUrl")}</label>
                  <input
                    id={`${link.id}-url`}
                    type="url"
                    value={link.url}
                    onChange={(event) => updateAdditionalLink(link.id, "url", event.target.value)}
                  />
                  {fieldErrors[getAdditionalLinkField(link.id, "url")] && (
                    <p className="field-error">{fieldErrors[getAdditionalLinkField(link.id, "url")]}</p>
                  )}
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => removeAdditionalLink(link.id)}
                  aria-label={t("removeAdditionalLink", {number: index + 1})}
                >
                  {t("remove")}
                </button>
              </div>
            ))}
            <button className="secondary-button additional-link-add" type="button" onClick={addAdditionalLink}>
              {t("addAdditionalLink")}
            </button>
            {fieldErrors.social_links && <p className="field-error">{fieldErrors.social_links}</p>}
          </div>
        </div>

        {formError && <p className="error-message" role="alert">{formError}</p>}

        <div className="store-form-actions">
          <button className="secondary-button" type="button" disabled={createStoreMutation.isPending} onClick={() => router.push("/stores")}>
            {t("cancel")}
          </button>
          <button className="primary-button" type="submit" disabled={createStoreMutation.isPending}>
            {createStoreMutation.isPending && <span className="spinner" aria-hidden="true" />}
            {createStoreMutation.isPending ? t("submitting") : t("submit")}
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
