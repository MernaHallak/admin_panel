"use client";

import {useEffect, useId, useRef, useState} from "react";
import {MoreVertical} from "lucide-react";

export interface MobileRowAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface MobileRowActionsProps {
  actions: MobileRowAction[];
  label: string;
}

/** A compact, keyboard-accessible action menu for responsive list cards. */
export function MobileRowActions({actions, label}: MobileRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div
      className="mobile-row-actions"
      ref={containerRef}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        className="mobile-row-actions-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreVertical size={20} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="mobile-row-actions-menu" id={menuId} role="menu" aria-label={label}>
          {actions.map((action) => (
            <button
              className={action.destructive ? "danger" : undefined}
              key={action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                setIsOpen(false);
                action.onSelect();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
