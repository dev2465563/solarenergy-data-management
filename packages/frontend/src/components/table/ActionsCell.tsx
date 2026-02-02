import { useState } from "react";
import type { Row } from "@tanstack/react-table";
import type { SerializedRecord } from "../../api/types.js";
import { Modal } from "../ui/Modal.js";

interface ActionsCellProps {
  row: Row<SerializedRecord>;
  onDelete: (rowId: string) => void;
  isDeleting?: boolean;
}

export function ActionsCell({
  row,
  onDelete,
  isDeleting = false,
}: ActionsCellProps) {
  const id = row.original.id;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    onDelete(id);
    setConfirmOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
        aria-label="Delete record"
        disabled={isDeleting}
        title="Delete record"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete record?"
        description="This action cannot be undone."
      >
        <div className="flex flex-col gap-4 sm:flex-row-reverse sm:justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
}
