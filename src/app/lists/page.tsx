import ListsClient from "@/components/ListsClient";

export default function ListsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">רשימות הקנייה שלי</h1>
      <ListsClient />
    </section>
  );
}
