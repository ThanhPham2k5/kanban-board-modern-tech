"use client";

import { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  extractClosestEdge,
  Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { Button } from "./ui/button";
import { Plus, Trash2 } from "lucide-react";

interface ListProps {
  list: { id: string; title: string; order: string };
  onUpdateTitle: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function ListContainer({
  list,
  onUpdateTitle,
  onDelete,
}: ListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null); // the handle which is used to drag a list

  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);

  useEffect(() => {
    const li = listRef.current;
    const handle = dragHandleRef.current;
    if (!li || !handle) return;

    const cleanupDrop = dropTargetForElements({
      element: li,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          { id: list.id, type: "list" },
          { input, element, allowedEdges: ["left", "right"] },
        );
      },
      onDragEnter: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDrag: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
      onDragLeave: () => setClosestEdge(null),
      onDrop: () => setClosestEdge(null),
    });

    const cleanupDrag = draggable({
      element: li,
      dragHandle: handle, // only drag when user uses the handle
      getInitialData: () => ({ id: list.id, type: "list" }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDrop();
      cleanupDrag();
    };
  }, [list.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onUpdateTitle(list.id, editTitle);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={listRef}
      className={`relative shrink-0 w-80 max-h-full flex flex-col bg-muted/50 rounded-xl border transition-all ${isDraggedOver ? "bg-muted ring-2 ring-primary/50 translate-x-1" : ""} ${isDragging ? "opacity-40 shadow-xl scale-[0.98]" : "opacity-100 shadow-sm"}`}
    >
      {closestEdge && <DropIndicator edge={closestEdge} gap="16px" />}

      <div
        ref={dragHandleRef}
        className="p-3 pb-2 flex justify-between items-center cursor-grab active:cursor-grabbing group"
      >
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              onUpdateTitle(list.id, editTitle);
              setIsEditing(false);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm font-semibold border-2 border-primary rounded-md outline-none bg-background"
          />
        ) : (
          <h3
            onClick={() => setIsEditing(true)}
            className="font-semibold text-sm flex-1 px-2 py-1 rounded-md hover:bg-black/5 cursor-text"
            title="Nhấn để sửa tên"
          >
            {list.title}
          </h3>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(list.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* place card component here */}
      <div className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-2 min-h-[10px]"></div>

      <div className="p-2 pt-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm thẻ
        </Button>
      </div>
    </div>
  );
}
