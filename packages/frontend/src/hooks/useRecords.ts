import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRecords } from "../api/records.js";
import type { GetRecordsParams, GetRecordsResponse } from "../api/types.js";
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js";
import { useDebounce } from "./useDebounce.js";

const QUERY_KEY = ["records"] as const;

const DEFAULT_PARAMS: GetRecordsParams = {
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

export type UseRecordsOptions = {
  params?: GetRecordsParams;
  setParams?: (value: GetRecordsParams | ((prev: GetRecordsParams) => GetRecordsParams)) => void;
};

export function useRecords(options: UseRecordsOptions = {}) {
  const { params: controlledParams, setParams: controlledSetParams } = options;
  const [internalParams, setInternalParams] = useState<GetRecordsParams>({
    ...DEFAULT_PARAMS,
    ...controlledParams,
  });

  const params = controlledParams ?? internalParams;
  const setParams = controlledSetParams ?? setInternalParams;

  const debouncedParams = useDebounce(params, 350);

  const query = useQuery({
    queryKey: [...QUERY_KEY, debouncedParams],
    queryFn: () => getRecords(debouncedParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const data = query.data as GetRecordsResponse | undefined;
  const pageIndex = params.page ?? 0;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalCount = data?.recordCount ?? 0;
  const pageCount = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;

  return {
    ...query,
    data,
    params,
    setParams,
    pagination: {
      pageIndex,
      pageSize,
      pageCount,
      totalCount,
    },
    isFiltered:
      Object.keys(params).length > 0 &&
      Object.values(params).some(
        (v) => v !== undefined && v !== "" && v !== false
      ),
  };
}
