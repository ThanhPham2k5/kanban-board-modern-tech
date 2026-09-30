"use client";

import { useEffect, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import ListContainer from "./ListContainer";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

const mockList = [
  { id: "list-1", title: "Cần làm" },
  { id: "list-2", title: "Đang làm" },
  { id: "list-3", title: "Hoàn thành" },
];

export default function BoardView() {
  const [lists, setLists] = useState(mockList);

  // temp list CRUD functions
  const addList = () => {
    const newList = {
      id: `list-${Date.now()}`, // random list id
      title: "Danh sách mới",
    };
    setLists([...lists, newList]);
  };

  const updateList = (id: string, newTitle: string) => {
    setLists(
      lists.map((list) =>
        list.id === id ? { ...list, title: newTitle } : list,
      ),
    );
  };

  const deleteList = (id: string) => {
    if (confirm("Bạn có chắc muốn xoá danh sách này?")) {
      setLists(lists.filter((list) => list.id !== id));
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
