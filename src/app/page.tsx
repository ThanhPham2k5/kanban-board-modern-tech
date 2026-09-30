import Header from "@/components/Header";
import BoardView from "@/components/BoardView";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-x-auto p-4 md:p-6">
        <BoardView />
      </main>
    </div>
  );
}
