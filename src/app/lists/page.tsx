import { canonicalProducts, shoppingLists } from "@/lib/data";

export default function ListsPage() {
  const list = shoppingLists[0];
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">My Shopping Lists</h1>
      <article className="rounded border bg-white p-4">
        <h2 className="font-medium">{list.name}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {list.items.map((item) => {
            const product = canonicalProducts.find((p) => p.id === item.canonicalProductId);
            return (
              <li key={item.id} className="rounded bg-slate-50 p-2">
                <div>{product?.name ?? item.canonicalProductId}</div>
                <div className="text-slate-600">
                  Qty: {item.quantity} | Brand: {item.preferences.brand} | Kosher required:{" "}
                  {item.preferences.kosherRequired ? "Yes" : "No"}
                </div>
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}
