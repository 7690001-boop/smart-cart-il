import { prisma } from "@/lib/db";

export async function ensureJobNotProcessed(jobName: string, idempotencyKey: string) {
  const existing = await prisma.ingestionRun.findFirst({
    where: { idempotencyKey }
  });
  if (existing?.status === "success") return false;

  if (!existing) {
    await prisma.ingestionRun.create({
      data: {
        id: `${jobName}-${Date.now()}`,
        source: jobName,
        idempotencyKey,
        status: "running",
        startedAt: new Date(),
        fetchedItems: 0,
        ingestedRows: 0
      }
    });
    return true;
  }

  await prisma.ingestionRun.update({
    where: { id: existing.id },
    data: { status: "running" }
  });
  return true;
}

export async function markJobFinished(idempotencyKey: string, status: "success" | "failed", lastError?: string) {
  const existing = await prisma.ingestionRun.findFirst({ where: { idempotencyKey } });
  if (!existing) return;
  await prisma.ingestionRun.update({
    where: { id: existing.id },
    data: { status, finishedAt: new Date(), errorMessage: lastError ?? null }
  });
}
