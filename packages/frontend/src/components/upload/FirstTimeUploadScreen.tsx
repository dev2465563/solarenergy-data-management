import { UploadZone } from "./UploadZone.js";

export function FirstTimeUploadScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">
          Upload your first CSV
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Drag & drop or click to select. After upload you can filter, edit, and manage your data.
        </p>
        <UploadZone />
        <p className="mt-6 text-center text-xs text-gray-500">
          Data is stored locally and persists after refresh.
        </p>
      </div>
    </div>
  );
}
