"use server";

import {
  ChecklistItem,
  ChecklistWithItems,
  CreateChecklistInput,
  CreateChecklistItemInput,
  ListWithCards,
  UpdateChecklistItemInput,
} from "./definitions";
import { supabase } from "./supabase";

export async function getFullData(): Promise<ListWithCards[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("*,cards (*,checklists (*,items: checklistitems (*)))")
    .order("order", { ascending: true })
    .order("order", { referencedTable: "cards", ascending: true })
    .order("order", { referencedTable: "cards.checklists", ascending: true })
    .order("order", {
      referencedTable: "cards.checklists.checklistitems",
      ascending: true,
    });

  if (error) {
    console.error("Lỗi tải dữ liệu:", error.message);
    return [];
  }

  return data ?? [];
}

export async function createChecklist(
  input: CreateChecklistInput,
): Promise<ChecklistWithItems> {
  const { data, error } = await supabase
    .from("checklists")
    .insert({
      card_id: input.card_id,
      title: input.title.trim(),
      order: input.order,
    })
    .select()
    .single();

  if (error) {
    console.error("Lỗi khi tạo checklist:", error.message);
    throw new Error("Thêm checklist thất bại.");
  }

  return {
    ...data,
    items: [],
  };
}

export async function updateChecklist(
  id: string,
  title: string,
): Promise<void> {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error("Tiêu đề không được để trống.");
  }

  const { error } = await supabase
    .from("checklists")
    .update({ title: cleanTitle })
    .eq("id", id);

  if (error) {
    console.error("Lỗi khi cập nhật tiêu đề checklist:", error.message);
    throw new Error("Cập nhật checklist thất bại.");
  }
}

export async function updateChecklistOrder(
  id: string,
  newOrder: string,
): Promise<void> {
  const { error } = await supabase
    .from("checklists")
    .update({ order: newOrder })
    .eq("id", id);

  if (error) {
    console.error("Lỗi cập nhật order checklist:", error.message);
    throw new Error("Cập nhật vị trí checklist thất bại.");
  }
}

export async function deleteChecklist(id: string): Promise<void> {
  const { error } = await supabase.from("checklists").delete().eq("id", id);

  if (error) {
    console.error("Lỗi khi xóa checklist:", error.message);
    throw new Error("Xóa checklist thất bại.");
  }
}

export async function createChecklistItem(
  input: CreateChecklistItemInput,
): Promise<ChecklistItem> {
  const cleanContent = input.content.trim();
  if (!cleanContent) {
    throw new Error("Nội dung công việc không được để trống.");
  }

  const { data, error } = await supabase
    .from("checklistitems")
    .insert({
      checklist_id: input.checklist_id,
      content: cleanContent,
      order: input.order,
      is_checked: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Lỗi khi tạo checklist item:", error.message);
    throw new Error("Thêm checklist item thất bại.");
  }

  return data;
}

export async function updateChecklistItem(
  id: string,
  updates: UpdateChecklistItemInput,
): Promise<void> {
  if (updates.content === undefined && updates.is_checked === undefined) {
    throw new Error("Không có dữ liệu cần cập nhật.");
  }

  if (updates.content !== undefined) {
    updates.content = updates.content.trim();
    if (!updates.content) {
      throw new Error("Nội dung không được để trống.");
    }
  }

  const { error } = await supabase
    .from("checklistitems")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Lỗi cập nhật checklist item:", error.message);
    throw new Error("Cập nhật checklist item thất bại.");
  }
}

export async function updateChecklistItemOrder(
  id: string,
  newOrder: string,
  targetChecklistId?: string,
): Promise<void> {
  const payload: { order: string; checklist_id?: string } = { order: newOrder };

  if (targetChecklistId) {
    payload.checklist_id = targetChecklistId;
  }

  const { error } = await supabase
    .from("checklistitems")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Lỗi cập nhật vị trí item:", error.message);
    throw new Error("Cập nhật vị trí checklist item thất bại.");
  }
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from("checklistitems").delete().eq("id", id);

  if (error) {
    console.error("Lỗi khi xóa checklist item:", error.message);
    throw new Error("Xóa checklist item thất bại.");
  }
}
