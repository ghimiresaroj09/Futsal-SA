import { useCallback, useEffect, useState } from "react";
import type { AxiosRequestConfig } from "axios";
import { api } from "../lib/api";

export function useApi<T>(
  url: string,
  options?: AxiosRequestConfig,
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<T>(url, options);
      setData(response.data);
      return response.data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    if (enabled) void refetch();
  }, [enabled, refetch]);

  return { data, loading, error, refetch };
}
