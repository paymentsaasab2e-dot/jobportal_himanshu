"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CountryOption = {
  code: string;
  name: string;
};

type Props = {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  countries: CountryOption[];
  className?: string;
  placeholder?: string;
};

export function CountrySelectField({
  id,
  value,
  onChange,
  countries,
  className,
  placeholder = "— Select country —",
}: Props) {
  const listId = useId();
  const searchId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = useMemo(
    () => countries.find((c) => c.code === value)?.name ?? "",
    [countries, value],
  );

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query),
    );
  }, [countries, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15",
          !selectedLabel && "text-slate-400",
          className,
        )}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5">
          <div className="border-b border-slate-100 p-2">
            <label htmlFor={searchId} className="sr-only">
              Search countries
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50/80 pl-8 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/15"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredCountries.length === 1) {
                    e.preventDefault();
                    onChange(filteredCountries[0].code);
                    setOpen(false);
                  }
                }}
              />
            </div>
          </div>

          <ul id={listId} role="listbox" className="max-h-44 overflow-y-auto py-1">
            {filteredCountries.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No countries found.</li>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.code === value;
                return (
                  <li key={country.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(country.code);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-violet-50",
                        isSelected ? "bg-violet-50 font-medium text-violet-900" : "text-slate-800",
                      )}
                    >
                      {country.name}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
