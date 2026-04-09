import ItemCatalogSelector from "@/components/ItemCatalogSelector";

export default function ItemsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">קטלוג פריטים</h1>
      <p className="text-sm text-slate-600">
        רשימת מוצרים מהקטלוג. אפשר לבחור מוצרים כדי לבנות רשימת קניות מותאמת.
      </p>
      <ItemCatalogSelector />
    </section>
  );
}
