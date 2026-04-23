import { NextRequest } from "next/server";
import { syncUnifiedCatalog } from "@/lib/ingestion/syncUnifiedCatalog";
import { executeManagedSyncJob } from "@/lib/jobs/executeSyncJob";

export async function POST(request: NextRequest) {
  return executeManagedSyncJob(request, {
    routeKey: "ingestion-sync-all",
    jobName: "sync-unified-catalog",
    run: (context) => syncUnifiedCatalog(context)
  });
}
