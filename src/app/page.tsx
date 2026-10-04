import Header from "@/components/Header";
import BoardView from "@/components/BoardView";
import { createClient } from "@/lib/server";

export default async function Home() {
  const supabase = await createClient();

  // rename data to lists - identify with other data
  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .order("order", { ascending: true });

  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .order("order", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-x-auto p-4 md:p-6">
        <BoardView initialLists={lists || []} initialCards={cards || []} />
      </main>
    </div>
  );
}
