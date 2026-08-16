"use client";

import { useMemo, useState } from "react";
import {
  MagnifyingGlass,
  SortAscending,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 12;
const DEFAULT_SORT = "name-asc";

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "rating-high", label: "Highest Rated" },
  { value: "rating-low", label: "Lowest Rated" },
  { value: "reviews", label: "Most Reviews" },
];

interface UseSearchSortPaginateOptions<TItem> {
  searchFn: (item: TItem, query: string) => boolean;
  sortFn: (a: TItem, b: TItem, sort: string) => number;
}

export function useSearchSortPaginate<TItem>(
  items: TItem[],
  { searchFn, sortFn }: UseSearchSortPaginateOptions<TItem>
) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [pagination, setPagination] = useState({
    key: `|${DEFAULT_SORT}`,
    count: PAGE_SIZE,
  });

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = query ? items.filter((item) => searchFn(item, query)) : items;
    return [...filtered].sort((a, b) => sortFn(a, b, sort));
  }, [items, search, searchFn, sort, sortFn]);

  const filterKey = `${search}|${sort}`;
  const displayCount =
    pagination.key === filterKey ? pagination.count : PAGE_SIZE;
  const displayedItems = filteredItems.slice(0, displayCount);
  const remainingCount = Math.max(filteredItems.length - displayCount, 0);

  return {
    search,
    sort,
    filteredItems,
    displayedItems,
    displayCount,
    remainingCount,
    hasMore: filteredItems.length > displayCount,
    setSearch,
    setSort,
    showMore: () => {
      setPagination({
        key: filterKey,
        count: displayCount + PAGE_SIZE,
      });
    },
  };
}

interface DirectorySearchSortToolbarProps {
  search: string;
  sort: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export function DirectorySearchSortToolbar({
  search,
  sort,
  searchPlaceholder,
  onSearchChange,
  onSortChange,
}: DirectorySearchSortToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 pl-9"
        />
      </div>
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="h-9 w-full sm:w-[180px]">
          <SortAscending className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface DirectoryShowMoreButtonProps {
  label: string;
  remainingCount: number;
  onClick: () => void;
}

export function DirectoryShowMoreButton({
  label,
  remainingCount,
  onClick,
}: DirectoryShowMoreButtonProps) {
  return (
    <Button variant="outline" className="mt-4 w-full" onClick={onClick}>
      Show More {label} ({remainingCount} remaining)
    </Button>
  );
}
