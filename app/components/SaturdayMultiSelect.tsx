"use client";

import { useEffect, useRef, useState } from "react";

export default function SaturdayMultiSelect({
  dates,
  label,
  onSelectionChange,
  locale,
}: {
  /** Display strings for each selectable Saturday, e.g. "Jun 20". */
  dates: string[];
  label: string;
  /** Called with the current selection whenever it changes. */
  onSelectionChange?: (selected: string[]) => void;
  locale: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = (d: string) =>
    setSelected((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));

  // Notify the parent after render whenever the selection changes.
  useEffect(() => {
    onSelectionChange?.(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const summary =
    selected.length === 0 ?
      label
    : locale === "fr" ?
      `${selected.length} sélectionné(s)`
    : `${selected.length} selected`;

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <p className="font-sans text-sm font-semibold uppercase tracking-widest text-foreground/70">
        {label}
      </p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 font-sans text-sm border-2 border-foreground/30 px-3 py-2 text-left text-foreground/80 hover:border-foreground transition-colors"
        >
          <span className="truncate">
            {selected.length === 0 ?
              locale === "fr" ?
                "Sélectionner les samedis"
              : "Select Saturdays"
            : summary}
          </span>
          <span
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {open && (
          <ul
            role="listbox"
            aria-multiselectable
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto border-2 border-foreground/30 bg-background shadow-lg"
          >
            {dates.map((d) => {
              const active = selected.includes(d);
              return (
                <li key={d} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => toggle(d)}
                    className={`w-full flex items-center gap-2 font-sans text-sm px-3 py-2 text-left transition-colors ${
                      active ?
                        "bg-foreground/10 text-foreground"
                      : "text-foreground/80 hover:bg-foreground/5"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 ${
                        active ?
                          "bg-foreground border-foreground text-background"
                        : "border-foreground/40"
                      }`}
                      aria-hidden
                    >
                      {active ? "✓" : ""}
                    </span>
                    {d}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Selected dates available to a parent form via these hidden inputs */}
      {selected.map((d) => (
        <input key={d} type="hidden" name="saturdays" value={d} />
      ))}
    </div>
  );
}
