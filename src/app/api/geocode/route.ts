import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "il");
  url.searchParams.set("accept-language", "he");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "smart-cart-il/1.0" }
  });

  if (!res.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  const results = data.map((r) => ({
    displayName: r.display_name,
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon)
  }));

  return NextResponse.json(results);
}
