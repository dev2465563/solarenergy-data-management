import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { GetRecordsResponse } from "../api/types.js";
import { updateRecord, deleteRecord } from "../api/records.js";
import type { UpdateRecordBody } from "../api/types.js";

const RECORDS_QUERY_KEY: QueryKey = ["records"];

type RecordsQueryData = GetRecordsResponse;

function getRecordsQueryKeys(
  queryClient: ReturnType<typeof useQueryClient>
): QueryKey[] {
  return queryClient.getQueriesData({ queryKey: RECORDS_QUERY_KEY }).map(([key]) => key as QueryKey);
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      etag,
      body,
    }: {
      id: string;
      etag: string;
      body: UpdateRecordBody;
    }) => updateRecord(id, etag, body),
    onMutate: async ({ id, body }) => {
      const keys = getRecordsQueryKeys(queryClient);
      await Promise.all(keys.map((key) => queryClient.cancelQueries({ queryKey: key })));

      const previous: Array<{ queryKey: QueryKey; data: unknown }> = [];
      for (const key of keys) {
        const data = queryClient.getQueryData(key);
        previous.push({ queryKey: key, data });
        if (data && typeof data === "object" && "records" in data) {
          const list = data as RecordsQueryData;
          const records = list.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  outputs: { ...r.outputs, ...body.outputs },
                  ...(body.correctionReason != null && { correctionReason: body.correctionReason }),
                }
              : r
          );
          queryClient.setQueryData(key, { ...list, records });
        }
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(({ queryKey, data }) =>
          queryClient.setQueryData(queryKey, data)
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RECORDS_QUERY_KEY });
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecord(id),
    onMutate: async (id) => {
      const keys = getRecordsQueryKeys(queryClient);
      await Promise.all(keys.map((key) => queryClient.cancelQueries({ queryKey: key })));

      const previous: Array<{ queryKey: QueryKey; data: unknown }> = [];
      for (const key of keys) {
        const data = queryClient.getQueryData(key);
        previous.push({ queryKey: key, data });
        if (data && typeof data === "object" && "records" in data) {
          const list = data as RecordsQueryData;
          const records = list.records.filter((r) => r.id !== id);
          const recordCount = list.recordCount - (list.records.length - records.length);
          const newTotal = records.reduce(
            (sum, r) =>
              sum +
              Object.values(r.outputs ?? {}).reduce(
                (s: number, v) => s + (typeof v === "number" && v >= 0 ? v : 0),
                0
              ),
            0
          );
          queryClient.setQueryData(key, {
            ...list,
            records,
            recordCount,
            totalEnergy: newTotal,
          });
        }
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(({ queryKey, data }) =>
          queryClient.setQueryData(queryKey, data)
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RECORDS_QUERY_KEY });
    },
  });
}
