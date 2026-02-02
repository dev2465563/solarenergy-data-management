import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionsCell } from "./ActionsCell.js";
import type { Row } from "@tanstack/react-table";
import type { SerializedRecord } from "../../api/types.js";

function createMockRow(id: string): Row<SerializedRecord> {
  return {
    original: {
      id,
      timestamp: "2024-01-01T00:00:00Z",
      outputs: { INV1: 10 },
    },
  } as unknown as Row<SerializedRecord>;
}

describe("ActionsCell", () => {
  it("renders delete button and shows confirmation modal on click", () => {
    const onDelete = vi.fn();
    const row = createMockRow("rec-1");

    render(
      <ActionsCell row={row} onDelete={onDelete} isDeleting={false} />
    );

    const deleteBtn = screen.getByRole("button", { name: /delete record/i });
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete record?")).toBeInTheDocument();
  });

  it("calls onDelete when confirming in modal", () => {
    const onDelete = vi.fn();
    const row = createMockRow("rec-1");

    render(
      <ActionsCell row={row} onDelete={onDelete} isDeleting={false} />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete record/i }));
    const confirmBtn = screen.getByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    expect(onDelete).toHaveBeenCalledWith("rec-1");
  });
});
