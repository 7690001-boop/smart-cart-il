import { canonicalProducts } from "@/lib/data";

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, " ").trim();
}

export function scoreCandidate(sourceName: string, canonicalName: string) {
  const s = new Set(norm(sourceName).split(" "));
  const c = norm(canonicalName).split(" ");
  const hits = c.filter((part) => s.has(part)).length;
  return c.length === 0 ? 0 : hits / c.length;
}

export function findBestCluster(sourceName: string) {
  return canonicalProducts
    .map((cp) => ({
      canonicalProductId: cp.id,
      confidence: scoreCandidate(sourceName, cp.name)
    }))
    .sort((a, b) => b.confidence - a.confidence)[0];
}
