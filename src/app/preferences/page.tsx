import PreferencesClient from "@/components/PreferencesClient";

export default function PreferencesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">העדפות אישיות</h1>
      <p className="text-sm text-slate-600">כאן ניתן לקבוע העדפות מרחק, פיצול קנייה, כשרות, מותגים וחנויות.</p>
      <PreferencesClient />
    </section>
  );
}
