import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../components/ToastProvider";
import ConfirmDialog from "../components/ConfirmDialog";
import { initials } from "../components/PersonAvatar";

function ToastTrigger({ message, type }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast(message, type)}>
      trigger
    </button>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ToastProvider", () => {
  it("renders a toast with the given message", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Salvo com sucesso" type="success" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("trigger"));
    expect(screen.getByText("Salvo com sucesso")).toBeInTheDocument();
  });

  it("marks the toast with its type", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Falhou" type="error" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("trigger"));
    expect(screen.getByText("Falhou").closest(".toast")).toHaveClass(
      "toast-error",
    );
  });

  it("dismisses the toast when the close button is pressed", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="some" type="info" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("trigger"));
    fireEvent.click(screen.getByLabelText("Fechar aviso"));
    expect(screen.queryByText("some")).not.toBeInTheDocument();
  });

  it("throws when used outside of the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ToastTrigger message="x" />)).toThrow(
      /must be used within a ToastProvider/,
    );
    spy.mockRestore();
  });
});

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Excluir?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByText("Excluir?")).not.toBeInTheDocument();
  });

  it("renders the title and message when open", () => {
    render(
      <ConfirmDialog
        open
        title="Excluir registro?"
        message="Essa ação não pode ser desfeita."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Excluir registro?")).toBeInTheDocument();
    expect(
      screen.getByText("Essa ação não pode ser desfeita."),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is pressed", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir?"
        confirmLabel="Excluir"
        danger
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(screen.getByText("Excluir"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is pressed", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir?"
        cancelLabel="Cancelar"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("closes when the overlay is clicked but not the dialog", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("alertdialog"));
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("alertdialog").parentElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("applies the danger style to the confirm button", () => {
    render(
      <ConfirmDialog
        open
        title="Excluir?"
        confirmLabel="Excluir"
        danger
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("Excluir")).toHaveClass("danger");
  });

  it("keeps the keyboard focus inside the dialog", () => {
    render(
      <ConfirmDialog
        open
        title="Excluir?"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    const dialog = screen.getByRole("alertdialog");
    const confirm = screen.getByText("Excluir");
    const cancel = screen.getByText("Cancelar");

    expect(dialog).toContainElement(confirm);
    expect(dialog).toContainElement(cancel);

    confirm.focus();
    expect(document.activeElement).toBe(confirm);

    // Tab on the last focusable element wraps back to the first one.
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);

    // Shift+Tab on the first element wraps forward to the last one.
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });
});

describe("act warnings", () => {
  it("does not warn about state updates outside act", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ToastProvider>
        <ToastTrigger message="x" type="info" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByText("trigger"));
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("initials", () => {
  it("uses the first and last name initials", () => {
    expect(initials("Ana Maria")).toBe("AM");
    expect(initials("Ana Paula Souza")).toBe("AS");
  });

  it("falls back to a single letter or a placeholder", () => {
    expect(initials("João")).toBe("J");
    expect(initials("")).toBe("?");
    expect(initials(undefined)).toBe("?");
  });
});
