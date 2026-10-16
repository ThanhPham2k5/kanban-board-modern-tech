import Header from "@/components/Header";
import BoardView from "@/components/BoardView";
import { getFullData } from "@/actions/checklist-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BoardTestPage() {
  const lists = await getFullData();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/40 dark:bg-background">
        <BoardView initialLists={lists} />
      </main>
    </div>
  );
}
