import { useEffect } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Keeps the keyboard focus inside a dialog and restores it afterwards.
 *
 * Without this, Tab walks through the page behind the overlay and screen
 * readers announce content the user cannot see.
 */
export default function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;

    function isVisible(element) {
      if (element.hidden || element.getAttribute("aria-hidden") === "true") {
        return false;
      }
      if (element.closest("[hidden]")) return false;

      const style = window.getComputedStyle?.(element);
      if (style && (style.display === "none" || style.visibility === "hidden")) {
        return false;
      }
      return true;
    }

    function focusableElements() {
      return Array.from(container.querySelectorAll(FOCUSABLE)).filter(isVisible);
    }

    function handleKeyDown(event) {
      if (event.key !== "Tab") return;

      const elements = focusableElements();
      if (!elements.length) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, active]);
}
