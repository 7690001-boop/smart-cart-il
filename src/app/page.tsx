import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">הסל הזול ביותר בישראל</h1>
      <p className="text-slate-700">
        Smart Cart IL משווה מחירים ממאגר המחירים הארצי ומוצא עבורך את סל הקניות המשתלם ביותר לפי
        ההעדפות והמגבלות שלך.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded border bg-white p-4" href="/lists">
          ניהול רשימות קנייה
        </Link>
        <Link className="rounded border bg-white p-4" href="/items">
          קטלוג פריטים
        </Link>
        <Link className="rounded border bg-white p-4" href="/optimize">
          מצא את הסל הזול ביותר
        </Link>
      </div>
    </section>
  );
}
