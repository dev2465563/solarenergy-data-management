import { useState, useCallback, useEffect } from "react";
import type { GetRecordsParams } from "../api/types.js";
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js";

function searchToParams(search: string): GetRecordsParams {
  const sp = new URLSearchParams(search);
  const page = sp.get("page");
  const pageSize = sp.get("pageSize");
  const includeDeleted = sp.get("includeDeleted");

  return {
    start: sp.get("start") ?? undefined,
    end: sp.get("end") ?? undefined,
    device: sp.get("device") ?? undefined,
    includeDeleted: includeDeleted === "true",
    page: page != null && page !== "" ? Math.max(0, Number(page) | 0) : 0,
    pageSize:
      pageSize != null && pageSize !== ""
        ? Math.min(1000, Math.max(1, Number(pageSize) | 0))
        : DEFAULT_PAGE_SIZE,
  };
}

/** Only non-default values (keeps URL minimal). */
function paramsToSearch(params: GetRecordsParams): string {
  const sp = new URLSearchParams();
  if (params.start != null && params.start !== "") sp.set("start", params.start);
  if (params.end != null && params.end !== "") sp.set("end", params.end);
  if (params.device != null && params.device !== "") sp.set("device", params.device);
  if (params.includeDeleted === true) sp.set("includeDeleted", "true");
  const page = params.page ?? 0;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  if (page > 0) sp.set("page", String(page));
  if (pageSize !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** URL as single source of truth; shareable links, back/forward. */
export function useRecordSearchParams(): [
  GetRecordsParams,
  (value: GetRecordsParams | ((prev: GetRecordsParams) => GetRecordsParams)) => void,
] {
  const getInitial = useCallback(() => {
    if (typeof window === "undefined") {
      return { page: 0, pageSize: DEFAULT_PAGE_SIZE };
    }
    return searchToParams(window.location.search);
  }, []);

  const [params, setParamsState] = useState<GetRecordsParams>(getInitial);

  const setParams = useCallback(
    (value: GetRecordsParams | ((prev: GetRecordsParams) => GetRecordsParams)) => {
      setParamsState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        const search = paramsToSearch(next);
        const url = `${window.location.pathname}${search}${window.location.hash}`;
        window.history.replaceState(null, "", url);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const handlePopState = () => {
      setParamsState(searchToParams(window.location.search));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return [params, setParams];
}
