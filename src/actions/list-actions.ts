"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export async function addListAction(title: string, order: string) {
  const supabase = await createClient();

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
  const supabase = await createClient();

  const { error } = await supabase
    .from("lists")
    .update({ title: newTitle })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function deleteListAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function updateListOrderAction(id: string, newOrder: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lists")
    .update({ order: newOrder })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
