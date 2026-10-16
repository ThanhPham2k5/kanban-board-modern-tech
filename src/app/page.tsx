import Header from "@/components/Header";
import BoardView from "@/components/BoardView";
import { getFullData } from "@/actions/checklist-actions";
import { Suspense } from "react";
import BoardSkeleton from "@/components/BoardSkeleton";

async function BoardDataFetch() {
  const lists = await getFullData();
  return <BoardView initialLists={lists} />;
}

export default async function BoardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/40 dark:bg-background">
        <Suspense fallback={<BoardSkeleton />}>
          <BoardDataFetch />
        </Suspense>
      </main>
    </div>
  );
}
