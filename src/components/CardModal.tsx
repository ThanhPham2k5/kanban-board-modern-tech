"use client";

import { X, AlignLeft, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { ChecklistSection } from "./checklist/checklist-section";

interface CardModalProps {
  card: {
    id: string;
    title: string;
    list_id: string;
    order: string;
    isCompleted?: boolean;
    description?: string;
  } | null;
  listTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDeleteCard: (id: string) => void;
  onUpdateDescription: (id: string, newDesc: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void; // Thêm prop này
}

export default function CardModal({
  card,
  listTitle,
  isOpen,
  onClose,
  onToggleComplete,
  onDeleteCard,
  onUpdateDescription,
  onUpdateTitle,
}: CardModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  // Cập nhật lại state khi mở modal thẻ khác
  useEffect(() => {
    if (card) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditTitle(card.title);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditingTitle(false);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== card.title) {
      onUpdateTitle(card.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-background p-6 shadow-lg border">
        {/* Nút Đóng */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tiêu đề thẻ (Có thể click để sửa) */}
        <div className="mb-6 pr-8">
          {isEditingTitle ? (
            <input
              autoFocus
              className="text-xl font-bold w-full bg-transparent border-b-2 border-primary outline-none px-1"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
              }}
            />
          ) : (
            <h2
              className="text-xl font-bold cursor-text hover:bg-muted/30 p-1 -ml-1 rounded transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Nhấn để sửa tiêu đề"
            >
              {card.title}
            </h2>
          )}

          <p className="text-sm text-muted-foreground mt-1 px-1">
            Nằm trong danh sách{" "}
            <span className="font-semibold underline">{listTitle}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_180px]">
          {/* Cột trái: Mô tả */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlignLeft className="h-4 w-4" />
              Mô tả
            </div>
            <textarea
              className="w-full min-h-[120px] p-3 text-sm rounded-md border bg-muted/30 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Thêm mô tả chi tiết..."
              defaultValue={card.description || ""}
              onBlur={(e) => onUpdateDescription(card.id, e.target.value)}
            />

            <div>aaaaaaaa</div>
          </div>

          {/* Cột phải: Các nút hành động */}
          <div className="space-y-2 sm:border-l sm:pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Hành động
            </p>

            <Button
              variant={card.isCompleted ? "secondary" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onToggleComplete(card.id, !!card.isCompleted);
                // Đã gỡ onClose() để người dùng thấy trạng thái thay đổi tức thời
              }}
            >
              <CheckCircle2
                className={`h-4 w-4 mr-2 transition-colors ${card.isCompleted ? "text-green-600" : ""}`}
              />
              {card.isCompleted ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onDeleteCard(card.id);
                // Xóa xong thì bắt buộc phải đóng modal
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa thẻ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
