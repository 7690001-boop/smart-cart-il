import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">כניסה עם Gmail</h1>
      <p className="text-sm text-slate-600">
        ליצירת חשבון והתחברות מהירה, ניתן להיכנס עם חשבון Google.
      </p>
      <Link
        href="/api/auth/signin/google?callbackUrl=/items"
        className="inline-block rounded bg-blue-600 px-4 py-2 text-white"
      >
        התחברות עם Google
      </Link>
    </section>
  );
}
