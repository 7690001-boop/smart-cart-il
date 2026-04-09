import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Cheapest Grocery Basket in Israel</h1>
      <p className="text-slate-700">
        Smart Cart IL compares central price-feed data across major chains and finds your best
        valid basket while respecting your product restrictions.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded border bg-white p-4" href="/lists">
          Manage Shopping Lists
        </Link>
        <Link className="rounded border bg-white p-4" href="/optimize">
          Optimize My Basket
        </Link>
      </div>
    </section>
  );
}
