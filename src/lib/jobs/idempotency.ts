import { prisma } from "@/lib/db";

export async function ensureJobNotProcessed(jobName: string, idempotencyKey: string) {
  const existing = await prisma.jobExecution.findUnique({
    where: { idempotencyKey }
  });
  if (existing?.status === "success") {
    return false;
  }

  if (!existing) {
    await prisma.jobExecution.create({
      data: {
        id: `${jobName}-${Date.now()}`,
        jobName,
        idempotencyKey,
        status: "running"
      }
    });
    return true;
  }

  await prisma.jobExecution.update({
    where: { idempotencyKey },
    data: { status: "running", attempts: existing.attempts + 1 }
  });
  return true;
}

export async function markJobFinished(idempotencyKey: string, status: "success" | "failed", lastError?: string) {
  await prisma.jobExecution.update({
    where: { idempotencyKey },
    data: {
      status,
      lastError
    }
  });
}
