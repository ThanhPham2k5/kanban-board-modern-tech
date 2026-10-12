"use client";

import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
  const triggerAddList = () => {
    window.dispatchEvent(new CustomEvent("trigger-add-list"));
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="font-bold text-lg tracking-tight">Kanban Board</div>

      <div className="flex items-center justify-between gap-2.5">
        <ThemeToggle></ThemeToggle>

        <Button onClick={triggerAddList} size="sm" className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1" />
          Thêm danh sách
        </Button>
      </div>
    </header>
  );
}
