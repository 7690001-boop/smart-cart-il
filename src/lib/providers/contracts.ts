import { GovernmentCatalogItem, IngestionRunRecord } from "@/lib/types";

export interface StorageProvider {
  putObject(key: string, content: string): Promise<void>;
  getObject(key: string): Promise<string | null>;
}

export interface QueueProvider {
  enqueue(jobName: string, payload: Record<string, unknown>, idempotencyKey: string): Promise<void>;
}

export interface CatalogSourceProvider {
  fetchAllItems(): Promise<GovernmentCatalogItem[]>;
}

export interface HistoryProvider {
  readRuns(): Promise<IngestionRunRecord[]>;
  appendRun(run: IngestionRunRecord): Promise<void>;
}
