"use client";

import type { ChangeEvent } from "react";
import { countries, isCountryCode } from "@/lib/countries";

function makeRoomForCountryPicker(select: HTMLSelectElement) {
  const pickerHeight = Math.min(320, window.innerHeight * .55, select.options.length * 38 + 14);
  const overflow = select.getBoundingClientRect().bottom + pickerHeight + 12 - window.innerHeight;
  if (overflow > 0) window.scrollBy({ top: overflow, behavior: "instant" });
}

/**
 * Country picker that submits an ISO 3166-1 alpha-2 code. Replaces the
 * two-letter free-text inputs, where people typed "Germany" or "Iran" and got
 * no results. Options stay independent of filtered search results so another
 * country can always be selected, including when a search returns no matches.
 */
export function CountrySelect({
  value,
  defaultValue,
  onChange,
  name,
  anyLabel = "Any country",
  ariaLabel,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  anyLabel?: string;
  ariaLabel?: string;
}) {
  const controlled = value !== undefined;
  // Keep an existing stored code selectable even if it is not in the list, so
  // saving a form never silently clears it.
  const current = (controlled ? value : defaultValue ?? "").toUpperCase();
  const unknownCurrent = current && !isCountryCode(current) ? current : null;
  return (
    <select
      aria-label={ariaLabel}
      name={name}
      data-picker-direction="down"
      onPointerDown={(event) => makeRoomForCountryPicker(event.currentTarget)}
      onKeyDown={(event) => {
        if ([" ", "Enter", "ArrowDown"].includes(event.key)) makeRoomForCountryPicker(event.currentTarget);
      }}
      {...(controlled ? { value: value.toUpperCase() } : { defaultValue: (defaultValue ?? "").toUpperCase() })}
      onChange={onChange ? (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value) : undefined}
    >
      <option value="">{anyLabel}</option>
      {unknownCurrent ? <option value={unknownCurrent}>{unknownCurrent}</option> : null}
      {countries.map(([code, label]) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
  );
}
