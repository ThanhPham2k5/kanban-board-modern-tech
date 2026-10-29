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
import { ChecklistSection } from "../checklist/ChecklistSection";
import { toast } from "../ui/toast";

interface CardItemProps {
  card: CardWithChecklists;
  onCardDeleted: (cardId: string) => void;
  onCardUpdated: (updatedCard: CardWithChecklists) => void;
  onCardDeleteFailed: (restoredCard: CardWithChecklists) => void;
  onMove: (direction: "up" | "down") => void;
  onMoveAcrossLists: (cardId: string, direction: "left" | "right") => void;
  isFocused: string | null;
}

export function CardItem({
  card,
  onCardDeleted,
  onCardUpdated,
  onCardDeleteFailed,
  onMove,
  onMoveAcrossLists,
  isFocused,
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
    if (isFocused === card.id && dragHandleRef.current) {
      if (document.activeElement !== dragHandleRef.current) {
        dragHandleRef.current.focus();
      }
    }
  }, [card.id, isFocused]);

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
    toast.add({
      title: "Cập nhật trạng thái card thành công!",
      description: "Cập nhật trạng thái card thành công.",
      type: "success",
    });
    try {
      await updateCard(card.id, { is_completed: checked });
    } catch {
      console.error("Cập nhật trạng thái hoàn thành thất bại");
      onCardUpdated({ ...card, is_completed: previousState });
      toast.add({
        title: "Cập nhật trạng thái card thất bại!",
        description: "Cập nhật trạng thái card thất bại.",
        type: "error",
      });
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
      toast.add({
        title: "Sửa tiêu đề card thành công!",
        description: "Sửa tiêu đề card thành công.",
        type: "success",
      });
    } catch {
      console.error("Cập nhật tiêu đề thất bại");
      setTitleInput(previousTitle);
      onCardUpdated({ ...card, title: previousTitle });
      toast.add({
        title: "Sửa tiêu đề card thất bại!",
        description: "Sửa tiêu đề card thất bại.",
        type: "error",
      });
    }
  }

  async function handleUpdateDescription() {
    if (description === (card.description || "")) return;

    const previousDescription = card.description;
    onCardUpdated({ ...card, description });

    try {
      await updateCard(card.id, { description });
      toast.add({
        title: "Sửa mô tả card thành công!",
        description: "Sửa mô tả card thành công.",
        type: "success",
      });
    } catch {
      console.error("Cập nhật mô tả thất bại");
      setDescription(previousDescription || "");
      onCardUpdated({ ...card, description: previousDescription });
      toast.add({
        title: "Sửa mô tả card thất bại!",
        description: "Sửa mô tả card thất bại.",
        type: "error",
      });
    }
  }

  async function handleDeleteCard() {
    const cardToRestore = card;
    onCardDeleted(card.id);
    setIsOpenModal(false);
    try {
      await deleteCard(card.id);
      toast.add({
        title: "Xóa card thành công!",
        description: "Xóa card thành công.",
        type: "success",
      });
    } catch {
      console.error("Xóa card thất bại");
      onCardDeleteFailed(cardToRestore);
      toast.add({
        title: "Xóa card thất bại!",
        description: "Xóa card thất bại.",
        type: "error",
      });
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
        className={`relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group py-2.5 px-3 ${
          isDragging ? "opacity-30" : "opacity-100"
        }`}
      >
        {closestEdge === "top" && (
          <div className="absolute -top-px left-1 right-1 h-0 border-t-2 border-primary z-20 pointer-events-none" />
        )}

        {closestEdge === "bottom" && (
          <div className="absolute -bottom-px left-1 right-1 h-0 border-t-2 border-primary z-20 pointer-events-none" />
        )}

        <CardHeader className="p-0">
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
                onKeyDown={(e) => {
                  if (e.altKey) {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      onMove("up");
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      onMove("down");
                    } else if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      onMoveAcrossLists(card.id, "left");
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      onMoveAcrossLists(card.id, "right");
                    }
                  }
                }}
                type="button"
                aria-label="Kéo sắp xếp thẻ"
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-1 rounded-sm hover:bg-muted/70 transition-colors shrink-0"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <CardTitle
                className={`text-sm font-semibold truncate pt-0.5 ${
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
                          e.stopPropagation();
                          setTitleInput(card.title);
                          setIsEditingTitle(false);
                        }
                      }}
                      className="w-full text-base font-bold h-9 px-2 bg-background shadow-inner"
                    />
                  ) : (
                    <DialogTitle
                      onClick={() => setIsEditingTitle(true)}
                      className={`w-full text-base font-bold truncate cursor-pointer py-1 px-1.5 rounded-md transition-colors hover:bg-muted/60 ${
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
                aria-label="Xóa thẻ"
                onClick={handleDeleteCard}
                className="gap-1.5 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-2">
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
