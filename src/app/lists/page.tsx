import { canonicalProducts, shoppingLists } from "@/lib/data";

export default function ListsPage() {
  const list = shoppingLists[0];
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">רשימות הקנייה שלי</h1>
      <article className="rounded border bg-white p-4">
        <h2 className="font-medium">שם הרשימה: {list.name}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {list.items.map((item) => {
            const product = canonicalProducts.find((p) => p.id === item.canonicalProductId);
            return (
              <li key={item.id} className="rounded bg-slate-50 p-2">
                <div>{product?.nameHe ?? product?.name ?? item.canonicalProductId}</div>
                <div className="text-slate-600">
                  כמות: {item.quantity} | מותג:{" "}
                  {item.preferences.brand === "strict" ? "מותג קבוע" : "גמיש"} | כשרות:{" "}
                  {item.preferences.kosherRequired ? "נדרש" : "לא נדרש"}
                </div>
              </li>
            );
          })}
        </ul>
      </article>
      <p className="text-sm text-slate-600">
        להוספת פריט ניתן להשתמש ב-API: <code>POST /api/lists/[listId]/items</code>
      </p>
    </section>
  );
}
