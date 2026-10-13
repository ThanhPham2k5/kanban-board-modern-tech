import { z } from "zod";

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
