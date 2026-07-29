import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24h
    },
  },
});
const passistedQueryKeys = ["crypto-data"];
if (typeof window !== "undefined") {
  const localStoragePersister = createAsyncStoragePersister({
    storage: {
      getItem: async (key) => localStorage.getItem(key),
      setItem: async (key, value) => localStorage.setItem(key, value),
      removeItem: async (key) => localStorage.removeItem(key),
    },
  });

  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 10 * 60 * 1000,
    dehydrateOptions: {
      shouldDehydrateQuery: (query: Query) =>
        passistedQueryKeys.includes(query.queryKey[0] as string) &&
        query.state.status === "success",
    },
  });
}
