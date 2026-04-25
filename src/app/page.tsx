import Link from "next/link";
import type { Route } from "next";

const features = [
  {
    href: "/items",
    icon: "🛍️",
    title: "קטלוג מוצרים",
    desc: "עיין ביותר מ-4,000 מוצרים ממאגר המחירים הארצי, השווה מחירים ובחר מה שרלוונטי לך.",
    accent: "bg-blue-50 text-blue-600",
    border: "hover:border-blue-200",
  },
  {
    href: "/lists",
    icon: "📋",
    title: "רשימות קנייה",
    desc: "ארגן את הקניות שלך ברשימות מותאמות אישית עם העדפות מותג וכשרות לכל פריט.",
    accent: "bg-green-50 text-green-600",
    border: "hover:border-green-200",
  },
  {
    href: "/optimize",
    icon: "💰",
    title: "מציאת הסל הזול",
    desc: "האלגוריתם שלנו מוצא את החנות הזולה ביותר לסל הקניות שלך לפי המיקום שלך.",
    accent: "bg-amber-50 text-amber-600",
    border: "hover:border-amber-200",
  },
  {
    href: "/preferences",
    icon: "⚙️",
    title: "העדפות אישיות",
    desc: "הגדר מיקום, מרחק מקסימלי, מותגים מועדפים וחנויות שאין ללכת אליהן.",
    accent: "bg-slate-100 text-slate-600",
    border: "hover:border-slate-300",
  },
];

const steps = [
  { num: "1", label: "בחר מוצרים מהקטלוג" },
  { num: "2", label: "הוסף לרשימת הקניות" },
  { num: "3", label: "לחץ על אופטימיזציה וחסוך" },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-12 text-white">
        <div className="relative z-10 max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            מחירים מעודכנים מהמאגר הממשלתי
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight">
            הסל הזול ביותר
            <br />
            בישראל
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-blue-100">
            Smart Cart IL משווה מחירים מכל הרשתות ומוצא עבורך את סל הקניות המשתלם ביותר — לפי המיקום, ההעדפות והדרישות שלך.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/items"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
            >
              התחל לקנות
            </Link>
            <Link
              href="/optimize"
              className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              מצא את הסל הזול
            </Link>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 left-32 h-48 w-48 rounded-full bg-white/5" />
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
          איך זה עובד?
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          {steps.map((step, i) => (
            <div key={step.num} className="flex flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {step.num}
              </div>
              <p className="text-sm font-medium text-slate-700">{step.label}</p>
              {i < steps.length - 1 && (
                <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
          כל הכלים שלך
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ href, icon, title, desc, accent, border }) => (
            <Link
              key={href}
              href={href as Route}
              className={`group rounded-xl border bg-white p-6 transition-all hover:shadow-md hover:-translate-y-0.5 ${border}`}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${accent}`}>
                {icon}
              </div>
              <h3 className="mb-1.5 font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
