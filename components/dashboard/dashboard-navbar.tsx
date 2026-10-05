"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {logout} from "@/api/auth";
import {LanguageSwitcher} from "@/components/language-switcher";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import {ManagementMenu} from "./management-menu";

export function DashboardNavbar() {
  const t = useTranslations("Dashboard");
  const common = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <nav className="dashboard-navbar">
      <a className="brand" href="#main-content">
        <span className="brand-mark" aria-hidden="true">S</span>
        <strong>{t("brand")}</strong>
      </a>

      <div className="dashboard-navbar-links">
        <Link
          href="/"
          className={`dashboard-navbar-link ${pathname === "/" ? "active" : ""}`}
        >
          {t("overview")}
        </Link>
        <Link
          href="/stores"
          className={`dashboard-navbar-link ${pathname.startsWith("/stores") ? "active" : ""}`}
        >
          {t("stores")}
        </Link>
        <Link
          href="/products"
          className={`dashboard-navbar-link ${pathname.startsWith("/products") ? "active" : ""}`}
        >
          {t("products")}
        </Link>
        <ManagementMenu />
      </div>

      <div className="header-actions">
        <LanguageSwitcher />
        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? common("loading") : common("logout")}
        </button>
      </div>
    </nav>
  );
}
