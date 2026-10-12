"use client";

import { CardWithChecklists, ListWithCards } from "@/lib/definitions";
import { useState } from "react";
import { CardSection } from "./CardSection";

interface ListSectionMockProps {
  initialLists: ListWithCards[];
}

export function ListSectionMock({ initialLists }: ListSectionMockProps) {
  const [lists, setLists] = useState<ListWithCards[]>(initialLists);

  function handleCardsChange(
    listId: string,
    updatedCards: CardWithChecklists[],
  ) {
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId ? { ...list, cards: updatedCards } : list,
      ),
    );
  }

  function handleCardMoveAcrossLists(
    sourceCardId: string,
    targetListId: string,
    newOrder: string,
    targetIndex: number,
  ) {
    setLists((prevLists) => {
      let movedCard: CardWithChecklists | null = null;

      const listsWithoutCard = prevLists.map((list) => {
        const found = list.cards.find((c) => c.id === sourceCardId);
        if (found) {
          movedCard = { ...found, list_id: targetListId, order: newOrder };
          return {
            ...list,
            cards: list.cards.filter((c) => c.id !== sourceCardId),
          };
        }
        return list;
      });

      if (!movedCard) return prevLists;

      return listsWithoutCard.map((list) => {
        if (list.id === targetListId) {
          const newCards = [...list.cards];

          newCards.splice(targetIndex, 0, movedCard!);

          return { ...list, cards: newCards };
        }
        return list;
      });
    });
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg text-sm text-muted-foreground">
        Chưa có danh sách (List) nào.
      </div>
    );
  }

  return (
    <div className="flex items-start gap-6 overflow-x-auto pb-6">
      {lists.map((list) => (
        <div
          key={list.id}
          className="w-80 shrink-0 bg-muted/40 border rounded-xl p-4 flex flex-col gap-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm tracking-tight text-foreground">
              {list.title}
            </h2>
          </div>

          <CardSection
            listId={list.id}
            cards={list.cards}
            onChange={(updatedCards) =>
              handleCardsChange(list.id, updatedCards)
            }
            onCardMoveAcrossLists={handleCardMoveAcrossLists}
          />
        </div>
      ))}
    </div>
  );
}
