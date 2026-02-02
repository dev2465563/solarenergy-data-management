import { useState } from "react";
import { RecordsView } from "../RecordsView.js";
import { Modal } from "../ui/Modal.js";
import { UploadZone } from "../upload/UploadZone.js";

export function DashboardLayout() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const openUploadFlow = () => setConfirmOpen(true);
  const cancelConfirm = () => setConfirmOpen(false);
  const confirmAndOpenUpload = () => {
    setConfirmOpen(false);
    setUploadModalOpen(true);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
          Solar Energy Data
        </h1>
        <button
          type="button"
          onClick={openUploadFlow}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload new CSV
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <RecordsView />
      </main>

      {/* Confirmation: uploading replaces all data */}
      <Modal
        open={confirmOpen}
        onClose={cancelConfirm}
        title="Replace all data?"
        description="Uploading a new CSV will replace all existing records. This cannot be undone."
      >
        <div className="flex flex-col gap-4 sm:flex-row-reverse sm:justify-end">
          <button
            type="button"
            onClick={confirmAndOpenUpload}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            I understand, continue to upload
          </button>
          <button
            type="button"
            onClick={cancelConfirm}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload new CSV"
        description="Your new file will replace all current records."
      >
        <UploadZone onSuccess={() => setUploadModalOpen(false)} />
      </Modal>
    </div>
  );
}
