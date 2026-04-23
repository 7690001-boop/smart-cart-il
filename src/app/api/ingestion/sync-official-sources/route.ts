import { NextRequest } from "next/server";
import { syncOfficialRetailSources } from "@/lib/ingestion/syncOfficialSources";
import { executeManagedSyncJob } from "@/lib/jobs/executeSyncJob";

export async function POST(request: NextRequest) {
  return executeManagedSyncJob(request, {
    routeKey: "ingestion-sync-official-sources",
    jobName: "sync-official-sources",
    run: (context) => syncOfficialRetailSources(context)
  });
}
