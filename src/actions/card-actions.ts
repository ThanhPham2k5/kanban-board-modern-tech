"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// 1. THÊM CARD
export async function addCardAction(
  listId: string,
  title: string,
  newOrder: string,
) {
  const { data, error } = await supabase
    .from("cards")
    .insert({
      list_id: listId,
      title: title,
      order: newOrder,
      is_completed: false,
      description: "",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return data;
}

// 2. SỬA TÊN CARD
export async function updateCardTitleAction(id: string, newTitle: string) {
  const { error } = await supabase
    .from("cards")
    .update({ title: newTitle })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// 3. SỬA MÔ TẢ
export async function updateCardDescriptionAction(
  id: string,
  newDescription: string,
) {
  const { error } = await supabase
    .from("cards")
    .update({ description: newDescription })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// 4. ĐÁNH DẤU HOÀN THÀNH
export async function toggleCardCompleteAction(
  id: string,
  isCompleted: boolean,
) {
  const { error } = await supabase
    .from("cards")
    .update({ is_completed: isCompleted })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// 5. XÓA THẺ
export async function deleteCardAction(id: string) {
  const { error } = await supabase.from("cards").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// 6. CẬP NHẬT KÉO THẢ (Đổi cột hoặc đổi thứ tự)
export async function updateCardOrderAction(
  id: string,
  newListId: string,
  newOrder: string,
) {
  const { error } = await supabase
    .from("cards")
    .update({
      list_id: newListId,
      order: newOrder,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
