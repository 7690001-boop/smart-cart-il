import { NextRequest } from "next/server";
import { executeManagedSyncJob } from "@/lib/jobs/executeSyncJob";
import { syncCpftaRetailRegistry } from "@/lib/ingestion/cpftaRegistry";

export async function POST(request: NextRequest) {
  return executeManagedSyncJob(request, {
    routeKey: "ingestion-sync-cpfta-sources",
    jobName: "sync-cpfta-registry",
    run: async () => syncCpftaRetailRegistry()
  });
}
