"use client";

import { useEffect, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import ListContainer from "./ListContainer";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import {
  addListAction,
  updateListAction,
  deleteListAction,
} from "@/actions/list-actions";

export default function BoardView({ initialLists }: { initialLists: any[] }) {
  const [lists, setLists] = useState(initialLists);

  // re-sync state if database changed - multiple screens case
  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);

  // list CRUD functions
  const addList = async () => {
    const tempId = `list-${Date.now()}`;

    const newList = {
      id: tempId, // random list id for optismic UI
      title: "Danh sách mới",
      order: lists.length + 1,
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
          const draggedId = source.data.id;
          const targetId = destination.data.id;

          if (draggedId === targetId) return; // drag and drop at one place

          setLists((prevList) => {
            const draggedIndex = prevList.findIndex((l) => l.id === draggedId);
            const targetIndex = prevList.findIndex((l) => l.id === targetId);

            const newLists = [...prevList];
            const [draggedItem] = newLists.splice(draggedIndex, 1);

            newLists.splice(targetIndex, 0, draggedItem);
            return newLists;
          });
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
