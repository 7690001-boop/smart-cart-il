"use client";

import { useEffect, useState } from "react";

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

function splitCsv(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
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
      ...prefs,
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          קו רוחב ביתי (Latitude)
          <input
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            className="mt-1 w-full rounded border p-2"
            value={prefs.homeLatitude ?? ""}
            onChange={(e) =>
              setPrefs({
                ...prefs,
                homeLatitude: e.target.value.trim() === "" ? null : Number(e.target.value)
              })
            }
          />
        </label>

        <label className="block text-sm">
          קו אורך ביתי (Longitude)
          <input
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            className="mt-1 w-full rounded border p-2"
            value={prefs.homeLongitude ?? ""}
            onChange={(e) =>
              setPrefs({
                ...prefs,
                homeLongitude: e.target.value.trim() === "" ? null : Number(e.target.value)
              })
            }
          />
        </label>
      </div>

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
