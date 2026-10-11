"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addListAction(title: string, order: string) {
  const { data, error } = await supabase
    .from("lists")
    .insert([{ title, order }])
    .select()
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  return data; // return the list for updating real ID
}

export async function updateListAction(id: string, newTitle: string) {
  const { error } = await supabase
    .from("lists")
    .update({ title: newTitle })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
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
