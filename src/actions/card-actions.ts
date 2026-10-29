"use server";

import {
  CardWithChecklists,
  CreateCardInput,
  UpdateCardInput,
} from "@/lib/definitions";
import { CardSchema } from "@/lib/schema";
import { createClient } from "@/lib/server";
// import { supabase } from "@/lib/supabase";

export async function createCard(
  input: CreateCardInput,
): Promise<CardWithChecklists> {
  const supabase = await createClient();

  const validationResult = CardSchema.safeParse({
    title: input.title,
    description: input.description,
  });
  if (!validationResult.success) {
    const errorMsg = validationResult.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new Error(errorMsg);
  }

  const { data, error } = await supabase
    .from("cards")
    .insert({
      list_id: input.list_id,
      title: validationResult.data.title,
      order: input.order,
      description: validationResult.data.description,
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Lỗi khi tạo card:", error.message);
    throw new Error("Thêm card thất bại.");
  }

  return {
    ...data,
    checklists: [],
  };
}

export async function updateCard(
  cardId: string,
  updates: UpdateCardInput,
): Promise<void> {
  const supabase = await createClient();
  if (
    updates.title === undefined &&
    updates.is_completed === undefined &&
    updates.description === undefined
  ) {
    throw new Error("Không có dữ liệu cần cập nhật.");
  }

  const validationResult = CardSchema.partial().safeParse(updates);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new Error(errorMsg);
  }
  Object.assign(updates, validationResult.data);

  const { error } = await supabase
    .from("cards")
    .update(updates)
    .eq("id", cardId)
    .select()
    .single();

  if (error) {
    console.error("Lỗi cập nhật card:", error.message);
    throw new Error("Cập nhật card thất bại.");
  }
}

export async function updateCardOrder(
  cardId: string,
  newOrder: string,
  targetListId?: string,
): Promise<void> {
  const supabase = await createClient();
  const payload: { order: string; list_id?: string } = { order: newOrder };

  if (targetListId) {
    payload.list_id = targetListId;
  }

  const { error } = await supabase
    .from("cards")
    .update(payload)
    .eq("id", cardId);

  if (error) {
    console.error("Lỗi cập nhật vị trí card:", error.message);
    throw new Error("Cập nhật vị trí card thất bại.");
  }
}

export async function deleteCard(cardId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) {
    console.error("Lỗi khi xóa card:", error.message);
    throw new Error("Xóa card thất bại.");
  }
}
