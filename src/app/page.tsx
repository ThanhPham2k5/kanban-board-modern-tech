import Header from "@/components/Header";
import BoardView from "@/components/BoardView";
import { getFullData } from "@/actions/checklist-actions";

export default async function Home() {
  const lists = await getFullData();
  const cards = lists.flatMap((list) => list.cards);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/40 dark:bg-background">
        <BoardView initialLists={lists || []} initialCards={cards || []} />
      </main>
    </div>
  );
}
