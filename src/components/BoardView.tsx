"use client";

import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { generateKeyBetween } from "fractional-indexing";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ListContainer from "./ListContainer";
import { Button } from "./ui/button";
import { toast } from "./ui/toast";

import { updateCardOrder } from "@/actions/card-actions";
import {
  addListAction,
  deleteListAction,
  updateListAction,
  updateListOrderAction,
} from "@/actions/list-actions";
import { CardWithChecklists, ListWithCards } from "@/lib/definitions";

interface BoardViewProps {
  initialLists: ListWithCards[];
}

export default function BoardView({ initialLists }: BoardViewProps) {
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [lists, setLists] = useState<ListWithCards[]>(initialLists);
  const listRef = useRef(lists);

  function handleListChange(listId: string, updatedList: ListWithCards) {
    setLists((prevLists) =>
      prevLists.map((list) => (list.id === listId ? updatedList : list)),
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

  async function handleMoveCardAcrossLists(
    cardId: string,
    sourceListId: string,
    direction: "left" | "right",
  ) {
    const currentLists = listRef.current;

    const sourceListIndex = currentLists.findIndex(
      (l) => l.id === sourceListId,
    );
    if (sourceListIndex === -1) return;

    const targetListIndex =
      direction === "left" ? sourceListIndex - 1 : sourceListIndex + 1;

    if (targetListIndex < 0 || targetListIndex >= currentLists.length) return;

    const sourceList = currentLists[sourceListIndex];
    const targetList = currentLists[targetListIndex];

    const cardToMove = sourceList.cards.find((c) => c.id === cardId);
    if (!cardToMove) return;

    const targetCards = targetList.cards;
    const firstCard = targetCards[0];

    const newOrder = generateKeyBetween(null, firstCard?.order ?? null);

    const updatedCard = {
      ...cardToMove,
      list_id: targetList.id,
      order: newOrder,
    };

    const updatedLists = currentLists.map((list) => {
      if (list.id === sourceListId) {
        return {
          ...list,
          cards: list.cards.filter((c) => c.id !== cardId),
        };
      }
      if (list.id === targetList.id) {
        return {
          ...list,
          cards: [updatedCard, ...list.cards],
        };
      }
      return list;
    });

    setFocusedCardId(cardId);
    setLists(updatedLists);

    try {
      await updateCardOrder(cardId, newOrder, targetList.id);
    } catch {
      console.error("Di chuyển card giữa các list thất bại");
      setLists(currentLists);
    }
  }

  // auto scroll to the end of lists after creating a new list
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevListsCount = useRef(lists.length);
  useEffect(() => {
    if (lists.length > prevListsCount.current) {
      scrollContainerRef.current?.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
    prevListsCount.current = lists.length;
  }, [lists.length]);

  useEffect(() => {
    listRef.current = lists;
  }, [lists]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addList = async () => {
    const lastList = lists[lists.length - 1];
    const newOrder = generateKeyBetween(lastList?.order || null, null);
    const tempId = crypto.randomUUID();

    const newList = {
      id: tempId,
      title: "Danh sách mới",
      order: newOrder,
      cards: [],
    };
    setLists([...lists, newList]);

    try {
      const savedList = await addListAction(
        newList.title,
        newList.order.toString(),
      );
      setLists((prev) =>
        prev.map((list) =>
          list.id === tempId ? { ...list, id: savedList.id } : list,
        ),
      );
      toast.add({
        title: "Tạo thành công!",
        description: "Đã tạo danh sách mới thành công.",
        type: "success",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setLists((prev) => prev.filter((list) => list.id !== tempId));

      toast.add({
        title: "Tạo thất bại!",
        description: "Tạo danh sách mới thất bại. " + error.message,
        type: "error",
      });
    }
  };

  // listen add button on header to trigger add list action
  const addListRef = useRef(addList);

  useEffect(() => {
    addListRef.current = addList;
  }, [addList]);

  useEffect(() => {
    const handleTriggerAddList = () => addListRef.current();
    window.addEventListener("trigger-add-list", handleTriggerAddList);
    return () =>
      window.removeEventListener("trigger-add-list", handleTriggerAddList);
  }, []);

  const updateList = async (id: string, newTitle: string) => {
    const oldList = lists.find((list) => list.id === id);
    if (!oldList) {
      toast.add({
        title: "Không tìm thấy danh sách",
        description: "Cập nhật danh sách thất bại vì không tìm thấy danh sách.",
        type: "error",
      });

      return;
    }
    const oldTitle = oldList.title;

    setLists(
      lists.map((list) =>
        list.id === id ? { ...list, title: newTitle } : list,
      ),
    );

    try {
      await updateListAction(id, newTitle);

      toast.add({
        title: "Cập nhật thành công!",
        description: "Đã cập nhật danh sách thành công.",
        type: "success",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === id ? { ...list, title: oldTitle } : list,
        ),
      );

      toast.add({
        title: "Cập nhật thất bại!",
        description: "Cập nhật danh sách thất bại. " + error.message,
        type: "error",
      });
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá danh sách này?")) return;

    const oldList = lists.find((list) => list.id === id);
    if (!oldList) {
      toast.add({
        title: "Không tìm thấy danh sách",
        description: "Xoá danh sách thất bại vì không tìm thấy danh sách.",
        type: "error",
      });

      return;
    }

    const prevLists = [...lists];

    setLists((prev) => prev.filter((list) => list.id !== id));

    try {
      await deleteListAction(id);

      toast.add({
        title: "Xoá thành công!",
        description: "Đã xoá danh sách thành công.",
        type: "success",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setLists(prevLists);

      toast.add({
        title: "Xoá thất bại!",
        description: "Xoá danh sách thất bại. " + error.message,
        type: "error",
      });
    }
  };

  const moveListKeyBoard = (id: string, direction: "left" | "right") => {
    const prevLists = listRef.current;
    const index = prevLists.findIndex((list) => list.id === id);
    if (index === -1) return;

    let prevOrder = null;
    let nextOrder = null;

    if (direction === "left" && index > 0) {
      prevOrder = prevLists[index - 2]?.order || null;
      nextOrder = prevLists[index - 1].order || null;
    } else if (direction === "right" && index < prevLists.length - 1) {
      prevOrder = prevLists[index + 1].order || null;
      nextOrder = prevLists[index + 2]?.order || null;
    } else {
      return;
    }

    const newOrderString = generateKeyBetween(prevOrder, nextOrder);

    const updatedLists = prevLists.map((list) =>
      list.id === id ? { ...list, order: newOrderString } : list,
    );
    const sortedLists = updatedLists.sort((a, b) =>
      a.order < b.order ? -1 : a.order > b.order ? 1 : 0,
    );
    const oldList = prevLists;
    setLists(sortedLists);
    updateListOrderAction(id, newOrderString).catch(() => setLists(oldList)); // roll back
  };

  useEffect(() => {
    const cleanup = monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        if (source.data.type === "list" && destination.data.type === "list") {
          const draggedId = source.data.id as string;
          const targetId = destination.data.id as string;
          if (draggedId === targetId) return;

          const edge = extractClosestEdge(destination.data);
          const prevLists = listRef.current;
          const targetIndex = prevLists.findIndex((l) => l.id === targetId);
          const draggedItem = prevLists.find((l) => l.id === draggedId)!;

          const prevOrder =
            edge === "left"
              ? prevLists[targetIndex - 1]?.order || null
              : prevLists[targetIndex].order;
          const nextOrder =
            edge === "left"
              ? prevLists[targetIndex].order
              : prevLists[targetIndex + 1]?.order || null;

          if (
            prevOrder === draggedItem.order ||
            nextOrder === draggedItem.order
          )
            return prevLists;

          const newOrderString = generateKeyBetween(prevOrder, nextOrder);
          const updateLists = prevLists.map((l) =>
            l.id === draggedId ? { ...l, order: newOrderString } : l,
          );

          setLists(
            updateLists.sort((a, b) =>
              a.order < b.order ? -1 : a.order > b.order ? 1 : 0,
            ),
          );
          updateListOrderAction(draggedId, newOrderString).catch(console.error);
        }
      },
    });

    return () => cleanup();
  }, []);

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 flex-1 items-start overflow-x-auto p-4 md:p-6"
      >
        {lists.map((list) => (
          <ListContainer
            key={list.id}
            list={list}
            onUpdateTitle={updateList}
            onDelete={deleteList}
            onMoveList={moveListKeyBoard}
            onChange={(updatedList) => handleListChange(list.id, updatedList)}
            handleCardMoveAcrossLists={handleCardMoveAcrossLists}
            onMoveAcrossLists={(cardId: string, direction: "left" | "right") =>
              handleMoveCardAcrossLists(cardId, list.id, direction)
            }
            isFocused={focusedCardId}
          />
        ))}

        <Button
          data-testid="board-add-btn"
          onClick={addList}
          variant="ghost"
          className="w-fit justify-start text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh sách
        </Button>
      </div>
    </>
  );
}
