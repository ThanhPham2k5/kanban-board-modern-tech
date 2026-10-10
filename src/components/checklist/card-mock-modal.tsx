"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  CardWithChecklists,
  ChecklistWithItems,
} from "../../../src/app/lib/definitions";
import { ChecklistSection } from "./checklist-section";

interface CardMockModalProps {
  initialCards: CardWithChecklists[];
}

export function CardMockModal({ initialCards }: CardMockModalProps) {
  const [cards, setCards] = useState<CardWithChecklists[]>(initialCards);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const activeCard = cards.find((c) => c.id === selectedCardId) ?? null;

  function handleChecklistsChange(
    cardId: string,
    updatedChecklists: ChecklistWithItems[],
  ) {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, checklists: updatedChecklists } : card,
      ),
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg text-sm text-muted-foreground">
        Chưa có thẻ nào trong cơ sở dữ liệu Supabase. Hãy tạo ít nhất 1 card để
        thử nghiệm.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const allItems = card.checklists.flatMap((cl) => cl.items);
          const completedCount = allItems.filter((i) => i.is_checked).length;

          return (
            <Card
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors pt-1">
                    {card.title}
                  </CardTitle>
                  {allItems.length > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      ✓ {completedCount}/{allItems.length}
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {card.description || "Không có mô tả"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <p className="font-mono text-[11px] text-muted-foreground truncate">
                  ID: {card.id}
                </p>
                <span className="text-[11px] text-slate-500 font-medium">
                  {card.checklists.length} checklist
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={Boolean(selectedCardId)}
        onOpenChange={(open) => !open && setSelectedCardId(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {activeCard && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {activeCard.title}
                </DialogTitle>
                <DialogDescription>
                  Card ID:{" "}
                  <code className="font-mono text-xs">{activeCard.id}</code>
                </DialogDescription>
              </DialogHeader>

              <div className="pt-2">
                <ChecklistSection
                  key={activeCard.id}
                  cardId={activeCard.id}
                  checklists={activeCard.checklists}
                  onChange={(newChecklists) =>
                    handleChecklistsChange(activeCard.id, newChecklists)
                  }
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
