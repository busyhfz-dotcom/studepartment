"use client";

import { useEffect, useId, useRef, useState } from "react";
import { countries, countryName } from "@/lib/countries";
import { featuredCountries, opportunityRegion, opportunityRegions } from "@/lib/opportunity-filters";
import styles from "./opportunity-location-picker.module.css";

type Region = keyof typeof opportunityRegions;
const groups: Region[] = ["EUROPE", "ASIA", "US_CA"];
const featured = new Set<string>(featuredCountries);

function Chevron() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>;
}

export function OpportunityLocationPicker({ value, onChange, name, label = "Location" }: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<Region>();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selectedRegion = opportunityRegion(value);
  const selected = selectedRegion ? opportunityRegions[selectedRegion].label : countryName(value);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function select(code: string) {
    setOpen(false);
    onChange(code);
    trigger.current?.focus();
  }

  return <div ref={root} className={styles.root}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => {
      if (event.key !== "Escape" || !open) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }}>
    {name ? <input type="hidden" name={name} value={value} /> : null}
    <button ref={trigger} type="button" className={styles.trigger} aria-expanded={open}
      aria-label={label + ": " + (selected || "Any location")} aria-controls={open ? id : undefined}
      onClick={() => {
        if (!open) setGroup(selectedRegion || groups.find(key => opportunityRegions[key].countries.some(code => code === value)));
        setOpen(!open);
      }}>
      <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.pin}><path d="M15.5 8c0 4-5.5 8-5.5 8s-5.5-4-5.5-8a5.5 5.5 0 1 1 11 0Z" /><circle cx="10" cy="8" r="1.65" /></svg>
      <span>{selected || "Any location"}</span>
      <Chevron />
    </button>
    {open ? <div id={id} className={styles.panel} aria-label={label}>
      <button type="button" className={styles.reset} onClick={() => select("")} aria-pressed={!value}>Any location</button>
      {groups.map(key => {
        const region = opportunityRegions[key];
        const expanded = group === key;
        return <div key={key} className={styles.section}>
          <button type="button" className={styles.region} aria-expanded={expanded} aria-controls={expanded ? id + key : undefined}
            onClick={() => setGroup(expanded ? undefined : key)}>{region.label}<Chevron /></button>
          {expanded ? <div id={id + key} className={styles.countries}>
            <button type="button" aria-pressed={value === key} onClick={() => select(key)}>{key === "US_CA" ? "US & Canada together" : "All " + region.label}</button>
            {countries.filter(([code]) => region.countries.some(member => member === code) && (featured.has(code) || code === value)).map(([code, title]) =>
              <button type="button" key={code} aria-pressed={value === code} onClick={() => select(code)}>{title}</button>)}
          </div> : null}
        </div>;
      })}
    </div> : null}
  </div>;
}
