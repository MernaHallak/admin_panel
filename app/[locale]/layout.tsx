import "../globals.css";
import type {Metadata} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {routing} from "@/i18n/routing";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Metadata"});

  return {title: t("title"), description: t("description")};
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
