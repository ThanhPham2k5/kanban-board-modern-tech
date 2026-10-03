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
  updateListAction,
  deleteListAction,
  updateListOrderAction,
} from "@/actions/list-actions";

export default function BoardView({ initialLists }: { initialLists: any[] }) {
  const [lists, setLists] = useState(() =>
    [...initialLists].sort((a, b) =>
      a.order < b.order ? -1 : a.order > b.order ? 1 : 0,
    ),
  );

  const listRef = useRef(lists);
  useEffect(() => {
    listRef.current = lists;
  }, [lists]);

  // re-sync state if database changed - multiple screens case
  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);

  // list CRUD functions
  const addList = async () => {
    // auto add the end of lists
    const lastList = lists[lists.length - 1];
    const newOrder = generateKeyBetween(lastList?.order || null, null);

    const tempId = `list-${Date.now()}`;

    const newList = {
      id: tempId, // random list id for optismic UI
      title: "Danh sách mới",
      order: newOrder,
    };
    setLists([...lists, newList]);

    // save to database and update real ID
    try {
      const savedList = await addListAction(
        newList.title,
        newList.order.toString(),
      );
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === tempId ? { ...list, id: savedList.id } : list,
        ),
      );
    } catch (error) {
      setLists((prevLists) => prevLists.filter((list) => list.id !== tempId));
      console.log("Thêm list không thành công ", error);
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

  // drag and drop logic
  useEffect(() => {
    const cleanup = monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        // list verify
        if (source.data.type === "list" && destination.data.type === "list") {
          const draggedId = source.data.id as string;
          const targetId = destination.data.id as string;

          if (draggedId === targetId) return; // drag and drop at one place

          const edge = extractClosestEdge(destination.data);

          const prevLists = listRef.current;

          const targetIndex = prevLists.findIndex((l) => l.id === targetId);
          const draggedItem = prevLists.find((l) => l.id === draggedId)!;

          let prevOrder = null;
          let nextOrder = null;

          if (edge === "left") {
            prevOrder = prevLists[targetIndex - 1]?.order || null;
            nextOrder = prevLists[targetIndex].order;
          } else if (edge === "right") {
            prevOrder = prevLists[targetIndex].order;
            nextOrder = prevLists[targetIndex + 1]?.order || null;
          }

          if (
            prevOrder === draggedItem.order ||
            nextOrder === draggedItem.order
          ) {
            return prevLists;
          }

          const newOrderString = generateKeyBetween(prevOrder, nextOrder);
          const updateLists = prevLists.map((l) =>
            l.id === draggedId ? { ...l, order: newOrderString } : l,
          );
          const sortedLists = updateLists.sort((a, b) =>
            a.order < b.order ? -1 : a.order > b.order ? 1 : 0,
          );
          setLists(sortedLists);
          updateListOrderAction(draggedId, newOrderString).catch(console.error);
        }
      },
    });

    return () => cleanup();
  }, []);

  return (
    <div className="flex gap-4 h-full items-start">
      {lists.map((list) => (
        <ListContainer
          key={list.id}
          list={list}
          onUpdateTitle={updateList}
          onDelete={deleteList}
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
  );
}
