import type { ChangeEvent } from "react";
import { countries, isCountryCode } from "@/lib/countries";

/**
 * Country picker that submits an ISO 3166-1 alpha-2 code. Replaces the
 * two-letter free-text inputs, where people typed "Germany" or "Iran" and got
 * no results.
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
