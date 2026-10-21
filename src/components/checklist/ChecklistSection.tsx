"use client";

import {
  createChecklist,
  updateChecklistItemOrder,
  updateChecklistOrder,
} from "@/actions/checklist-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChecklistItem, ChecklistWithItems } from "@/lib/definitions";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { generateKeyBetween } from "fractional-indexing";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "../ui/toast";
import { ChecklistCard } from "./ChecklistCard";

interface ChecklistSectionProps {
  cardId: string;
  checklists: ChecklistWithItems[];
  onChange: (updatedChecklists: ChecklistWithItems[]) => void;
}

export function ChecklistSection({
  cardId,
  checklists,
  onChange,
}: ChecklistSectionProps) {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  const checklistsRef = useRef(checklists);
  useEffect(() => {
    checklistsRef.current = checklists;
  }, [checklists]);

  useEffect(() => {
    return monitorForElements({
      async onDrop({ source, location }) {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const currentChecklists = checklistsRef.current;
        const sourceType = source.data.type as string;
        const targetType = target.data.type as string;

        if (sourceType === "checklist" && targetType === "checklist") {
          const sourceChecklistId = source.data.checklistId as string;
          const targetChecklistId = target.data.checklistId as string;

          if (sourceChecklistId === targetChecklistId) return;

          const sourceIndex = currentChecklists.findIndex(
            (c) => c.id === sourceChecklistId,
          );
          const targetIndex = currentChecklists.findIndex(
            (c) => c.id === targetChecklistId,
          );
          if (sourceIndex === -1 || targetIndex === -1) return;

          const edge = extractClosestEdge(target.data) as Edge | null;

          const remainingChecklists = currentChecklists.filter(
            (c) => c.id !== sourceChecklistId,
          );
          const adjustedTargetIndex = remainingChecklists.findIndex(
            (c) => c.id === targetChecklistId,
          );

          const insertIndex =
            edge === "bottom" ? adjustedTargetIndex + 1 : adjustedTargetIndex;

          const prevChecklist = remainingChecklists[insertIndex - 1];
          const nextChecklist = remainingChecklists[insertIndex];

          const newOrder = generateKeyBetween(
            prevChecklist?.order ?? null,
            nextChecklist?.order ?? null,
          );

          const sourceChecklist = currentChecklists[sourceIndex];
          const updatedChecklist = { ...sourceChecklist, order: newOrder };
          const nextChecklists = [...remainingChecklists];
          nextChecklists.splice(insertIndex, 0, updatedChecklist);

          onChange(nextChecklists);

          try {
            await updateChecklistOrder(sourceChecklistId, newOrder);
          } catch {
            console.error("Cập nhật vị trí checklist thất bại");
            onChange(currentChecklists);
          }
          return;
        }

        if (sourceType === "checklist-item") {
          const sourceItemId = source.data.itemId as string;
          const sourceChecklistId = source.data.checklistId as string;

          let targetChecklistId = "";
          if (targetType === "checklist-item" || targetType === "checklist") {
            targetChecklistId = target.data.checklistId as string;
          }
          if (!targetChecklistId) return;

          const sourceChecklist = currentChecklists.find(
            (c) => c.id === sourceChecklistId,
          );
          const targetChecklist = currentChecklists.find(
            (c) => c.id === targetChecklistId,
          );
          if (!sourceChecklist || !targetChecklist) return;

          const sourceItem = sourceChecklist.items.find(
            (it) => it.id === sourceItemId,
          );
          if (!sourceItem) return;

          const targetItems =
            sourceChecklistId === targetChecklistId
              ? targetChecklist.items.filter((it) => it.id !== sourceItemId)
              : [...targetChecklist.items];

          let newOrder = "";
          let insertIndex = 0;

          if (targetType === "checklist-item") {
            const targetItemId = target.data.itemId as string;
            if (sourceItemId === targetItemId) return;

            const edge = extractClosestEdge(target.data) as Edge | null;
            const targetItemIndex = targetItems.findIndex(
              (it) => it.id === targetItemId,
            );
            if (targetItemIndex === -1) return;

            insertIndex =
              edge === "bottom" ? targetItemIndex + 1 : targetItemIndex;

            const prevItem = targetItems[insertIndex - 1];
            const nextItem = targetItems[insertIndex];

            newOrder = generateKeyBetween(
              prevItem?.order ?? null,
              nextItem?.order ?? null,
            );
          } else {
            insertIndex = targetItems.length;
            const lastItem = targetItems[targetItems.length - 1];
            newOrder = generateKeyBetween(lastItem?.order ?? null, null);
          }

          const updatedSourceItem: ChecklistItem = {
            ...sourceItem,
            order: newOrder,
            checklist_id: targetChecklistId,
          };

          const newTargetItems = [...targetItems];
          newTargetItems.splice(insertIndex, 0, updatedSourceItem);

          let updatedChecklists: ChecklistWithItems[];

          if (sourceChecklistId === targetChecklistId) {
            updatedChecklists = currentChecklists.map((c) =>
              c.id === targetChecklistId ? { ...c, items: newTargetItems } : c,
            );
          } else {
            updatedChecklists = currentChecklists.map((c) => {
              if (c.id === sourceChecklistId) {
                return {
                  ...c,
                  items: c.items.filter((it) => it.id !== sourceItemId),
                };
              }
              if (c.id === targetChecklistId) {
                return { ...c, items: newTargetItems };
              }
              return c;
            });
          }

          onChange(updatedChecklists);

          try {
            await updateChecklistItemOrder(
              sourceItemId,
              newOrder,
              targetChecklistId,
            );
          } catch {
            console.error("Cập nhật vị trí checklist item thất bại");
            onChange(currentChecklists);
          }
        }
      },
    });
  }, [onChange]);

  async function handleMoveChecklist(
    checklistId: string,
    direction: "up" | "down",
  ) {
    const currentChecklists = checklistsRef.current;
    const index = currentChecklists.findIndex((c) => c.id === checklistId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentChecklists.length) return;

    const newChecklists = [...currentChecklists];
    const [movedItem] = newChecklists.splice(index, 1);
    newChecklists.splice(targetIndex, 0, movedItem);

    const prevChecklist = newChecklists[targetIndex - 1];
    const nextChecklist = newChecklists[targetIndex + 1];
    const newOrder = generateKeyBetween(
      prevChecklist?.order ?? null,
      nextChecklist?.order ?? null,
    );

    const updatedChecklist = { ...movedItem, order: newOrder };
    newChecklists[targetIndex] = updatedChecklist;

    onChange(newChecklists);

    try {
      await updateChecklistOrder(checklistId, newOrder);
    } catch {
      console.error("Di chuyển checklist bằng bàn phím thất bại");
      onChange(currentChecklists);
    }
  }

  async function handleMoveChecklistItem(
    itemId: string,
    sourceChecklistId: string,
    direction: "up" | "down" | "left" | "right",
  ) {
    const currentChecklists = checklistsRef.current;

    const sourceChecklistIndex = currentChecklists.findIndex(
      (c) => c.id === sourceChecklistId,
    );
    if (sourceChecklistIndex === -1) return;
    const sourceChecklist = currentChecklists[sourceChecklistIndex];

    const itemIndex = sourceChecklist.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;
    const itemToMove = sourceChecklist.items[itemIndex];

    let targetChecklistId = sourceChecklistId;
    let targetItems: ChecklistItem[] = [];
    let insertIndex = 0;

    if (direction === "up" || direction === "down") {
      targetItems = [...sourceChecklist.items];
      const targetItemIndex =
        direction === "up" ? itemIndex - 1 : itemIndex + 1;

      if (targetItemIndex < 0 || targetItemIndex >= targetItems.length) return;

      targetItems.splice(itemIndex, 1);
      targetItems.splice(targetItemIndex, 0, itemToMove);
      insertIndex = targetItemIndex;
    } else {
      const targetChecklistIndex =
        direction === "left"
          ? sourceChecklistIndex - 1
          : sourceChecklistIndex + 1;

      if (
        targetChecklistIndex < 0 ||
        targetChecklistIndex >= currentChecklists.length
      ) {
        return;
      }

      const targetChecklist = currentChecklists[targetChecklistIndex];
      targetChecklistId = targetChecklist.id;

      insertIndex = 0;
      targetItems = [itemToMove, ...targetChecklist.items];
    }

    const prevItem = targetItems[insertIndex - 1];
    const nextItem = targetItems[insertIndex + 1];
    const newOrder = generateKeyBetween(
      prevItem?.order ?? null,
      nextItem?.order ?? null,
    );

    const updatedItem: ChecklistItem = {
      ...itemToMove,
      order: newOrder,
      checklist_id: targetChecklistId,
    };

    const finalTargetItems = [...targetItems];
    finalTargetItems[insertIndex] = updatedItem;

    let updatedChecklists: ChecklistWithItems[];

    if (sourceChecklistId === targetChecklistId) {
      updatedChecklists = currentChecklists.map((c) =>
        c.id === sourceChecklistId ? { ...c, items: finalTargetItems } : c,
      );
    } else {
      updatedChecklists = currentChecklists.map((c) => {
        if (c.id === sourceChecklistId) {
          return {
            ...c,
            items: c.items.filter((it) => it.id !== itemId),
          };
        }
        if (c.id === targetChecklistId) {
          return {
            ...c,
            items: finalTargetItems,
          };
        }
        return c;
      });
    }

    setFocusedItemId(itemId);
    onChange(updatedChecklists);

    try {
      await updateChecklistItemOrder(itemId, newOrder, targetChecklistId);
    } catch {
      console.error("Di chuyển checklist item bằng bàn phím thất bại");
      onChange(currentChecklists);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const previousChecklists = [...checklists];
    const lastChecklist = checklists[checklists.length - 1];
    const nextOrder = generateKeyBetween(
      lastChecklist ? lastChecklist.order : null,
      null,
    );
    const tempId = `temp-${Date.now()}`;
    const newChecklist: ChecklistWithItems = {
      id: tempId,
      card_id: cardId,
      title,
      order: nextOrder,
      items: [],
    };

    const updatedChecklists = [...checklists, newChecklist];
    onChange(updatedChecklists);
    setNewTitle("");
    setIsAddingGroup(false);

    try {
      const created = await createChecklist({
        card_id: cardId,
        title,
        order: nextOrder,
      });

      const finalChecklists = updatedChecklists.map((item) =>
        item.id === tempId ? { ...created, items: item.items } : item,
      );
      onChange(finalChecklists);

      toast.add({
        title: "Tạo checklist mới thành công!",
        description: "Đã tạo checklist mới thành công.",
        type: "success",
      });
    } catch {
      console.error("Thêm mới checklist thất bại");
      onChange(previousChecklists);
      setNewTitle(title);
      setIsAddingGroup(true);
      toast.add({
        title: "Tạo checklist thất bại!",
        description: "Tạo checklist mới thất bại.",
        type: "error",
      });
    }
  }

  function handleChecklistDeleted(deletedId: string) {
    onChange(checklists.filter((item) => item.id !== deletedId));
  }

  function handleChecklistDeleteFailed(restoredChecklist: ChecklistWithItems) {
    const restoredChecklists = [...checklists, restoredChecklist].sort((a, b) =>
      (a.order ?? "").localeCompare(b.order ?? ""),
    );

    onChange(restoredChecklists);
  }

  function handleChecklistUpdated(updatedChecklist: ChecklistWithItems) {
    onChange(
      checklists.map((item) =>
        item.id === updatedChecklist.id ? updatedChecklist : item,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {checklists.map((cl) => (
          <ChecklistCard
            key={cl.id}
            checklist={cl}
            onChecklistDeleted={handleChecklistDeleted}
            onChecklistUpdated={handleChecklistUpdated}
            onChecklistDeleteFailed={handleChecklistDeleteFailed}
            onMove={(direction: "up" | "down") =>
              handleMoveChecklist(cl.id, direction)
            }
            onMoveItem={(
              itemId: string,
              direction: "up" | "down" | "left" | "right",
            ) => handleMoveChecklistItem(itemId, cl.id, direction)}
            isFocused={focusedItemId}
          />
        ))}
      </div>

      <div>
        {isAddingGroup ? (
          <form onSubmit={handleCreateGroup} className="flex gap-2">
            <Input
              autoFocus
              placeholder="Nhập tên checklist"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button type="submit"> Thêm checklist </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddingGroup(false);
                setNewTitle("");
              }}
            >
              Hủy
            </Button>
          </form>
        ) : (
          <Button
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setIsAddingGroup(true);
              }
            }}
            variant="outline"
            size="sm"
            onClick={() => setIsAddingGroup(true)}
            className="w-full justify-start gap-1.5 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Plus className="h-4 w-4" /> Thêm danh sách công việc
          </Button>
        )}
      </div>
    </div>
  );
}
