import { getFullData } from "@/actions/card-actions";
import { ListSectionMock } from "@/components/card/ListSectionMock";

export default async function BoardTestPage() {
  const lists = await getFullData();

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kanban Board Test Page
          </h1>
          <p className="text-sm text-muted-foreground">
            Trang thử nghiệm kéo thả thẻ (Card) nội bộ và kéo thả qua lại giữa
            các danh sách khác nhau.
          </p>
        </div>

        <div className="border rounded-2xl p-6 bg-card/50 shadow-sm overflow-hidden">
          <ListSectionMock initialLists={lists} />
        </div>
      </div>
    </main>
  );
}
