"use client";

import { useEffect, useRef, useState } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge, Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";

import { Card as UiCard, CardContent as UiCardContent } from "@/components/ui/card";

interface CardProps {
  card: { id: string; title: string; list_id: string; order: string; is_completed?: boolean };
  
  onToggleComplete?: (id: string, status: boolean) => void; 
  onOpenCard: (card: { id: string; title: string; list_id: string; order: string; is_completed?: boolean }) => void;
}

export default function CardItem({ card, onToggleComplete, onOpenCard }: CardProps) { 
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
        } ${card.is_completed ? "bg-muted/40 opacity-60" : ""}`}
      >
        <UiCardContent className="flex items-start gap-2 pt-3">
          <input
            type="checkbox"
            checked={!!card.is_completed} 
            onChange={() => { 
              onToggleComplete?.(card.id, !!card.is_completed); 
            }}
            onClick={(e) => {
              e.stopPropagation(); 
            }}
            className="mt-1 h-4 w-4 cursor-pointer"
          />

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className={`text-sm leading-snug text-foreground ${card.is_completed ? "text-muted-foreground line-through" : ""}`}>
              {card.title}
            </p>

            
          </div>
        </UiCardContent>
      </UiCard>

      {closestEdge && <DropIndicator edge={closestEdge} gap="8px" />}
    </div>
  );
}