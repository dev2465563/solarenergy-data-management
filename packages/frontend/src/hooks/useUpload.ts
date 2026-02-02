import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import { uploadRecords } from "../api/records.js";

const RECORDS_QUERY_KEY = ["records"] as const;
const HAS_DATA_QUERY_KEY = ["hasData"] as const;

export type UseUploadOptions = {
  onSuccess?: () => void;
};

export function useUpload(options: UseUploadOptions = {}) {
  const { onSuccess: onSuccessCallback } = options;
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setFileName(file.name);
      setProgress(0);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const result = await uploadRecords(file, {
        signal: controller.signal,
        onProgress: (loaded, total) => {
          if (total > 0) {
            setProgress(Math.round((loaded / total) * 100));
          }
        },
      });

      abortControllerRef.current = null;
      setProgress(100);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECORDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: HAS_DATA_QUERY_KEY });
      setTimeout(() => setFileName(null), 3000);
      onSuccessCallback?.();
    },
    onError: (err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") {
        setFileName(null);
      }
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  const reset = useCallback(() => {
    mutation.reset();
    setFileName(null);
    setProgress(0);
  }, [mutation]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    ...mutation,
    progress,
    fileName,
    isUploading: mutation.isPending,
    reset,
    abort,
  };
}
