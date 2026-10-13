"use server";

import { ListSchema } from "@/lib/schema";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addListAction(title: string, order: string) {
  const validatedFields = ListSchema.safeParse({ title });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const cleanTitle = validatedFields.data.title;

  try {
    const { data, error } = await supabase
      .from("lists")
      .insert([{ title: cleanTitle, order }])
      .select()
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/");
    return data; // return the list for updating real ID
  } catch (error) {
    console.error(error);
    throw new Error("Hệ thống: lưu danh sách thất bại");
  }
}

export async function updateListAction(id: string, newTitle: string) {
  const validatedFields = ListSchema.safeParse({ title: newTitle });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const cleanTitle = validatedFields.data.title;

  try {
    const { error } = await supabase
      .from("lists")
      .update({ title: cleanTitle })
      .eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/");
  } catch (error) {
    console.error(error);
    throw new Error("Hệ thống: cập nhật danh sách thất bại");
  }
}

export async function deleteListAction(id: string) {
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function updateListOrderAction(id: string, newOrder: string) {
  const { error } = await supabase
    .from("lists")
    .update({ order: newOrder })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
