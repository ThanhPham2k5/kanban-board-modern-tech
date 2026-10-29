"use client";

import {
  deleteChecklistItem,
  updateChecklistItem,
} from "@/actions/checklist-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChecklistItem } from "@/lib/definitions";
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
import { toast } from "../ui/toast";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onItemUpdated: (updatedItem: ChecklistItem) => void;
  onItemDeleted: (itemId: string) => void;
  onItemDeleteFailed: (restoredItem: ChecklistItem) => void;
  onMoveItem: (
    itemId: string,
    direction: "up" | "down" | "left" | "right",
  ) => void;
  isFocused: string | null;
}

export function ChecklistItemRow({
  item,
  onItemUpdated,
  onItemDeleted,
  onItemDeleteFailed,
  onMoveItem,
  isFocused,
}: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [contentValue, setContentValue] = useState(item.content);

  const ref = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    if (isFocused === item.id && handleRef.current) {
      if (document.activeElement !== handleRef.current) {
        handleRef.current.focus();
      }
    }
  }, [isFocused, item.id]);

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
      toast.add({
        title: "Cập nhật trạng thái item thành công!",
        description: "Cập nhật trạng thái item thành công.",
        type: "success",
      });
    } catch {
      console.error("Cập nhật checkbox thất bại");
      onItemUpdated({ ...item, is_checked: item.is_checked });
      toast.add({
        title: "Cập nhật trạng thái item thất bại!",
        description: "Cập nhật trạng thái item thất bại.",
        type: "error",
      });
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
      toast.add({
        title: "Sửa tiêu đề item thành công!",
        description: "Sửa tiêu đề item thành công.",
        type: "success",
      });
    } catch {
      console.error("Cập nhật nội dung checklist item thất bại");
      setContentValue(item.content);
      onItemUpdated({ ...item, content: item.content });
      toast.add({
        title: "Sửa tiêu đề item thất bại!",
        description: "Sửa tiêu đề item thất bại.",
        type: "error",
      });
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
      toast.add({
        title: "Xóa item thành công!",
        description: "Xóa item thành công.",
        type: "success",
      });
    } catch {
      console.error("Xóa checklist item thất bại");
      onItemDeleteFailed(itemToRestore);
      toast.add({
        title: "Xóa item thất bại!",
        description: "Xóa item thất bại.",
        type: "error",
      });
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
        onKeyDown={(e) => {
          if (e.altKey) {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              onMoveItem(item.id, "up");
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              onMoveItem(item.id, "down");
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              onMoveItem(item.id, "left");
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              onMoveItem(item.id, "right");
            }
          }
        }}
        type="button"
        aria-label="Kéo để sắp xếp"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground transition-colors p-0.5"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <Checkbox
        checked={item.is_checked}
        onCheckedChange={(checked) => handleToggle(Boolean(checked))}
        id={`check-${item.id}`}
        aria-label={`Hoàn thành mục: ${item.content}`}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleToggle(!item.is_checked);
          }
        }}
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
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setIsEditing(true);
              }
            }}
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
        aria-label="Xóa item"
        className="h-7 w-7 transition-colors text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
        onClick={handleDelete}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
