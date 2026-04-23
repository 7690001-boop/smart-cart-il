import { prisma } from "@/lib/db";
import { IngestionRunRecord } from "@/lib/types";

export async function readIngestionHistory() {
  const rows = await prisma.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 200
  });
  return rows.map(
    (row): IngestionRunRecord => ({
      id: row.id,
      source: row.source as IngestionRunRecord["source"],
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString(),
      status: row.status as IngestionRunRecord["status"],
      fetchedItems: row.fetchedItems,
      ingestedRows: row.ingestedRows,
      errorMessage: row.errorMessage ?? undefined,
      sourceDetails: (row.sourceDetails as IngestionRunRecord["sourceDetails"]) ?? undefined,
      correlationId: row.correlationId ?? undefined,
      idempotencyKey: row.idempotencyKey ?? undefined
    })
  );
}

export async function appendIngestionRun(record: IngestionRunRecord) {
  await prisma.ingestionRun.create({
    data: {
      id: record.id,
      source: record.source,
      startedAt: new Date(record.startedAt),
      finishedAt: record.finishedAt ? new Date(record.finishedAt) : null,
      status: record.status,
      fetchedItems: record.fetchedItems,
      ingestedRows: record.ingestedRows,
      errorMessage: record.errorMessage ?? null,
      sourceDetails: record.sourceDetails ?? undefined,
      correlationId: record.correlationId ?? null,
      idempotencyKey: record.idempotencyKey ?? null
    }
  });
}
