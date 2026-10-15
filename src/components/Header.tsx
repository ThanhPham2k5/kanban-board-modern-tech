"use client";

import { Button } from "./ui/button";
import { LogOut, Plus } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/actions/auth-action";
import { toast } from "./ui/toast";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const triggerAddList = () => {
    window.dispatchEvent(new CustomEvent("trigger-add-list"));
  };

  const handleLogOut = async () => {
    const result = await logout();

    if (result?.error) {
      toast.add({
        title: "Đăng xuất thất bại",
        description: result.error,
        type: "error",
      });
    } else if (result?.success) {
      toast.add({
        title: "Đăng xuất thành công!",
        description: result.success,
        type: "success",
      });
      router.push("/login");
    }
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

        <Button
          onClick={handleLogOut}
          variant="ghost"
          size="sm"
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
