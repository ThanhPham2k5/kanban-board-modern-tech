"use client";

import {
  deleteChecklistItem,
  updateChecklistItem,
} from "@/actions/checklist-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { GripVertical, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChecklistItem } from "../../lib/definitions";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onItemUpdated: (updatedItem: ChecklistItem) => void;
  onItemDeleted: (itemId: string) => void;
  onItemDeleteFailed: (restoredItem: ChecklistItem) => void;
}

export function ChecklistItemRow({
  item,
  onItemUpdated,
  onItemDeleted,
  onItemDeleteFailed,
}: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [contentValue, setContentValue] = useState(item.content);

  const ref = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const el = ref.current;
    const dragHandle = handleRef.current;
    if (!el || !dragHandle) return;

    const unbindDraggable = draggable({
      element: el,
      dragHandle: dragHandle,
      getInitialData: () => ({
        type: "checklist-item",
        itemId: item.id,
        checklistId: item.checklist_id,
        order: item.order,
      }),
      onGenerateDragPreview({ nativeSetDragImage }) {
        setCustomNativeDragPreview({
          render({ container }) {
            const preview = el.cloneNode(true) as HTMLElement;
            const rect = el.getBoundingClientRect();
            preview.style.width = `${rect.width}px`;
            preview.style.backgroundColor = "var(--background, #ffffff)";
            preview.style.border = "1px solid var(--border, #e2e8f0)";
            preview.style.borderRadius = "0.375rem";
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
      canDrop: ({ source }) => source.data.type === "checklist-item",
      getData: ({ input }) => {
        return attachClosestEdge(
          {
            type: "checklist-item",
            itemId: item.id,
            checklistId: item.checklist_id,
            order: item.order,
          },
          {
            element: el,
            input,
            allowedEdges: ["top", "bottom"],
          },
        );
      },
      onDragEnter: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDrag: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDragLeave: () => setClosestEdge(null),
      onDrop: () => setClosestEdge(null),
    });

    return () => {
      unbindDraggable();
      unbindDropTarget();
    };
  }, [item.checklist_id, item.id, item.order]);

  async function handleToggle(checked: boolean) {
    onItemUpdated({ ...item, is_checked: checked });
    try {
      await updateChecklistItem(item.id, { is_checked: checked });
    } catch {
      console.error("Cập nhật checkbox thất bại");
      onItemUpdated({ ...item, is_checked: item.is_checked });
    }
  }

  async function handleSaveContent() {
    const trimmed = contentValue.trim();
    setIsEditing(false);

    if (!trimmed || trimmed === item.content) {
      setContentValue(item.content);
      return;
    }

    onItemUpdated({ ...item, content: trimmed });

    try {
      await updateChecklistItem(item.id, { content: trimmed });
    } catch {
      console.error("Cập nhật nội dung checklist item thất bại");
      setContentValue(item.content);
      onItemUpdated({ ...item, content: item.content });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setContentValue(item.content);
      setIsEditing(false);
    }
  }

  async function handleDelete() {
    const itemToRestore = item;
    onItemDeleted(item.id);
    try {
      await deleteChecklistItem(item.id);
    } catch {
      console.error("Xóa checklist item thất bại");
      onItemDeleteFailed(itemToRestore);
    }
  }

  return (
    <div
      ref={ref}
      className={`group relative flex items-center justify-between gap-1.5 py-1 px-1 rounded-md transition-opacity ${
        isDragging ? "opacity-30" : "opacity-100"
      }`}
    >
      {closestEdge === "top" && (
        <div className="absolute -top-px left-1 right-1 h-0 border-t-2 border-primary z-20 pointer-events-none" />
      )}

      {closestEdge === "bottom" && (
        <div className="absolute -bottom-px left-1 right-1 h-0 border-t-2 border-primary z-20 pointer-events-none" />
      )}

      <button
        ref={handleRef}
        type="button"
        aria-label="Kéo để sắp xếp"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <Checkbox
        checked={item.is_checked}
        onCheckedChange={(checked) => handleToggle(Boolean(checked))}
        id={`check-${item.id}`}
        className="shrink-0"
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            autoFocus
            value={contentValue}
            onChange={(e) => setContentValue(e.target.value)}
            onBlur={handleSaveContent}
            onKeyDown={handleKeyDown}
            className="h-8 w-full text-sm px-2.5 py-0 bg-background"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`block w-full text-sm cursor-pointer select-none truncate px-2.5 py-1 rounded-md transition-colors hover:bg-muted/70 ${
              item.is_checked
                ? "line-through text-muted-foreground"
                : "text-foreground"
            }`}
            title="Bấm để chỉnh sửa"
          >
            {item.content}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
        onClick={handleDelete}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
