"use client";

import { useEffect, useRef, useState } from "react";

type Preferences = {
  maxDistanceKm: number;
  homeLatitude?: number | null;
  homeLongitude?: number | null;
  allowSplitStore: boolean;
  preferredKosher: string[];
  preferredBrands: string[];
  excludedStores: string[];
  notes?: string | null;
};

type GeoResult = {
  displayName: string;
  latitude: number;
  longitude: number;
};

function TagInput({
  label,
  tags,
  placeholder,
  onChange,
}: {
  label: string;
  tags: string[];
  placeholder: string;
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const val = input.trim();
    if (!val || tags.includes(val)) { setInput(""); return; }
    onChange([...tags, val]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      <div className="rounded-lg border bg-white p-2 focus-within:ring-2 focus-within:ring-blue-300">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-600 leading-none"
                aria-label={`הסר ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          {tags.length === 0 && (
            <span className="text-xs text-slate-400 py-0.5">אין פריטים</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
            }}
            placeholder={placeholder}
            className="flex-1 text-sm outline-none py-0.5"
            dir="rtl"
          />
          <button
            type="button"
            onClick={addTag}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (lat: number, lon: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasLocation = latitude != null && longitude != null;

  function handleQueryChange(value: string) {
    setQuery(value);
    setGeoError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data = (await res.json()) as GeoResult[];
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }

  function pick(r: GeoResult) {
    onChange(r.latitude, r.longitude);
    setQuery(r.displayName);
    setResults([]);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setGeoError("הדפדפן אינו תומך באיתור מיקום"); return; }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setQuery(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setResults([]);
        setLocating(false);
      },
      () => {
        setGeoError("לא ניתן לאתר מיקום. אנא אפשר גישה למיקום בדפדפן.");
        setLocating(false);
      }
    );
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">📍 מיקום ביתי</span>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="הכנס כתובת לחיפוש..."
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            dir="rtl"
          />
          {searching && (
            <span className="absolute left-2 top-2.5 text-xs text-slate-400">מחפש...</span>
          )}
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-right text-xs hover:bg-slate-50"
                    onClick={() => pick(r)}
                  >
                    {r.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {locating ? "מאתר..." : "📱 מיקום נוכחי"}
        </button>
      </div>
      {geoError && <p className="text-xs text-red-600">{geoError}</p>}
      {hasLocation && (
        <p className="flex items-center gap-1 text-xs text-green-700">
          <span>✓</span>
          <span>{latitude!.toFixed(5)}, {longitude!.toFixed(5)}</span>
        </p>
      )}
    </div>
  );
}

export default function PreferencesClient() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/preferences/profile")
      .then((res) => res.json())
      .then((data: Preferences) => setPrefs(data))
      .catch(() => undefined);
  }, []);

  if (!prefs) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/preferences/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...prefs, maxDistanceKm: prefs!.maxDistanceKm ?? 15 }),
    });
    setSaving(false);
    setStatus({ ok: res.ok, msg: res.ok ? "ההעדפות נשמרו בהצלחה" : "שמירה נכשלה" });
    if (res.ok) setTimeout(() => setStatus(null), 3000);
  }

  return (
    <div className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
      <LocationPicker
        latitude={prefs.homeLatitude}
        longitude={prefs.homeLongitude}
        onChange={(lat, lon) => setPrefs({ ...prefs, homeLatitude: lat, homeLongitude: lon })}
      />

      <div className="h-px bg-slate-100" />

      {/* Distance slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">🚗 מרחק מקסימלי</span>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-bold text-blue-700">
            {prefs.maxDistanceKm} ק״מ
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={prefs.maxDistanceKm}
          onChange={(e) => setPrefs({ ...prefs, maxDistanceKm: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>1 ק״מ</span>
          <span>100 ק״מ</span>
        </div>
      </div>

      {/* Split store toggle */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">פיצול קנייה בין חנויות</p>
          <p className="text-xs text-slate-500">מאפשר לקנות מוצרים שונים בחנויות שונות</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.allowSplitStore}
          onClick={() => setPrefs({ ...prefs, allowSplitStore: !prefs.allowSplitStore })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${prefs.allowSplitStore ? "bg-blue-600" : "bg-slate-300"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${prefs.allowSplitStore ? "translate-x-1.5" : "-translate-x-1.5"}`}
          />
        </button>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Tag inputs */}
      <TagInput
        label="🕍 כשרויות מועדפות"
        tags={prefs.preferredKosher}
        placeholder="לדוגמה: בד״ץ, רבנות..."
        onChange={(tags) => setPrefs({ ...prefs, preferredKosher: tags })}
      />

      <TagInput
        label="🏷️ מותגים מועדפים"
        tags={prefs.preferredBrands}
        placeholder="לדוגמה: תנובה, טרה..."
        onChange={(tags) => setPrefs({ ...prefs, preferredBrands: tags })}
      />

      <TagInput
        label="🚫 חנויות חסומות"
        tags={prefs.excludedStores}
        placeholder="מזהה חנות..."
        onChange={(tags) => setPrefs({ ...prefs, excludedStores: tags })}
      />

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          📝 הערות אישיות
        </label>
        <textarea
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          rows={3}
          dir="rtl"
          value={prefs.notes ?? ""}
          onChange={(e) => setPrefs({ ...prefs, notes: e.target.value })}
          placeholder="הערות נוספות..."
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
        >
          {saving ? "שומר..." : "שמירת העדפות"}
        </button>
        {status && (
          <p className={`text-sm font-medium ${status.ok ? "text-green-700" : "text-red-600"}`}>
            {status.ok ? "✓ " : "✕ "}{status.msg}
          </p>
        )}
      </div>
    </div>
  );
}
