"use server";

import { AuthSchema } from "@/lib/schema";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const validatedFields = AuthSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: "Sai email hoặc mật khẩu" };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: `Mật khẩu xác nhận không khớp` };
  }

  const validatedFields = AuthSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message };
  }

  const { email, password: validPassword } = validatedFields.data;

  const { error } = await supabase.auth.signUp({
    email,
    password: validPassword,
  });

  if (error) {
    if (error.status === 422)
      return { error: "Email này đã được sử dụng hoặc không hợp lệ" };
    return { error: `Đăng ký thất bại: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: `Đăng xuất thất bại: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
