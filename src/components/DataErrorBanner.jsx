import React from "react";
import { useData } from "../contexts/DataContext";

export default function DataErrorBanner() {
  const { error, status, refreshing, refresh } = useData();

  if (!error || status === "loading") return null;

  return (
    <div className="data-error-banner" role="alert">
      <span className="data-error-text">⚠️ {error}</span>
      <button
        type="button"
        className="data-error-retry"
        onClick={() => refresh({ silent: false })}
        disabled={refreshing}
      >
        {refreshing ? "Tentando…" : "Tentar novamente"}
      </button>
    </div>
  );
}
