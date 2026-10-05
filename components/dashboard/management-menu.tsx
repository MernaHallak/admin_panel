"use client";

import {useEffect, useId, useRef, useState} from "react";
import {ChevronDown} from "lucide-react";
import {useTranslations} from "next-intl";
import {Link, usePathname} from "@/i18n/navigation";

const MANAGEMENT_ITEMS = [
  {href: "/store-admins", label: "storeAdmins"},
  {href: "/categories", label: "categories"},
  {href: "/subcategories", label: "subcategories"},
] as const;

export function ManagementMenu() {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const isActive = MANAGEMENT_ITEMS.some(({href}) => pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    firstItemRef.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="dashboard-management" ref={containerRef}>
      <button
        ref={triggerRef}
        className={`dashboard-navbar-link dashboard-management-trigger ${isActive ? "active" : ""}`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        {t("management")}
        <ChevronDown className={isOpen ? "open" : ""} size={16} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="dashboard-management-menu" id={menuId} role="menu" aria-label={t("management")}>
          {MANAGEMENT_ITEMS.map((item, index) => <Link key={item.href} ref={index === 0 ? firstItemRef : undefined} href={item.href} role="menuitem" className="dashboard-management-item" onClick={() => setIsOpen(false)}>{t(item.label)}</Link>)}
        </div>
      ) : null}
    </div>
  );
}
