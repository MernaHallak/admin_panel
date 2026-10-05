"use client";

import {useTranslations} from "next-intl";

export default function ErrorPage({error}: {error: Error}) {
  const t = useTranslations("SessionError");

  console.error(error);

  return (
    <main className="error-page">
      <section className="error-card">
        <div className="error-icon" aria-hidden="true">!</div>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>
          {t("retry")}
        </button>
      </section>
    </main>
  );
}
