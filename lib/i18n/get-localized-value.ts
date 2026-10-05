import type {SupportedLocale} from "@/i18n/routing";
import type {LocalizedText} from "@/types/store";

interface GetLocalizedValueOptions {
  localized?: LocalizedText | null;
  locale: SupportedLocale;
  fallback?: string | null;
}

function asNonEmptyString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function getLocalizedValue({
  localized,
  locale,
  fallback,
}: GetLocalizedValueOptions): string {
  const alternateLocale: SupportedLocale = locale === "ar" ? "en" : "ar";

  return (
    asNonEmptyString(localized?.[locale]) ??
    asNonEmptyString(fallback) ??
    asNonEmptyString(localized?.[alternateLocale]) ??
    ""
  );
}
