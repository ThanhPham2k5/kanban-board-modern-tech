"use client";

import { deleteCard, updateCard } from "@/actions/card-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardWithChecklists, ChecklistWithItems } from "@/lib/definitions";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChecklistSection } from "../checklist/checklist-section";

interface CardItemProps {
  card: CardWithChecklists;
  onCardDeleted: (cardId: string) => void;
  onCardUpdated: (updatedCard: CardWithChecklists) => void;
  onCardDeleteFailed: (restoredCard: CardWithChecklists) => void;
}

export function CardItem({
  card,
  onCardDeleted,
  onCardUpdated,
  onCardDeleteFailed,
}: CardItemProps) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [description, setDescription] = useState(card.description || "");

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(card.title);

  const allItems = card.checklists.flatMap((cl) => cl.items);
  const completedCount = allItems.filter((i) => i.is_checked).length;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    const handleEl = dragHandleRef.current;
    if (!el || !handleEl) return;

    const unbindDraggable = draggable({
      element: el,
      dragHandle: handleEl as unknown as HTMLElement,
      getInitialData: () => ({
        type: "card",
        cardId: card.id,
        listId: card.list_id,
        order: card.order,
      }),
      onGenerateDragPreview({ nativeSetDragImage }) {
        setCustomNativeDragPreview({
          render({ container }) {
            const preview = el.cloneNode(true) as HTMLElement;
            const rect = el.getBoundingClientRect();
            preview.style.width = `${rect.width}px`;
            preview.style.backgroundColor = "var(--card, #ffffff)";
            preview.style.border = "1px solid var(--border, #e2e8f0)";
            preview.style.borderRadius = "0.5rem";
            preview.style.boxShadow =
              "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
            preview.style.opacity = "0.95";
            preview.style.pointerEvents = "none";
            container.appendChild(preview);
          },
          nativeSetDragImage,
        });
      },
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const unbindDropTarget = dropTargetForElements({
      element: el,
      canDrop: ({ source }) => source.data.type === "card",
      getData: ({ input }) => {
        return attachClosestEdge(
          {
            type: "card",
            cardId: card.id,
            listId: card.list_id,
            order: card.order,
          },
          {
            element: el,
            input,
            allowedEdges: ["top", "bottom"],
          },
        );
      },
      onDragEnter: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
      onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
      onDragLeave: () => setClosestEdge(null),
      onDrop: () => setClosestEdge(null),
    });

    return () => {
      unbindDraggable();
      unbindDropTarget();
    };
  }, [card.id, card.list_id, card.order]);

  async function handleToggleComplete(checked: boolean) {
    const previousState = card.is_completed;
    onCardUpdated({ ...card, is_completed: checked });

    try {
      await updateCard(card.id, { is_completed: checked });
    } catch {
      console.error("Cập nhật trạng thái hoàn thành thất bại");
      onCardUpdated({ ...card, is_completed: previousState });
    }
  }

  async function handleUpdateTitle() {
    const trimmedTitle = titleInput.trim();
    if (!trimmedTitle || trimmedTitle === card.title) {
      setTitleInput(card.title);
      setIsEditingTitle(false);
      return;
    }

    const previousTitle = card.title;
    onCardUpdated({ ...card, title: trimmedTitle });
    setIsEditingTitle(false);

    try {
      await updateCard(card.id, { title: trimmedTitle });
    } catch {
      console.error("Cập nhật tiêu đề thất bại");
      setTitleInput(previousTitle);
      onCardUpdated({ ...card, title: previousTitle });
    }
  }

  async function handleUpdateDescription() {
    if (description === (card.description || "")) return;

    const previousDescription = card.description;
    onCardUpdated({ ...card, description });

    try {
      await updateCard(card.id, { description });
    } catch {
      console.error("Cập nhật mô tả thất bại");
      setDescription(previousDescription || "");
      onCardUpdated({ ...card, description: previousDescription });
    }
  }

  async function handleDeleteCard() {
    const cardToRestore = card;
    onCardDeleted(card.id);
    setIsOpenModal(false);
    try {
      await deleteCard(card.id);
    } catch {
      console.error("Xóa card thất bại");
      onCardDeleteFailed(cardToRestore);
    }
  }

  function handleChecklistsChange(updatedChecklists: ChecklistWithItems[]) {
    onCardUpdated({ ...card, checklists: updatedChecklists });
  }

  return (
    <>
      <Card
        ref={cardRef}
        onClick={() => setIsOpenModal(true)}
        className={`relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group ${
          isDragging ? "opacity-30" : "opacity-100"
        }`}
      >
        {closestEdge === "top" && (
          <div className="absolute -top-px left-1 right-1 h-0 border-t-2 border-primary z-20 pointer-events-none" />
        )}

        {closestEdge === "bottom" && (
          <div className="absolute -bottom-px left-1 right-1 h-0 border-t-2 border-primary z-20 pointer-events-none" />
        )}

        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={card.is_completed}
                  onCheckedChange={(checked) =>
                    handleToggleComplete(checked === true)
                  }
                />
              </div>

              <button
                ref={dragHandleRef}
                type="button"
                aria-label="Kéo sắp xếp thẻ"
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-1 rounded-sm hover:bg-muted/70 transition-colors shrink-0"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <CardTitle
                className={`text-base font-semibold truncate pt-0.5 ${
                  card.is_completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {card.title}
              </CardTitle>
            </div>

            {allItems.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium shrink-0">
                ✓ {completedCount}/{allItems.length}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 mr-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Checkbox
                  checked={card.is_completed}
                  onCheckedChange={(checked) =>
                    handleToggleComplete(checked === true)
                  }
                  className="h-5 w-5 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  {isEditingTitle ? (
                    <Input
                      autoFocus
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={handleUpdateTitle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdateTitle();
                        } else if (e.key === "Escape") {
                          setTitleInput(card.title);
                          setIsEditingTitle(false);
                        }
                      }}
                      className="w-full text-lg font-bold h-9 px-2 bg-background shadow-inner"
                    />
                  ) : (
                    <DialogTitle
                      onClick={() => setIsEditingTitle(true)}
                      className={`w-full text-xl font-bold truncate cursor-pointer py-1 px-1.5 rounded-md transition-colors hover:bg-muted/60 ${
                        card.is_completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                      title="Bấm để chỉnh sửa tiêu đề"
                    >
                      {card.title}
                    </DialogTitle>
                  )}
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteCard}
                className="gap-1.5 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-foreground">
              Mô tả chi tiết
            </label>
            <Textarea
              placeholder="Nhập mô tả cho thẻ này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleUpdateDescription}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="pt-4 border-t">
            <ChecklistSection
              key={card.id}
              cardId={card.id}
              checklists={card.checklists}
              onChange={handleChecklistsChange}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
