import { authOptions } from "@/auth";
import { canonicalProducts, clusterReviewQueue } from "@/lib/data";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminClustersPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return (
      <section className="space-y-4 rounded border bg-white p-4">
        <h1 className="text-xl font-semibold">ניהול</h1>
        <p className="text-sm text-slate-700">אין הרשאת מנהל לחשבון הזה.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Cluster Review Queue</h1>
      <ul className="space-y-3">
        {clusterReviewQueue.map((q) => {
          const candidate = canonicalProducts.find((c) => c.id === q.candidateCanonicalId);
          return (
            <li key={q.id} className="rounded border bg-white p-4 text-sm">
              <div>
                <span className="font-medium">Source: </span>
                {q.sourceName}
              </div>
              <div>
                <span className="font-medium">Candidate: </span>
                {candidate?.name ?? q.candidateCanonicalId}
              </div>
              <div>
                <span className="font-medium">Confidence: </span>
                {(q.confidence * 100).toFixed(1)}%
              </div>
              <div>
                <span className="font-medium">Status: </span>
                {q.status}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
