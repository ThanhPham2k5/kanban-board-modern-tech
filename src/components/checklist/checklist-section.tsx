"use client";

import {
  createChecklist,
  updateChecklistItemOrder,
  updateChecklistOrder,
} from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { generateKeyBetween } from "fractional-indexing";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ChecklistItem,
  ChecklistWithItems,
} from "../../../src/app/lib/definitions";
import { ChecklistCard } from "./checklist-card";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checklistsRef = useRef(checklists);

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

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const lastChecklist = checklists[checklists.length - 1];
      const nextOrder = generateKeyBetween(
        lastChecklist ? lastChecklist.order : null,
        null,
      );

      const created = await createChecklist({
        card_id: cardId,
        title,
        order: nextOrder,
      });

      onChange([...checklists, { ...created, items: [] }]);
      setNewTitle("");
      setIsAddingGroup(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thêm nhóm thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChecklistDeleted(deletedId: string) {
    onChange(checklists.filter((item) => item.id !== deletedId));
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
      <div>
        {isAddingGroup ? (
          <form onSubmit={handleCreateGroup} className="flex gap-2">
            <Input
              autoFocus
              placeholder="Nhập tên checklist (VD: Thiết kế UI, Review Code...)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Lưu"}
            </Button>
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
            variant="outline"
            size="sm"
            onClick={() => setIsAddingGroup(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Thêm danh sách công việc
          </Button>
        )}
      </div>

      {checklists.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground">
          Chưa có danh sách công việc nào cho thẻ này.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {checklists.map((cl) => (
            <ChecklistCard
              key={cl.id}
              checklist={cl}
              onChecklistDeleted={handleChecklistDeleted}
              onChecklistUpdated={handleChecklistUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
