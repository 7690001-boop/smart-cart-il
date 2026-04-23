import { NextRequest } from "next/server";
import { syncAllGovernmentItems } from "@/lib/ingestion/syncGovernmentCatalog";
import { executeManagedSyncJob } from "@/lib/jobs/executeSyncJob";

export async function POST(request: NextRequest) {
  return executeManagedSyncJob(request, {
    routeKey: "ingestion-sync-government",
    jobName: "sync-government-catalog",
    run: (context) => syncAllGovernmentItems(context)
  });
}
