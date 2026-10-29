"use server";

import { ListSchema } from "@/lib/schema";
// import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export async function addListAction(title: string, order: string) {
  const validatedFields = ListSchema.safeParse({ title });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const cleanTitle = validatedFields.data.title;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: useError,
    } = await supabase.auth.getUser();
    if (useError || !user) {
      throw new Error("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn");
    }

    const { data, error } = await supabase
      .from("lists")
      .insert([{ title: cleanTitle, order, user_id: user.id }])
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
    const supabase = await createClient();

    const {
      data: { user },
      error: useError,
    } = await supabase.auth.getUser();
    if (useError || !user) {
      throw new Error("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn");
    }

    const { error } = await supabase
      .from("lists")
      .update({ title: cleanTitle })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);

    revalidatePath("/");
  } catch (error) {
    console.error(error);
    throw new Error("Hệ thống: cập nhật danh sách thất bại");
  }
}

export async function deleteListAction(id: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: useError,
    } = await supabase.auth.getUser();
    if (useError || !user) {
      throw new Error("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn");
    }

    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);

    revalidatePath("/");
  } catch (error) {
    console.error(error);
    throw new Error("Hệ thống: xoá danh sách thất bại");
  }
}

export async function updateListOrderAction(id: string, newOrder: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: useError,
    } = await supabase.auth.getUser();
    if (useError || !user) {
      throw new Error("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn");
    }

    const { error } = await supabase
      .from("lists")
      .update({ order: newOrder })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  } catch (error) {
    console.error(error);
    throw new Error("Hệ thống: cập nhật vị trí danh sách thất bại");
  }
}
