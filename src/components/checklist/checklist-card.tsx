"use client";

import {
  createChecklistItem,
  deleteChecklist,
  updateChecklist,
} from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { generateKeyBetween } from "fractional-indexing";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ChecklistItem,
  ChecklistWithItems,
} from "../../../src/app/lib/definitions";
import { ChecklistItemRow } from "./checklist-item-row";

interface ChecklistCardProps {
  checklist: ChecklistWithItems;
  onChecklistDeleted: (checklistId: string) => void;
  onChecklistUpdated: (updatedChecklist: ChecklistWithItems) => void;
}

export function ChecklistCard({
  checklist,
  onChecklistDeleted,
  onChecklistUpdated,
}: ChecklistCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(checklist.title);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = checklist.items || [];
  const total = items.length;
  const completed = items.filter((it) => it.is_checked).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [isItemOverEmptyList, setIsItemOverEmptyList] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    const handleEl = dragHandleRef.current;
    if (!el || !handleEl) return;

    const unbindDraggable = draggable({
      element: el,
      dragHandle: handleEl as unknown as HTMLElement,
      getInitialData: () => ({
        type: "checklist",
        checklistId: checklist.id,
        order: checklist.order,
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
      canDrop: ({ source }) =>
        source.data.type === "checklist" ||
        source.data.type === "checklist-item",
      getData: ({ input }) => {
        return attachClosestEdge(
          {
            type: "checklist",
            checklistId: checklist.id,
            order: checklist.order,
          },
          {
            element: el,
            input,
            allowedEdges: ["top", "bottom"],
          },
        );
      },
      onDragEnter: ({ source, self }) => {
        if (source.data.type === "checklist") {
          setClosestEdge(extractClosestEdge(self.data));
        } else if (
          source.data.type === "checklist-item" &&
          items.length === 0
        ) {
          setIsItemOverEmptyList(true);
        }
      },
      onDrag: ({ source, self }) => {
        if (source.data.type === "checklist") {
          setClosestEdge(extractClosestEdge(self.data));
        }
      },
      onDragLeave: () => {
        setClosestEdge(null);
        setIsItemOverEmptyList(false);
      },
      onDrop: () => {
        setClosestEdge(null);
        setIsItemOverEmptyList(false);
      },
    });

    return () => {
      unbindDraggable();
      unbindDropTarget();
    };
  }, [checklist.id, checklist.order, items.length]);

  async function handleSaveTitle() {
    const trimmed = titleValue.trim();
    setIsEditingTitle(false);

    if (!trimmed || trimmed === checklist.title) {
      setTitleValue(checklist.title);
      return;
    }

    onChecklistUpdated({ ...checklist, title: trimmed });

    try {
      await updateChecklist(checklist.id, trimmed);
    } catch {
      setTitleValue(checklist.title);
      onChecklistUpdated({ ...checklist, title: checklist.title });
      console.error("Cập nhật tiêu đề thất bại");
    }
  }

  function handleKeyDownTitle(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setTitleValue(checklist.title);
      setIsEditingTitle(false);
    }
  }

  function handleItemUpdated(updatedItem: ChecklistItem) {
    const nextItems = items.map((it) =>
      it.id === updatedItem.id ? updatedItem : it,
    );
    onChecklistUpdated({ ...checklist, items: nextItems });
  }

  function handleItemDeleted(deletedId: string) {
    const nextItems = items.filter((it) => it.id !== deletedId);
    onChecklistUpdated({ ...checklist, items: nextItems });
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const content = newItemText.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const lastItem = items[items.length - 1];
      const nextOrder = generateKeyBetween(
        lastItem ? lastItem.order : null,
        null,
      );

      const created = await createChecklistItem({
        checklist_id: checklist.id,
        content,
        is_checked: false,
        order: nextOrder,
      });

      onChecklistUpdated({
        ...checklist,
        items: [...items, created],
      });

      setNewItemText("");
      setIsAddingItem(false);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteChecklist() {
    onChecklistDeleted(checklist.id);
    try {
      await deleteChecklist(checklist.id);
    } catch {
      console.error("Xóa checklist thất bại");
    }
  }

  return (
    <div
      ref={cardRef}
      className={`relative rounded-lg border bg-card p-4 text-card-foreground shadow-sm flex flex-col gap-4 transition-all ${
        isDragging ? "opacity-30" : "opacity-100"
      } ${isItemOverEmptyList ? "ring-2 ring-primary/60 bg-muted/20" : ""}`}
    >
      {closestEdge === "top" && (
        <div className="absolute -top-0.5 left-1 right-1 h-0 border-t-2 border-primary z-30 pointer-events-none" />
      )}
      {closestEdge === "bottom" && (
        <div className="absolute -bottom-0.5 left-1 right-1 h-0 border-t-2 border-primary z-30 pointer-events-none" />
      )}

      <div className="flex items-center justify-between gap-2.5 py-1">
        <button
          ref={dragHandleRef}
          type="button"
          aria-label="Kéo để sắp xếp danh sách"
          className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-1 rounded-sm hover:bg-muted/70 transition-colors shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <Input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDownTitle}
              className="h-8 w-full text-sm font-semibold px-2.5 py-0 bg-background"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="block w-full text-sm font-semibold cursor-pointer select-none truncate px-2.5 py-1 rounded-md transition-colors hover:bg-muted/70 text-foreground"
              title="Bấm để đổi tiêu đề"
            >
              {checklist.title}
            </h3>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
          onClick={handleDeleteChecklist}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tiến độ</span>
          <span>{percent}%</span>
        </div>
        <Progress value={percent} className="h-2" />
      </div>

      <div className="space-y-2 min-h-2">
        {items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onItemUpdated={handleItemUpdated}
            onItemDeleted={handleItemDeleted}
          />
        ))}
      </div>

      {isAddingItem ? (
        <form onSubmit={handleAddItem} className="space-y-2 pt-1">
          <Input
            autoFocus
            placeholder="Thêm một mục công việc..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Đang thêm..." : "Thêm"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingItem(false);
                setNewItemText("");
              }}
            >
              Hủy
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs text-muted-foreground justify-start gap-1.5"
          onClick={() => setIsAddingItem(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Thêm một mục
        </Button>
      )}
    </div>
  );
}
