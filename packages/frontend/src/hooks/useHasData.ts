import { useQuery } from "@tanstack/react-query";
import { getRecords } from "../api/records.js";

const HAS_DATA_QUERY_KEY = ["hasData"] as const;

export function useHasData() {
  return useQuery({
    queryKey: HAS_DATA_QUERY_KEY,
    queryFn: async () => {
      const data = await getRecords({ page: 0, pageSize: 1 });
      return (data?.records?.length ?? 0) > 0;
    },
    staleTime: 10_000,
  });
}
