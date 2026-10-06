import { getFullData } from "@/app/lib/actions";
import { CardMockModal } from "@/components/checklist/card-mock-modal";

export default async function Home() {
  const lists = await getFullData();
  const allCards = lists.flatMap((list) => list.cards);

  return (
    <main className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Thử nghiệm Checklist Thẻ Kanban
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dữ liệu được nạp sẵn từ server qua hàm getFullData. Nhấp vào thẻ để
            mở popup chi tiết.
          </p>
        </div>

        <CardMockModal initialCards={allCards} />
      </div>
    </main>
  );
}
