"use client";

import { createCard, updateCardOrder } from "@/actions/card-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardWithChecklists } from "@/lib/definitions";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import {
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { generateKeyBetween } from "fractional-indexing";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "../ui/toast";
import { CardItem } from "./CardItem";

interface CardSectionProps {
  listId: string;
  cards: CardWithChecklists[];
  onChange: (updatedCards: CardWithChecklists[]) => void;
  onCardMoveAcrossLists: (
    sourceCardId: string,
    targetListId: string,
    newOrder: string,
    targetIndex: number,
  ) => void;
  onMoveAcrossLists: (cardId: string, direction: "left" | "right") => void;
  isFocused: string | null;
}

export function CardSection({
  listId,
  cards,
  onChange,
  onCardMoveAcrossLists,
  onMoveAcrossLists,
  isFocused,
}: CardSectionProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef(cards);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => source.data.type === "card",
      getData: () => ({ type: "card-section", listId }),
      onDragEnter: () => {
        if (cards.length === 0) {
          setIsDraggedOver(true);
        }
      },
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: () => setIsDraggedOver(false),
    });
  }, [cards.length, listId]);

  useEffect(() => {
    return monitorForElements({
      async onDrop({ source, location }) {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const currentCards = cardsRef.current;
        const sourceType = source.data.type as string;
        const targetType = target.data.type as string;

        if (sourceType === "card") {
          const sourceCardId = source.data.cardId as string;
          const sourceListId = source.data.listId as string;

          if (sourceListId === listId && targetType === "card") {
            const targetCardId = target.data.cardId as string;
            if (sourceCardId === targetCardId) return;

            const sourceIndex = currentCards.findIndex(
              (c) => c.id === sourceCardId,
            );
            const targetIndex = currentCards.findIndex(
              (c) => c.id === targetCardId,
            );
            if (sourceIndex === -1 || targetIndex === -1) return;

            const remainingCards = currentCards.filter(
              (c) => c.id !== sourceCardId,
            );
            const adjustedTargetIndex = remainingCards.findIndex(
              (c) => c.id === targetCardId,
            );

            const edge = extractClosestEdge(target.data) as Edge | null;
            const insertIndex =
              edge === "bottom" ? adjustedTargetIndex + 1 : adjustedTargetIndex;

            const prevCard = remainingCards[insertIndex - 1];
            const nextCard = remainingCards[insertIndex];
            const newOrder = generateKeyBetween(
              prevCard?.order ?? null,
              nextCard?.order ?? null,
            );

            const sourceCard = currentCards[sourceIndex];
            const updatedCard = { ...sourceCard, order: newOrder };
            const nextCards = [...remainingCards];
            nextCards.splice(insertIndex, 0, updatedCard);

            onChange(nextCards);

            try {
              await updateCardOrder(sourceCardId, newOrder);
            } catch {
              console.error("Cập nhật vị trí card thất bại");
              onChange(currentCards);
            }
          } else if (sourceListId !== listId) {
            const isTargetInThisList =
              targetType === "card" && target.data.listId === listId;
            const isTargetSectionEmptyList =
              targetType === "card-section" && target.data.listId === listId;

            if (isTargetInThisList || isTargetSectionEmptyList) {
              let insertIndex = currentCards.length;

              if (isTargetInThisList) {
                const targetCardId = target.data.cardId as string;
                const targetIndex = currentCards.findIndex(
                  (c) => c.id === targetCardId,
                );
                if (targetIndex === -1) return;

                const edge = extractClosestEdge(target.data) as Edge | null;
                insertIndex = edge === "bottom" ? targetIndex + 1 : targetIndex;
              }

              const prevCard = currentCards[insertIndex - 1];
              const nextCard = currentCards[insertIndex];
              const newOrder = generateKeyBetween(
                prevCard?.order ?? null,
                nextCard?.order ?? null,
              );

              if (onCardMoveAcrossLists) {
                onCardMoveAcrossLists(
                  sourceCardId,
                  listId,
                  newOrder,
                  insertIndex,
                );
              }

              try {
                await updateCardOrder(sourceCardId, newOrder, listId);
              } catch {
                console.error("Di chuyển card sang list khác thất bại");
              }
            }
          }
        }
      },
    });
  }, [onChange, listId, onCardMoveAcrossLists]);

  async function handleMoveCardInside(
    cardId: string,
    direction: "up" | "down",
  ) {
    const currentCards = cardsRef.current;
    const index = currentCards.findIndex((c) => c.id === cardId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentCards.length) return;

    const newCards = [...currentCards];
    const [movedCard] = newCards.splice(index, 1);
    newCards.splice(targetIndex, 0, movedCard);

    const prevCard = newCards[targetIndex - 1];
    const nextCard = newCards[targetIndex + 1];
    const newOrder = generateKeyBetween(
      prevCard?.order ?? null,
      nextCard?.order ?? null,
    );

    const updatedCard = { ...movedCard, order: newOrder };
    newCards[targetIndex] = updatedCard;

    onChange(newCards);

    try {
      await updateCardOrder(cardId, newOrder);
    } catch {
      console.error("Cập nhật vị trí card thất bại");
      onChange(currentCards);
    }
  }

  async function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const previousCards = [...cards];
    const lastCard = cards[cards.length - 1];
    const nextOrder = generateKeyBetween(
      lastCard ? lastCard.order : null,
      null,
    );
    const tempId = `temp-card-${Date.now()}`;
    const newCard: CardWithChecklists = {
      id: tempId,
      list_id: listId,
      title,
      description: undefined,
      is_completed: false,
      order: nextOrder,
      checklists: [],
    };

    const updatedCards = [...cards, newCard];
    onChange(updatedCards);
    setNewTitle("");
    setIsAddingCard(false);

    try {
      const created = await createCard({
        list_id: listId,
        title,
        order: nextOrder,
        is_completed: false,
      });

      const finalCards = updatedCards.map((c) =>
        c.id === tempId ? { ...created, checklists: c.checklists } : c,
      );
      onChange(finalCards);

      toast.add({
        title: "Tạo thẻ mới thành công!",
        description: "Đã tạo thẻ mới thành công.",
        type: "success",
      });
    } catch {
      console.error("Thêm mới card thất bại");
      onChange(previousCards);
      setNewTitle(title);
      setIsAddingCard(true);
      toast.add({
        title: "Tạo thẻ thất bại!",
        description: "Tạo thẻ mới thất bại.",
        type: "error",
      });
    }
  }

  function handleCardDeleted(deletedId: string) {
    onChange(cards.filter((c) => c.id !== deletedId));
  }

  function handleCardDeleteFailed(restoredCard: CardWithChecklists) {
    const restoredCards = [...cards, restoredCard].sort((a, b) =>
      (a.order ?? "").localeCompare(b.order ?? ""),
    );
    onChange(restoredCards);
  }

  function handleCardUpdated(updatedCard: CardWithChecklists) {
    onChange(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  }

  return (
    <div
      ref={sectionRef}
      className={`flex flex-col transition-all rounded-xl p-2 -m-2 ${
        cards.length > 0 ? "gap-3" : ""
      } ${
        isDraggedOver
          ? "ring-2 ring-primary/60 bg-muted/25 rounded-xl"
          : "rounded-xl"
      }`}
    >
      <div className="grid grid-cols-1 gap-3">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onCardDeleted={handleCardDeleted}
            onCardUpdated={handleCardUpdated}
            onCardDeleteFailed={handleCardDeleteFailed}
            onMove={(direction: "up" | "down") =>
              handleMoveCardInside(card.id, direction)
            }
            onMoveAcrossLists={onMoveAcrossLists}
            isFocused={isFocused}
          />
        ))}
      </div>

      <div>
        {isAddingCard ? (
          <form onSubmit={handleCreateCard} className="flex gap-2">
            <Input
              autoFocus
              placeholder="Nhập tiêu đề thẻ công việc..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button type="submit">Thêm thẻ</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddingCard(false);
                setNewTitle("");
              }}
            >
              Hủy
            </Button>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            aria-label="Thêm thẻ mới"
            onClick={() => setIsAddingCard(true)}
            className="w-full h-auto justify-start gap-2 px-4 py-1 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Plus className="h-4 w-4" /> Thêm thẻ mới
          </Button>
        )}
      </div>
    </div>
  );
}
