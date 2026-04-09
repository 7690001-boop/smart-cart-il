import { canonicalProducts, shoppingLists } from "@/lib/data";
import { optimizeSingleStore } from "@/lib/optimizer/singleStore";

function fmt(agorot: number) {
  return `ILS ${(agorot / 100).toFixed(2)}`;
}

export default function OptimizePage() {
  const list = shoppingLists[0];
  const result = optimizeSingleStore(list.id);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Optimization Result (Single Store)</h1>
      {!result?.recommended ? (
        <p>No valid store found for this list and preferences.</p>
      ) : (
        <article className="rounded border bg-white p-4">
          <h2 className="font-medium">Recommended: {result.recommended.store.name}</h2>
          <p className="text-sm text-slate-700">Total: {fmt(result.recommended.totalAgorot)}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {result.recommended.items.map((line) => {
              const product = canonicalProducts.find((cp) => cp.id === line.canonicalProductId);
              return (
                <li key={line.itemId} className="rounded bg-slate-50 p-2">
                  {product?.name} x{line.quantity} = {fmt(line.linePriceAgorot)}
                </li>
              );
            })}
          </ul>
          <h3 className="mt-4 font-medium">Runner-ups</h3>
          <ul className="text-sm text-slate-700">
            {result.runnersUp.map((r) => (
              <li key={r.store.id}>
                {r.store.name}: {fmt(r.totalAgorot)}
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
