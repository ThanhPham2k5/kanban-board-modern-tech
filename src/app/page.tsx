import Header from "@/components/Header";
import BoardView from "@/components/BoardView";
import { getFullData } from "@/actions/checklist-actions";

export default async function Home() {
  const lists = await getFullData();
  const cards = lists.flatMap((list) => list.cards);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-x-auto p-4 md:p-6">
        <BoardView initialLists={lists || []} initialCards={cards || []} />
      </main>
    </div>
  );
}
