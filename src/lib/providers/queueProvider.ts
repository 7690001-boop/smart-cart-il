import { QueueProvider } from "@/lib/providers/contracts";

class HttpQueueProvider implements QueueProvider {
  async enqueue(jobName: string, payload: Record<string, unknown>, idempotencyKey: string) {
    const queueUrl = process.env.QUEUE_WEBHOOK_URL;
    if (!queueUrl) return;
    await fetch(queueUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-idempotency-key": idempotencyKey
      },
      body: JSON.stringify({ jobName, payload })
    });
  }
}

export function getQueueProvider(): QueueProvider {
  return new HttpQueueProvider();
}
