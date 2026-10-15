import { email, z } from "zod";

export const AuthSchema = z.object({
  email: z
    .email({ message: "Email không đúng định dạng: email@example.com" })
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
    .max(50, { message: "Mật khẩu không vượt qua 50 ký tự" })
    .regex(/^[^<>]*$/, { message: "Mật khẩu chứa ký tự không hợp lệ" }),
});

export const ListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Tên danh sách không được để trống" })
    .max(50, { message: "Tên danh sách không vượt quá 50 ký tự" })
    .refine((value) => !/[<>]/.test(value), {
      message: "Tên danh sách chứa ký tự không hợp lệ",
    }),
});
