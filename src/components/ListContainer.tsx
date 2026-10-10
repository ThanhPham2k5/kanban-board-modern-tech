"use client";

import CardItem from "./CardItem";
import { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  extractClosestEdge,
  Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { Button } from "@/components/ui/button"; 
import { Plus, Trash2, X } from "lucide-react";

interface ListProps {
  list: { id: string; title: string; order: string };
  cards?: { id: string; title: string; list_id: string; order: string; isCompleted?: boolean }[]; 
  onUpdateTitle: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onOpenCard: (card: { id: string; title: string; list_id: string; order: string; isCompleted?: boolean }) => void;
  // Thêm prop này để báo cho BoardView biết có thẻ mới
  onAddCard?: (listId: string, title: string) => void; 
  onToggleComplete: (id: string, isCompleted: boolean) => void;
}

export default function ListContainer({
  list,
  cards = [], 
  onUpdateTitle,
  onDelete,
  onOpenCard, 
  onAddCard,
  onToggleComplete,
}: ListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);

  // Thêm state để quản lý form tạo thẻ mới
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  useEffect(() => {
    const li = listRef.current;
    const handle = dragHandleRef.current;
    if (!li || !handle) return;

    const cleanupDrop = dropTargetForElements({
      element: li,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          { id: list.id, type: "list" },
          { input, element, allowedEdges: ["left", "right"] },
        );
      },
      onDragEnter: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDrag: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDragLeave: () => setClosestEdge(null),
      onDrop: () => setClosestEdge(null),
    });

    const cleanupDrag = draggable({
      element: li,
      dragHandle: handle, 
      getInitialData: () => ({ id: list.id, type: "list" }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDrop();
      cleanupDrag();
    };
  }, [list.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onUpdateTitle(list.id, editTitle);
      setIsEditing(false);
    }
  };

  // Hàm xử lý lưu thẻ mới
  const handleAddCardSubmit = () => {
    if (newCardTitle.trim() && onAddCard) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle(""); // Xóa rỗng input
      setIsAddingCard(false); // Đóng form
    }
  };

  return (
    <div
      ref={listRef}
      className={`relative shrink-0 w-80 max-h-full flex flex-col bg-muted/50 rounded-xl border transition-all ${isDragging ? "opacity-40 shadow-xl scale-[0.98]" : "opacity-100 shadow-sm"}`}
    >
      {closestEdge && <DropIndicator edge={closestEdge} gap="16px" />}

      <div
        ref={dragHandleRef}
        className="p-3 pb-2 flex justify-between items-center cursor-grab active:cursor-grabbing group"
      >
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              onUpdateTitle(list.id, editTitle);
              setIsEditing(false);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm font-semibold border-2 border-primary rounded-md outline-none bg-background"
          />
        ) : (
          <h3
            onClick={() => setIsEditing(true)}
            className="font-semibold text-sm flex-1 px-2 py-1 rounded-md hover:bg-black/5 cursor-text"
            title="Nhấn để sửa tên"
          >
            {list.title}
          </h3>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(list.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-2 min-h-[10px]">
        {cards.map((card) => (
          <CardItem 
            key={card.id} 
            card={card} 
            onOpenCard={onOpenCard} 
            onToggleComplete={onToggleComplete} 
          />
        ))}
      </div>

      {/* Khu vực thêm thẻ đã được cải tiến */}
      <div className="p-2 pt-1">
        {isAddingCard ? (
          <div className="flex flex-col gap-2 bg-background p-2 rounded-md border shadow-sm">
            <textarea
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCardSubmit();
                }
              }}
              placeholder="Nhập tiêu đề thẻ..."
              className="w-full text-sm resize-none outline-none bg-transparent"
              rows={2}
            />
            <div className="flex items-center gap-1">
              <Button size="sm" onClick={handleAddCardSubmit}>Thêm</Button>
              <Button size="icon" variant="ghost" onClick={() => setIsAddingCard(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsAddingCard(true)}
            className="w-full justify-start text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm thẻ
          </Button>
        )}
      </div>
    </div>
  );
}