import React, { useEffect, useRef } from "react";
import useFocusTrap from "../hooks/useFocusTrap";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal-content confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={danger ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
