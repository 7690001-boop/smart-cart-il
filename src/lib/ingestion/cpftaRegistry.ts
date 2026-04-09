import crypto from "node:crypto";
import { prisma } from "@/lib/db";

type DiscoveredSource = {
  sourceKey: string;
  nameHe: string;
  nameEn?: string;
  storeId: string;
  feedUrl: string;
  authHint?: string;
  syncCadenceMinutes?: number;
  discoveredFrom: string;
};

function hashString(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeKey(url: string, label: string) {
  return `${label.trim().toLowerCase()}::${url.trim().toLowerCase()}`;
}

function getOverrideSourcesFromEnv(): DiscoveredSource[] {
  const raw = process.env.CPFTA_SOURCE_OVERRIDES_JSON ?? "";
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<{
      nameHe: string;
      nameEn?: string;
      storeId: string;
      feedUrl: string;
      authHint?: string;
      syncCadenceMinutes?: number;
    }>;
    return parsed
      .filter((v) => v.nameHe && v.storeId && v.feedUrl)
      .map((v) => ({
        sourceKey: normalizeKey(v.feedUrl, v.nameHe),
        nameHe: v.nameHe,
        nameEn: v.nameEn,
        storeId: v.storeId,
        feedUrl: v.feedUrl,
        authHint: v.authHint,
        syncCadenceMinutes: v.syncCadenceMinutes,
        discoveredFrom: "env-override"
      }));
  } catch {
    return [];
  }
}

export async function syncCpftaRetailRegistry() {
  const discovered = getOverrideSourcesFromEnv();
  if (discovered.length === 0) {
    return {
      scannedAt: new Date().toISOString(),
      discoveredCount: 0,
      created: 0,
      updated: 0,
      deactivated: 0,
      note: "CPFTA_SOURCE_OVERRIDES_JSON is empty. No retailer sources were synced."
    };
  }

  const deduped = new Map<string, DiscoveredSource>();
  for (const source of discovered) deduped.set(source.sourceKey, source);
  const finalSources = [...deduped.values()];

  const now = new Date();
  let created = 0;
  let updated = 0;
  const changedSourceKeys: string[] = [];

  for (const source of finalSources) {
    const syncCadenceMinutes = Math.max(15, Number((source as { syncCadenceMinutes?: number }).syncCadenceMinutes ?? 180));
    const linkHash = hashString(
      JSON.stringify({
        nameHe: source.nameHe,
        nameEn: source.nameEn,
        storeId: source.storeId,
        feedUrl: source.feedUrl,
        authHint: source.authHint,
        syncCadenceMinutes
      })
    );

    const existing = await prisma.retailSource.findUnique({ where: { sourceKey: source.sourceKey } });
    if (!existing) {
      await prisma.retailSource.create({
        data: {
          sourceKey: source.sourceKey,
          nameHe: source.nameHe,
          nameEn: source.nameEn,
          storeId: source.storeId,
          feedUrl: source.feedUrl,
          authHint: source.authHint,
          linkHash,
          isActive: true,
          discoveredFrom: source.discoveredFrom,
          lastSeenAt: now,
          syncCadenceMinutes
        }
      });
      created += 1;
      changedSourceKeys.push(source.sourceKey);
    } else {
      const changed = existing.linkHash !== linkHash || !existing.isActive;
      if (changed) updated += 1;
      if (changed) changedSourceKeys.push(source.sourceKey);
      await prisma.retailSource.update({
        where: { sourceKey: source.sourceKey },
        data: {
          nameHe: source.nameHe,
          nameEn: source.nameEn,
          storeId: source.storeId,
          feedUrl: source.feedUrl,
          authHint: source.authHint,
          linkHash,
          isActive: true,
          discoveredFrom: source.discoveredFrom,
          lastSeenAt: now,
          syncCadenceMinutes
        }
      });
    }
  }

  const activeKeys = finalSources.map((s) => s.sourceKey);
  const deactivateResult = await prisma.retailSource.updateMany({
    where: {
      sourceKey: { notIn: activeKeys },
      isActive: true
    },
    data: { isActive: false }
  });

  return {
    scannedAt: now.toISOString(),
    discoveredCount: finalSources.length,
    created,
    updated,
    deactivated: deactivateResult.count,
    changedSourceKeys
  };
}
