"use client";

import { X, AlignLeft, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface CardModalProps {
  card: { 
    id: string; 
    title: string; 
    list_id: string; 
    order: string; 
    isCompleted?: boolean;
    description?: string;
  } | null;
  listTitle?: string; // Thêm prop để nhận tên danh sách
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDeleteCard: (id: string) => void;
  onUpdateDescription: (id: string, newDesc: string) => void;
}

export default function CardModal({ 
  card, 
  listTitle, 
  isOpen, 
  onClose,
  onToggleComplete,
  onDeleteCard,
  onUpdateDescription
}: CardModalProps) {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-background p-6 shadow-lg border">
        
        {/* Nút Đóng */}
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        {/* Tiêu đề thẻ */}
        <div className="mb-6 pr-8">
          <h2 className="text-xl font-bold">{card.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Nằm trong danh sách <span className="font-semibold underline">{listTitle}</span>
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
              placeholder="Thêm mô tả chi tiết... (Gõ xong nhấn chuột ra ngoài để lưu)"
              defaultValue={card.description || ""}
              // Sự kiện onBlur: Lưu mô tả khi người dùng click chuột ra ngoài ô nhập
              onBlur={(e) => onUpdateDescription(card.id, e.target.value)}
            />
          </div>

          {/* Cột phải: Các nút hành động */}
          <div className="space-y-2 sm:border-l sm:pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Hành động</p>
            
            <Button 
              variant={card.isCompleted ? "secondary" : "outline"} 
              size="sm" 
              className="w-full justify-start"
              onClick={() => {
                onToggleComplete(card.id, !!card.isCompleted);
                onClose(); // Bấm xong thì đóng modal hoặc bỏ dòng này nếu muốn giữ modal mở
              }}
            >
              <CheckCircle2 className={`h-4 w-4 mr-2 ${card.isCompleted ? "text-green-600" : ""}`} />
              {card.isCompleted ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onDeleteCard(card.id);
                onClose(); // Xóa xong phải đóng modal
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