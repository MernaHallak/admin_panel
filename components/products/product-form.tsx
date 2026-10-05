"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {toast} from "sonner";

import {useCreateProduct, useDeleteProductImage, useUpdateProduct} from "@/hook/mutations/use-product-mutations";
import {useProduct} from "@/hook/queries/use-product";
import {useCategories, useSubcategories} from "@/hook/queries/use-product-taxonomy";
import {useStores} from "@/hook/queries/use-stores";
import {useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";
import {getLocalizedValue} from "@/lib/i18n/get-localized-value";
import type {SupportedLocale} from "@/i18n/routing";

interface ProductFormProps {
  storeId?: string;
  productId?: string;
}

export function ProductForm({storeId: initialStoreId, productId}: ProductFormProps) {
  const t = useTranslations("Stores.details.productForm");
  const common = useTranslations("Common");
  const validation = useTranslations("Stores.create.validation");
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const isEditing = Boolean(productId);
  const {data, isPending: isLoading} = useProduct(productId ?? "", isEditing);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteImageMutation = useDeleteProductImage();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [category, setCategory] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [deletingPublicId, setDeletingPublicId] = useState<string>();
  const [error, setError] = useState<string>();
  const {data: categoriesData} = useCategories();
  const {data: storesData} = useStores({status: "all", sort: "name_asc", limit: 100});
  const selectedCategory = categoriesData?.data.find((item) => item.slug === category);
  const {data: subcategoriesData} = useSubcategories(selectedCategory?.id ?? "");
  const imagePreviews = useMemo(
    () => images.map((image) => ({image, url: URL.createObjectURL(image)})),
    [images],
  );

  useEffect(() => () => {
    imagePreviews.forEach(({url}) => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  useEffect(() => {
    const product = data?.product;
    if (!product) return;
    setName(product.name ?? "");
    setNameAr(product.name_ar ?? "");
    setCategory(product.category ?? "");
    setSubcategoryId(product.subcategory_slug ?? "");
    setPrice(String(product.price));
    setDescription(product.description ?? "");
    setDescriptionAr(product.description_ar ?? "");
    setIsActive(product.is_active);
  }, [data]);

  if (isEditing && isLoading) return <section className="store-form-panel"><div className="table-state">{common("loading")}</div></section>;
  const storeId = isEditing
    ? data?.product.store_id ?? data?.product.store?.id
    : initialStoreId ?? selectedStoreId;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function focusFirstError(errors: Record<string, string>) {
    const field = ["store_id", "name", "name_ar", "category", "subcategory_id", "price", "description", "description_ar", "images"].find((key) => errors[key]);
    if (!field) return;
    requestAnimationFrame(() => {
      const container = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
      container?.scrollIntoView({behavior: "smooth", block: "center"});
      container?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")?.focus();
    });
  }

  function setErrors(errors: Record<string, string>) { setFieldErrors(errors); focusFirstError(errors); }
  function clearError(field: string) { setFieldErrors((current) => { const next = {...current}; delete next[field]; return next; }); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined); setFieldErrors({});
    const numericPrice = Number(price);
    const errors: Record<string, string> = {};
    if (!storeId) errors.store_id = t("storeRequired");
    if (!name.trim()) errors.name = t("required", {field: t("name")});
    if (!nameAr.trim()) errors.name_ar = validation("translationArRequired", {field: t("name")});
    if (!category) errors.category = t("required", {field: t("category")});
    if (!price.trim()) errors.price = t("required", {field: t("price")});
    if (description && !descriptionAr) errors.description_ar = validation("translationArRequired", {field: t("description")});
    if (descriptionAr && !description) errors.description = validation("translationEnRequired", {field: t("description")});
    if (subcategoryId && !subcategoriesData?.data.some((item) => item.id === subcategoryId)) errors.subcategory_id = t("required", {field: t("subcategory")});
    if (Object.keys(errors).length) { setErrors(errors); return; }
    if (!storeId) return;
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setErrors({price: t("invalidPrice")});
      return;
    }
    const product = {
      name: name.trim(), name_ar: nameAr.trim(), category: category.trim(), subcategory_id: subcategoryId || null, price: numericPrice,
      description: description.trim() || null, description_ar: descriptionAr.trim() || null, is_active: isActive, images,
    };
    try {
      if (productId) {
        await updateMutation.mutateAsync({id: productId, product});
        router.replace(`/products/${productId}`);
      } else {
        const result = await createMutation.mutateAsync({store_id: storeId, ...product});
        router.replace(`/products/${result.product.id}`);
      }
    } catch (mutationError) {
      const normalized = normalizeApiError(mutationError);
      if (Object.keys(normalized.fieldErrors).length) setErrors(normalized.fieldErrors);
      else setError(common(normalized.translationKey));
    }
  }

  function addImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > 10) { setErrors({images: t("tooManyImages")}); return; }
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 5 * 1024 * 1024)) { setErrors({images: t("imageInvalid")}); return; }
    setImages((current) => [...current, ...selected]); clearError("images");
  }
  async function removeExistingImage(publicId: string) {
    if (!productId) return; setDeletingPublicId(publicId);
    try {
      await deleteImageMutation.mutateAsync({id: productId, publicId});
      toast.success(t("imageRemoved"));
    } catch (mutationError) {
      const normalized = normalizeApiError(mutationError);
      toast.error(common(normalized.translationKey));
    } finally { setDeletingPublicId(undefined); }
  }

  return (
    <section className="store-form-panel">
      <form className="store-form" noValidate onSubmit={submit}>
        <div className="store-form-grid">
          {!isEditing && !initialStoreId ? <div className="field" data-field="store_id"><label>{t("store")}</label><select value={selectedStoreId} onChange={(event) => {setSelectedStoreId(event.target.value); clearError("store_id");}}><option value="">{t("selectStore")}</option>{storesData?.data.map((store) => <option key={store.id} value={store.id}>{store.name_i18n?.en?.trim() || store.name || store.slug}</option>)}</select>{fieldErrors.store_id ? <p className="field-error">{fieldErrors.store_id}</p> : null}</div> : null}
          <Field field="name" error={fieldErrors.name} label={t("name")} value={name} onChange={(value) => {setName(value); clearError("name");}} />
          <Field field="name_ar" error={fieldErrors.name_ar} label={t("nameAr")} value={nameAr} onChange={(value) => {setNameAr(value); clearError("name_ar");}} dir="rtl" />
          <div className="field" data-field="category"><label>{t("category")}</label><select value={category} onChange={(event) => {setCategory(event.target.value); setSubcategoryId(""); clearError("category"); clearError("subcategory_id");}}><option value="">{t("selectCategory")}</option>{categoriesData?.data.map((item) => <option key={item.id} value={item.slug}>{getLocalizedValue({localized: item.name_i18n, locale, fallback: item.name})}</option>)}</select>{fieldErrors.category ? <p className="field-error">{fieldErrors.category}</p> : null}</div>
          <div className="field" data-field="subcategory_id"><label>{t("subcategory")}</label><select value={subcategoryId} disabled={!selectedCategory} onChange={(event) => {setSubcategoryId(event.target.value); clearError("subcategory_id");}}><option value="">{t("selectSubcategory")}</option>{subcategoriesData?.data.map((item) => <option key={item.id} value={item.id}>{getLocalizedValue({localized: item.name_i18n, locale, fallback: item.name})}</option>)}</select>{fieldErrors.subcategory_id ? <p className="field-error">{fieldErrors.subcategory_id}</p> : null}</div>
          <Field field="price" error={fieldErrors.price} label={t("price")} value={price} onChange={(value) => {setPrice(value); clearError("price");}} type="number" />
          <Field field="description" error={fieldErrors.description} className="store-form-full" label={t("description")} value={description} onChange={(value) => {setDescription(value); clearError("description");}} textarea />
          <Field field="description_ar" error={fieldErrors.description_ar} className="store-form-full" label={t("descriptionAr")} value={descriptionAr} onChange={(value) => {setDescriptionAr(value); clearError("description_ar");}} textarea dir="rtl" />
          {isEditing && data?.product.images?.length ? <div className="field store-form-full"><label>{t("currentImages")}</label><div className="product-image-previews">{data.product.images.map((image) => <div className="existing-product-image" key={image.public_id}><img src={image.secure_url ?? image.url} alt="" /><button type="button" className="image-remove-button" disabled={deletingPublicId === image.public_id} onClick={() => removeExistingImage(image.public_id)} aria-label={t("removeExistingImage")}>×</button>{deletingPublicId === image.public_id ? <small>{t("deletingImage")}</small> : null}</div>)}</div></div> : null}
          <div className="field store-form-full" data-field="images"><label>{isEditing ? t("newImages") : t("images")}</label><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(event) => addImages(event.target.files)} /><p className="field-hint">{t("imageHint")}</p>{fieldErrors.images ? <p className="field-error">{fieldErrors.images}</p> : null}{imagePreviews.length ? <div className="product-image-previews" aria-label={t("selectedImages")}>{imagePreviews.map(({image, url}, index) => <div className="product-image-preview" key={`${image.name}-${image.lastModified}-${index}`}><img src={url} alt={image.name} /><button className="image-remove-button" type="button" aria-label={t("removeImage", {name: image.name})} onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</div> : null}</div>
          <label className="store-active-control"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />{t("active")}</label>
        </div>
        {error ? <p className="error-message" role="alert">{error}</p> : null}
        <div className="store-form-actions">
          <button className="secondary-button" type="button" disabled={isSubmitting} onClick={() => router.back()}>{t("cancel")}</button>
          <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? (isEditing ? t("saving") : t("creating")) : (isEditing ? t("save") : t("create"))}</button>
        </div>
      </form>
    </section>
  );
}

function Field({field, error, label, value, onChange, type = "text", textarea, dir, className}: {field: string; error?: string; label: string; value: string; onChange: (value: string) => void; type?: string; textarea?: boolean; dir?: "rtl"; className?: string}) {
  return <div className={`field${className ? ` ${className}` : ""}`} data-field={field}><label>{label}</label>{textarea ? <textarea value={value} dir={dir} onChange={(event) => onChange(event.target.value)} /> : <input type={type} value={value} dir={dir} min={type === "number" ? "0.01" : undefined} step={type === "number" ? "0.01" : undefined} onChange={(event) => onChange(event.target.value)} />}{error ? <p className="field-error">{error}</p> : null}</div>;
}
