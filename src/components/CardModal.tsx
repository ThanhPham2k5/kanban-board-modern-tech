"use client";

import { CardWithChecklists, ChecklistWithItems } from "@/lib/definitions";
import { AlignLeft, CheckCircle2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ChecklistSection } from "./checklist/checklist-section";
import { Button } from "./ui/button";

interface CardModalProps {
  card: CardWithChecklists | null;
  listTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDeleteCard: (id: string) => void;
  onUpdateDescription: (id: string, newDesc: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void; // Thêm prop này
  onChange: (updatedChecklists: ChecklistWithItems[]) => void;
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
  onChange,
}: CardModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (card) {
      setEditTitle(card.title);
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
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

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

            <div>
              <ChecklistSection
                key={card.id}
                cardId={card.id}
                checklists={card.checklists}
                onChange={(newChecklists) => onChange(newChecklists)}
              />
            </div>
          </div>
          {/* cột phải */}

          <div className="space-y-2 sm:border-l sm:pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Hành động
            </p>
            <Button
              variant={card.is_completed ? "secondary" : "outline"}
              size="sm"
              className={`w-full justify-start group transition-all duration-300 ${
                card.is_completed
                  ? "hover:bg-amber-500/10 hover:text-amber-600"
                  : "hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
              }`}
              onClick={() => {
                onToggleComplete(card.id, !!card.is_completed);
              }}
            >
              <CheckCircle2
                className={`h-4 w-4 mr-2 transition-all duration-300 group-hover:scale-110 ${
                  card.is_completed
                    ? "text-green-600 group-hover:text-amber-600"
                    : "group-hover:text-green-600"
                }`}
              />
              {card.is_completed ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start group text-destructive transition-all duration-300 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
              onClick={() => {
                onDeleteCard(card.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
              Xóa thẻ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
