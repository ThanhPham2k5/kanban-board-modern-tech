import { Plus } from "lucide-react";
import { Button } from "./ui/button";

export default function BoardSkeleton() {
  return (
    <div
      data-testid="board-skeleton"
      className="flex gap-4 flex-1 items-start overflow-x-auto p-4 md:p-6"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-68 shrink-0 bg-secondary/50 rounded-xl p-3 flex flex-col gap-3 animate-pulse"
        >
          <div className="h-8 bg-secondary rounded-md w-3/4"></div>

          <div className="flex flex-col gap-2">
            <div className="h-24 bg-background rounded-lg shadow-sm border"></div>
            <div className="h-16 bg-background rounded-lg shadow-sm border"></div>
          </div>

          <div className="h-8 bg-secondary/50 rounded-md w-1/2 mt-1"></div>
        </div>
      ))}

      <Button
        variant="ghost"
        className="w-fit justify-start text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <Plus className="h-4 w-4 mr-2" />
        Thêm danh sách
      </Button>
    </div>
  );
}
