"use client";

import { useRef, useEffect, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { generateKeyBetween } from "fractional-indexing";
import ListContainer from "./ListContainer";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

import {
  addListAction,
  deleteListAction,
  updateListAction,
  updateListOrderAction,
} from "@/actions/list-actions";
import { updateCardOrderAction } from "@/actions/card-actions";
import { CardWithChecklists } from "@/lib/definitions";

interface BoardViewProps {
  initialLists: { id: string; title: string; order: string }[];
  initialCards: CardWithChecklists[];
}

export default function BoardView({
  initialLists,
  initialCards,
}: BoardViewProps) {
  const [lists, setLists] = useState(() =>
    [...initialLists].sort((a, b) =>
      a.order < b.order ? -1 : a.order > b.order ? 1 : 0,
    ),
  );

  const [cards, setCards] = useState<CardWithChecklists[]>(initialCards);

  const listRef = useRef(lists);
  const cardsRef = useRef(cards);

  useEffect(() => {
    listRef.current = lists;
  }, [lists]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    setLists(initialLists);
    setCards(initialCards);
  }, [initialLists, initialCards]);

  const addList = async () => {
    const lastList = lists[lists.length - 1];
    const newOrder = generateKeyBetween(lastList?.order || null, null);
    const tempId = crypto.randomUUID();

    const newList = { id: tempId, title: "Danh sách mới", order: newOrder };
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
    } catch (error) {
      setLists((prev) => prev.filter((list) => list.id !== tempId));
      console.log("Thêm list lỗi: ", error);
    }
  };

  const updateList = async (id: string, newTitle: string) => {
    setLists(
      lists.map((list) =>
        list.id === id ? { ...list, title: newTitle } : list,
      ),
    );
    await updateListAction(id, newTitle);
  };

  const deleteList = async (id: string) => {
    if (confirm("Bạn có chắc muốn xoá danh sách này?")) {
      setLists(lists.filter((list) => list.id !== id));
      await deleteListAction(id);
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
    setLists(sortedLists);
    updateListOrderAction(id, newOrderString).catch(console.error);
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

        if (source.data.type === "card") {
          const draggedCardId = source.data.id as string;
          let targetListId = source.data.listId as string;
          let newOrder: string | null = null;

          if (destination.data.type === "card") {
            targetListId = destination.data.listId as string;
            const targetCardId = destination.data.id as string;
            const edge = extractClosestEdge(destination.data);

            const targetListCards = cardsRef.current
              .filter((c) => c.list_id === targetListId)
              .sort((a, b) => (a.order < b.order ? -1 : 1));
            const targetIndex = targetListCards.findIndex(
              (c) => c.id === targetCardId,
            );

            const prevOrder =
              edge === "top"
                ? targetListCards[targetIndex - 1]?.order || null
                : targetListCards[targetIndex].order;
            const nextOrder =
              edge === "top"
                ? targetListCards[targetIndex].order
                : targetListCards[targetIndex + 1]?.order || null;

            const draggedCard = cardsRef.current.find(
              (c) => c.id === draggedCardId,
            );
            if (
              prevOrder !== draggedCard?.order &&
              nextOrder !== draggedCard?.order
            ) {
              newOrder = generateKeyBetween(prevOrder, nextOrder);
            }
          } else if (destination.data.type === "list") {
            targetListId = destination.data.id as string;
            const targetListCards = cardsRef.current
              .filter((c) => c.list_id === targetListId)
              .sort((a, b) => (a.order < b.order ? -1 : 1));

            if (targetListCards.length === 0) {
              newOrder = generateKeyBetween(null, null);
            } else {
              const lastCard = targetListCards[targetListCards.length - 1];
              newOrder = generateKeyBetween(lastCard.order, null);
            }
          }

          if (newOrder || targetListId !== source.data.listId) {
            const draggedCard = cardsRef.current.find(
              (c) => c.id === draggedCardId,
            );
            const finalOrder = newOrder || draggedCard?.order || "a0";

            setCards((prev) => {
              const updated = prev.map((c) =>
                c.id === draggedCardId
                  ? { ...c, list_id: targetListId, order: finalOrder }
                  : c,
              );
              return updated.sort((a, b) => (a.order < b.order ? -1 : 1));
            });

            updateCardOrderAction(
              draggedCardId,
              targetListId,
              finalOrder,
            ).catch(console.error);
          }
        }
      },
    });

    return () => cleanup();
  }, []);

  return (
    <>
      <div className="flex gap-4 h-full items-start">
        {lists.map((list) => (
          <ListContainer
            key={list.id}
            list={list}
            cards={cards.filter((card) => card.list_id === list.id)}
            setCards={setCards}
            onUpdateTitle={updateList}
            onDelete={deleteList}
            onMoveList={moveListKeyBoard}
          />
        ))}

        <Button
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
