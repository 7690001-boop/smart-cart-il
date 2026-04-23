export interface MetricsProvider {
  increment(metricName: string, value?: number, tags?: Record<string, string>): void;
}

export class ConsoleMetricsProvider implements MetricsProvider {
  increment(metricName: string, value = 1, tags: Record<string, string> = {}) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        type: "metric",
        metricName,
        value,
        tags
      })
    );
  }
}

export const metricsProvider: MetricsProvider = new ConsoleMetricsProvider();
