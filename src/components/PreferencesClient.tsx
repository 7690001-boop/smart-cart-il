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

function splitCsv(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function LocationPicker({
  latitude,
  longitude,
  onChange
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
    if (!value.trim()) {
      setResults([]);
      return;
    }
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
    if (!navigator.geolocation) {
      setGeoError("הדפדפן אינו תומך באיתור מיקום");
      return;
    }
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
    <div className="space-y-2 text-sm">
      <div className="font-medium text-slate-700">מיקום ביתי</div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="הכנס כתובת לחיפוש..."
            className="w-full rounded border p-2 text-sm"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            dir="rtl"
          />
          {searching && (
            <span className="absolute left-2 top-2.5 text-xs text-slate-400">מחפש...</span>
          )}
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded border bg-white shadow-md">
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
          className="whitespace-nowrap rounded border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {locating ? "מאתר..." : "מיקום נוכחי"}
        </button>
      </div>

      {geoError && <p className="text-xs text-red-600">{geoError}</p>}

      {hasLocation && (
        <p className="text-xs text-slate-500">
          {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
        </p>
      )}
    </div>
  );
}

export default function PreferencesClient() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [brandsText, setBrandsText] = useState("");
  const [storesText, setStoresText] = useState("");
  const [kosherText, setKosherText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/preferences/profile")
      .then((res) => res.json())
      .then((data: Preferences) => {
        setPrefs(data);
        setBrandsText((data.preferredBrands ?? []).join(", "));
        setStoresText((data.excludedStores ?? []).join(", "));
        setKosherText((data.preferredKosher ?? []).join(", "));
      })
      .catch(() => undefined);
  }, []);

  if (!prefs) return <div className="text-sm text-slate-600">טוען העדפות...</div>;

  async function save() {
    const payload: Preferences = {
      ...prefs!,
      maxDistanceKm: prefs!.maxDistanceKm ?? 15,
      allowSplitStore: prefs!.allowSplitStore ?? false,
      preferredBrands: splitCsv(brandsText),
      excludedStores: splitCsv(storesText),
      preferredKosher: splitCsv(kosherText)
    };
    const res = await fetch("/api/preferences/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setStatus(res.ok ? "ההעדפות נשמרו" : "שמירה נכשלה");
  }

  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <LocationPicker
        latitude={prefs.homeLatitude}
        longitude={prefs.homeLongitude}
        onChange={(lat, lon) => setPrefs({ ...prefs, homeLatitude: lat, homeLongitude: lon })}
      />

      <label className="block text-sm">
        מרחק מקסימלי (ק״מ)
        <input
          type="number"
          min={0}
          max={200}
          className="mt-1 w-full rounded border p-2"
          value={prefs.maxDistanceKm}
          onChange={(e) => setPrefs({ ...prefs, maxDistanceKm: Number(e.target.value) || 0 })}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.allowSplitStore}
          onChange={(e) => setPrefs({ ...prefs, allowSplitStore: e.target.checked })}
        />
        לאפשר פיצול קנייה בין חנויות
      </label>

      <label className="block text-sm">
        כשרויות מועדפות (מופרד בפסיקים)
        <input className="mt-1 w-full rounded border p-2" value={kosherText} onChange={(e) => setKosherText(e.target.value)} />
      </label>

      <label className="block text-sm">
        מותגים מועדפים (מופרד בפסיקים)
        <input className="mt-1 w-full rounded border p-2" value={brandsText} onChange={(e) => setBrandsText(e.target.value)} />
      </label>

      <label className="block text-sm">
        חנויות לחסימה (מופרד בפסיקים)
        <input className="mt-1 w-full rounded border p-2" value={storesText} onChange={(e) => setStoresText(e.target.value)} />
      </label>

      <label className="block text-sm">
        הערות אישיות
        <textarea
          className="mt-1 w-full rounded border p-2"
          rows={3}
          value={prefs.notes ?? ""}
          onChange={(e) => setPrefs({ ...prefs, notes: e.target.value })}
        />
      </label>

      <button type="button" onClick={save} className="rounded bg-blue-600 px-4 py-2 text-sm text-white">
        שמירה
      </button>
      {status ? <div className="text-xs text-green-700">{status}</div> : null}
    </div>
  );
}
