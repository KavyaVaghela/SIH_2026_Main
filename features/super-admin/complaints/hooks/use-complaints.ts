"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { complaintsService } from "../services/complaints-service";
import type {
  ComplaintStats,
  ComplaintDetails,
  ComplaintFilterOptions,
  ComplaintStatus,
  ComplaintCategory,
} from "../types";

export function useComplaints() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial filter values from URL params
  const initialStatus = (searchParams?.get("status") as ComplaintStatus) || "ALL";
  const initialCategory = (searchParams?.get("category") as ComplaintCategory) || "ALL";
  const initialSociety = searchParams?.get("society") || "ALL";
  const initialSearch = searchParams?.get("q") || "";
  const initialPage = Number(searchParams?.get("page")) || 1;

  const [filters, setFilters] = React.useState<ComplaintFilterOptions>({
    status: initialStatus,
    category: initialCategory,
    society: initialSociety,
    searchQuery: initialSearch,
    page: initialPage,
    pageSize: 10,
  });

  const [stats, setStats] = React.useState<ComplaintStats | null>(null);
  const [complaints, setComplaints] = React.useState<ComplaintDetails[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [societies, setSocieties] = React.useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = React.useState<Array<{ id: ComplaintCategory; label: string }>>([]);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state back to URL
  const syncUrlParams = React.useCallback(
    (opts: ComplaintFilterOptions) => {
      const params = new URLSearchParams();
      if (opts.status !== "ALL") params.set("status", opts.status);
      if (opts.category !== "ALL") params.set("category", opts.category);
      if (opts.society !== "ALL") params.set("society", opts.society);
      if (opts.searchQuery) params.set("q", opts.searchQuery);
      if (opts.page > 1) params.set("page", String(opts.page));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await complaintsService.getComplaints(filters);
      setStats(res.stats);
      setComplaints(res.complaints);
      setTotalCount(res.totalCount);
      setSocieties(res.societies);
      setCategories(res.categories);
    } catch (err) {
      console.error("Failed to load complaints:", err);
      setError("An error occurred while loading complaints.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = (newFilters: Partial<ComplaintFilterOptions>) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
        page: newFilters.page !== undefined ? newFilters.page : 1,
      };
      syncUrlParams(updated);
      return updated;
    });
  };

  const resetFilters = () => {
    const defaultFilters: ComplaintFilterOptions = {
      status: "ALL",
      category: "ALL",
      society: "ALL",
      searchQuery: "",
      page: 1,
      pageSize: 10,
    };
    setFilters(defaultFilters);
    syncUrlParams(defaultFilters);
  };

  return {
    filters,
    stats,
    complaints,
    totalCount,
    societies,
    categories,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    refresh: fetchData,
  };
}
