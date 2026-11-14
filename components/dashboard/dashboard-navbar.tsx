"use client";

import {useState} from "react";
import {ChevronDown, Menu, X} from "lucide-react";
import {useTranslations} from "next-intl";

import {logout} from "@/api/auth";
import {LanguageSwitcher} from "@/components/language-switcher";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import {MANAGEMENT_ITEMS, ManagementMenu} from "./management-menu";

export function DashboardNavbar() {
  const t = useTranslations("Dashboard");
  const common = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileManagementOpen, setIsMobileManagementOpen] = useState(false);
  const isManagementActive = MANAGEMENT_ITEMS.some(({href}) => pathname === href || pathname.startsWith(`${href}/`));

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
        <Link
          href="/"
          className={`dashboard-navbar-link ${pathname === "/" ? "active" : ""}`}
        >
          {t("overview")}
        </Link>
      </div>

      <div className="dashboard-mobile-navigation">
        <button
          className="dashboard-mobile-navigation-trigger"
          type="button"
          aria-label={isMobileMenuOpen ? t("closeNavigation") : t("openNavigation")}
          aria-expanded={isMobileMenuOpen}
          aria-controls="dashboard-mobile-navigation-menu"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        {isMobileMenuOpen ? (
          <div className="dashboard-mobile-navigation-menu" id="dashboard-mobile-navigation-menu">
            <Link href="/stores" className={pathname.startsWith("/stores") ? "active" : ""} onClick={() => setIsMobileMenuOpen(false)}>{t("stores")}</Link>
            <Link href="/products" className={pathname.startsWith("/products") ? "active" : ""} onClick={() => setIsMobileMenuOpen(false)}>{t("products")}</Link>
            <button className={isManagementActive ? "active" : undefined} type="button" aria-expanded={isMobileManagementOpen} onClick={() => setIsMobileManagementOpen((current) => !current)}>
              {t("management")} <ChevronDown className={isMobileManagementOpen ? "open" : ""} size={16} aria-hidden="true" />
            </button>
            {isMobileManagementOpen ? (
              <div className="dashboard-mobile-management-menu">
                {MANAGEMENT_ITEMS.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""} onClick={() => setIsMobileMenuOpen(false)}>{t(item.label)}</Link>)}
              </div>
            ) : null}
            <Link href="/" className={pathname === "/" ? "active" : ""} onClick={() => setIsMobileMenuOpen(false)}>{t("overview")}</Link>
          </div>
        ) : null}
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
