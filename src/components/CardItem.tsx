"use client";

import { useEffect, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge, Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";

// Import đúng bộ Card từ hệ thống UI mới
import { Card as UiCard, CardContent as UiCardContent } from "@/components/ui/card";

interface CardProps {
  card: { id: string; title: string; list_id: string; order: string; isCompleted?: boolean };
  onToggleCompleted?: (id: string, status: boolean) => void;
  onOpenCard: (card: { id: string; title: string; list_id: string; order: string; isCompleted?: boolean }) => void;
}

export default function CardItem({ card, onToggleCompleted, onOpenCard }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const cleanupDrop = dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          { id: card.id, type: "card", listId: card.list_id },
          { input, element, allowedEdges: ["top", "bottom"] }
        );
      },
      onDragEnter: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDrag: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDragLeave: () => setClosestEdge(null),
      onDrop: () => setClosestEdge(null),
    });

    const cleanupDrag = draggable({
      element: el,
      // ĐÃ XÓA dragHandle: Toàn bộ element (el) giờ đây đều có thể dùng để kéo
      getInitialData: () => ({ id: card.id, type: "card", listId: card.list_id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDrop();
      cleanupDrag();
    };
  }, [card.id, card.list_id]);

  return (
    <div ref={cardRef} className="relative">
      <UiCard
        size="sm"  
        onClick={() => onOpenCard(card)}
        className={`group touch-none cursor-grab active:cursor-grabbing transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
          isDragging ? "opacity-40" : "opacity-100"
        } ${card.isCompleted ? "bg-muted/40 opacity-60" : ""}`}
      >
        <UiCardContent className="flex items-start gap-2 pt-3">
          <input 
            type="checkbox"
            checked={card.isCompleted}
            onChange={(e) => onToggleCompleted?.(card.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()} // Chặn sự kiện click để không bị mở Modal khi bấm checkbox
            className="mt-1 shrink-0 cursor-pointer w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className={`text-sm leading-snug text-foreground ${card.isCompleted ? "text-muted-foreground line-through" : ""}`}>
              {card.title}
            </p>

            {/* DIV CHECKLIST */}
            <div id={`checklist-placeholder-${card.id}`} className="mt-2"></div>
          </div>
        </UiCardContent>
      </UiCard>

      {closestEdge && <DropIndicator edge={closestEdge} gap="8px" />}
    </div>
  );
}