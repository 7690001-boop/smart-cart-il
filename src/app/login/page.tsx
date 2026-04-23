import Link from "next/link";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasGoogleConfig = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  const errorMap: Record<string, string> = {
    OAuthSignin: "נכשלה התחברות לספק Google.",
    OAuthCallback: "נכשלה חזרה מהתחברות Google.",
    OAuthCreateAccount: "לא ניתן ליצור חשבון דרך Google.",
    AccessDenied: "הגישה נדחתה.",
    Configuration: "הגדרות OAuth חסרות או שגויות.",
    Verification: "האימות נכשל.",
    Default: "אירעה שגיאה בהתחברות."
  };
  const errorText = params.error ? errorMap[params.error] ?? errorMap.Default : null;

  return (
    <section className="space-y-4 rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">כניסה עם Gmail</h1>
      <p className="text-sm text-slate-600">
        ליצירת חשבון והתחברות מהירה, ניתן להיכנס עם חשבון Google.
      </p>
      {!hasGoogleConfig && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          חסרה הגדרת Google OAuth בשרת (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
        </div>
      )}
      {errorText && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errorText}
        </div>
      )}
      <Link
        href={hasGoogleConfig ? "/api/auth/signin/google?callbackUrl=/items" : "#"}
        className={`inline-block rounded px-4 py-2 text-white ${
          hasGoogleConfig ? "bg-blue-600" : "cursor-not-allowed bg-slate-400"
        }`}
      >
        התחברות עם Google
      </Link>
    </section>
  );
}
