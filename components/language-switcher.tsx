"use client";

import {useEffect} from "react";
import {useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {usePathname, useRouter} from "@/i18n/navigation";
import type {SupportedLocale} from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("Common");
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextLocale: SupportedLocale = locale === "ar" ? "en" : "ar";
  const search = searchParams.toString();
  const href = search ? `${pathname}?${search}` : pathname;

  useEffect(() => {
    router.prefetch(href, {locale: nextLocale});
  }, [href, nextLocale, router]);

  return (
    <button
      className="language-switcher"
      type="button"
      onClick={() => router.replace(href, {locale: nextLocale})}
      aria-label={`${t("language")}: ${t(nextLocale === "ar" ? "arabic" : "english")}`}
    >
      <span aria-hidden="true">文</span>
      {t(nextLocale === "ar" ? "arabic" : "english")}
    </button>
  );
}
