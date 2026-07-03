"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileText, KeyRound, Search, ShieldCheck, Store, UserCog, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchApi, type SearchResultItem } from "@/modules/search/api/search.api";
import { cn } from "@/lib/utils/cn";

const typeIcons = {
  owner: UserCog,
  store: Store,
  contract: FileText,
  employee: Users,
  license: KeyRound
};

const typeLabels = {
  owner: "Owner",
  store: "Store",
  contract: "Contract",
  employee: "Employee",
  license: "License"
};

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    searchApi
      .search(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data.results);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 pr-20 text-sm shadow-inner shadow-slate-200/30 transition focus:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none dark:focus:bg-slate-900"
        placeholder="Search owners, stores, contracts, licenses..."
      />
      <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-950 sm:flex">
        ⌘K
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          {loading ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-2">
              {results.map((item) => {
                const Icon = typeIcons[item.type];
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        router.push(item.href);
                      }}
                    >
                      <span className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.title}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800">
                            {typeLabels[item.type]}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800">
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            Global search across owners, stores, contracts, employees, licenses
          </div>
        </div>
      ) : null}
    </div>
  );
}
