"use client";

import { Button } from "@/components/ui/button";
import { CardWithChecklists, ListWithCards } from "@/lib/definitions";
import {
  attachClosestEdge,
  Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CardSection } from "./card/CardSection";

interface ListProps {
  list: ListWithCards;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onMoveList?: (id: string, direction: "left" | "right") => void;
  onChange: (updatedList: ListWithCards) => void;
  handleCardMoveAcrossLists: (
    sourceCardId: string,
    targetListId: string,
    newOrder: string,
    targetIndex: number,
  ) => void;
  onMoveAcrossLists: (cardId: string, direction: "left" | "right") => void;
  isFocused: string | null;
}

export default function ListContainer({
  list,
  onUpdateTitle,
  onDelete,
  onMoveList,
  onChange,
  handleCardMoveAcrossLists,
  onMoveAcrossLists,
  isFocused,
}: ListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);

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
      onDragEnter: (args) => {
        if (args.source.data.type === "list")
          setClosestEdge(extractClosestEdge(args.self.data));
      },
      onDrag: (args) => {
        if (args.source.data.type === "list")
          setClosestEdge(extractClosestEdge(args.self.data));
      },
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

  // Move list using keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "ArrowLeft" && onMoveList) {
        e.preventDefault();
        onMoveList(list.id, "left");
      } else if (e.key === "ArrowRight" && onMoveList) {
        e.preventDefault();
        onMoveList(list.id, "right");
      }
    } else if (e.key === " ") {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  function handleCardsChange(updatedCards: CardWithChecklists[]) {
    onChange({ ...list, cards: updatedCards });
  }

  return (
    <div
      ref={listRef}
      data-testid="list-container"
      className={`relative shrink-0 w-80 max-h-full flex flex-col bg-secondary/80 backdrop-blur-xl rounded-xl border-border/50 transition-all duration-200 ${
        isDragging
          ? "opacity-60 shadow-2xl scale-[0.98] ring-2 ring-primary/50"
          : "opacity-100 shadow-sm"
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
        data-testid="list-drag-handle"
        tabIndex={0}
        role="button"
        aria-roledescription="sortable list"
        aria-label={`Danh sách ${list.title}. Nhấn Enter để sửa tên. Nhấn Control và mũi tên Trái Phải để di chuyển`}
        onKeyDown={handleKeyDown}
        className="p-3 pb-2 flex justify-between items-center cursor-grab active:cursor-grabbing group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-t-xl"
      >
        {isEditing ? (
          <input
            data-testid="list-title-input"
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            // mouse user
            onBlur={() => {
              onUpdateTitle(list.id, editTitle);
              setIsEditing(false);
            }}
            // keyboard user
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdateTitle(list.id, editTitle);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-2 py-1 text-sm font-semibold border-2 border-primary rounded-md outline-none bg-background"
          />
        ) : (
          <h3
            data-testid="list-title"
            onClick={() => setIsEditing(true)}
            className="font-semibold text-sm flex-1 px-2 py-1 rounded-md hover:bg-black/5 cursor-text"
            title="Nhấn để sửa tên"
          >
            {list.title}
          </h3>
        )}

        <Button
          data-testid="delete-list-btn"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(list.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 focus-visible:opacity-100 focus-visible:text-destructive transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-1 pb-4 flex flex-col gap-2 min-h-[10px]">
        <CardSection
          listId={list.id}
          cards={list.cards}
          onChange={handleCardsChange}
          onCardMoveAcrossLists={handleCardMoveAcrossLists}
          onMoveAcrossLists={onMoveAcrossLists}
          isFocused={isFocused}
        />
      </div>
    </div>
  );
}
