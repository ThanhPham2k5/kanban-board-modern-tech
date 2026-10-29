import { z } from "zod";

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

const dangerousPattern = /<[^>]*>?|javascript:|eval\(|onerror=/i;

export const CardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề không được để trống")
    .max(255, "Tiêu đề không được vượt quá 255 ký tự")
    .refine((val) => !dangerousPattern.test(val), {
      message: "Tiêu đề chứa ký tự hoặc mã độc không hợp lệ!",
    }),

  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional()
    .nullable()
    .refine((val) => !val || !dangerousPattern.test(val), {
      message: "Mô tả chứa ký tự hoặc mã độc không hợp lệ!",
    }),
});

export const ChecklistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề checklist không được để trống")
    .max(255, "Tiêu đề checklist không được vượt quá 255 ký tự")
    .refine((val) => !dangerousPattern.test(val), {
      message: "Tiêu đề checklist chứa ký tự hoặc mã độc không hợp lệ!",
    }),
});

export const ChecklistItemSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Nội dung checklist item không được để trống")
    .max(500, "Nội dung không được vượt quá 500 ký tự")
    .refine((val) => !dangerousPattern.test(val), {
      message: "Nội dung chứa ký tự hoặc mã độc không hợp lệ!",
    }),
  is_checked: z.boolean().default(false),
});
