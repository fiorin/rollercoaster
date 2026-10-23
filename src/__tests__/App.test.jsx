import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/supabaseClient", () => {
  const message = "Supabase não configurado.";
  function builder() {
    const chain = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      upsert: () => chain,
      delete: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => chain,
      single: () => chain,
      then: (onFulfilled, onRejected) =>
        Promise.resolve({ data: null, error: { message } }).then(
          onFulfilled,
          onRejected,
        ),
    };
    return chain;
  }
  return {
    supabase: { from: builder, auth: {} },
    isSupabaseConfigured: false,
    MISSING_CREDENTIALS_MESSAGE: message,
  };
});

const { default: App } = await import("../App");

function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App smoke test", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the shell without crashing", async () => {
    renderApp();
    expect(screen.getByText("Weight Tracker")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("surfaces the load error instead of showing a blank screen", async () => {
    renderApp();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Supabase não configurado/,
      ),
    );
  });

  it("renders the 404 page for unknown routes", async () => {
    renderApp("/does-not-exist");
    await waitFor(() =>
      expect(screen.getByText("Página não encontrada")).toBeInTheDocument(),
    );
  });
});
