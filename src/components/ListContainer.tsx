"use client";

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
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { generateKeyBetween } from "fractional-indexing";

import CardItem from "./CardItem";
import CardModal from "./CardModal";

import {
  addCardAction,
  updateCardTitleAction,
  updateCardDescriptionAction,
  toggleCardCompleteAction,
  deleteCardAction,
} from "@/actions/card-actions";

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU CHUẨN CHO CARD ĐỂ KHÔNG BỊ LỖI 'ANY'
export interface CardType {
  id: string;
  title: string;
  list_id: string;
  order: string;
  is_completed?: boolean;
  description?: string;
}

// 2. DÙNG CardType THAY THẾ CHO any[]
interface ListProps {
  list: { id: string; title: string; order: string };
  cards: CardType[];
  setCards: React.Dispatch<React.SetStateAction<CardType[]>>; 
  onUpdateTitle: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function ListContainer({
  list,
  cards = [],
  setCards,
  onUpdateTitle,
  onDelete,
}: ListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  // 3. DÙNG CardType CHO MODAL
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

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

  const handleAddCardSubmit = async () => {
    if (!newCardTitle.trim()) return;
    const title = newCardTitle.trim();

    const sortedCards = [...cards].sort((a, b) => (a.order < b.order ? -1 : 1));
    const lastCard = sortedCards[sortedCards.length - 1];
    const newOrder = generateKeyBetween(lastCard ? lastCard.order : null, null);

    const tempId = crypto.randomUUID();
    const tempCard: CardType = {
      id: tempId,
      title,
      list_id: list.id,
      order: newOrder,
      is_completed: false,
      description: "",
    };

    setCards((prev) => [...prev, tempCard]);
    setNewCardTitle("");
    setIsAddingCard(false);

    try {
      const savedCard = await addCardAction(list.id, title, newOrder);
      setCards((prev) =>
        prev.map((c) => (c.id === tempId ? { ...c, id: savedCard.id } : c))
      );
    } catch (error) {
      setCards((prev) => prev.filter((c) => c.id !== tempId));
      console.error("Lỗi khi thêm card:", error);
    }
  };

  const toggleCardComplete = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_completed: newStatus } : c))
    );
    if (selectedCard?.id === id) {
      setSelectedCard((prev) => (prev ? { ...prev, is_completed: newStatus } : null));
    }
    await toggleCardCompleteAction(id, newStatus).catch(console.error);
  };

  const updateCardTitle = async (id: string, newTitle: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    if (selectedCard?.id === id) {
      setSelectedCard((prev) => (prev ? { ...prev, title: newTitle } : null));
    }
    await updateCardTitleAction(id, newTitle).catch(console.error);
  };

  const updateCardDescription = async (id: string, newDesc: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, description: newDesc } : c))
    );
    if (selectedCard?.id === id) {
      setSelectedCard((prev) => (prev ? { ...prev, description: newDesc } : null));
    }
    await updateCardDescriptionAction(id, newDesc).catch(console.error);
  };

  const deleteCard = async (id: string) => {
    if (confirm("Bạn có chắc muốn xoá thẻ này?")) {
      setCards((prev) => prev.filter((c) => c.id !== id));
      setSelectedCard(null);
      await deleteCardAction(id).catch(console.error);
    }
  };

  return (
    <div
      ref={listRef}
      className={`relative shrink-0 w-80 max-h-full flex flex-col bg-muted/50 rounded-xl border transition-all ${
        isDragging ? "opacity-40 shadow-xl scale-[0.98]" : "opacity-100 shadow-sm"
      }`}
    >
      {closestEdge && (
        <div
          className={`absolute top-0 bottom-0 z-50 pointer-events-none flex flex-col items-center ${
            closestEdge === "left" ? "-left-[9px]" : "-right-[9px]"
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm" />
          <div className="w-[3px] bg-primary h-full shadow-sm rounded-b-full" />
        </div>
      )}

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
            onOpenCard={(c) => setSelectedCard(c)}
            onToggleComplete={toggleCardComplete}
          />
        ))}
      </div>

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
              <Button size="sm" onClick={handleAddCardSubmit}>
                Thêm
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsAddingCard(false)}
              >
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

      <CardModal
        card={selectedCard}
        listTitle={list.title}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        onToggleComplete={toggleCardComplete}
        onDeleteCard={deleteCard}
        onUpdateDescription={updateCardDescription}
        onUpdateTitle={updateCardTitle}
      />
    </div>
  );
}