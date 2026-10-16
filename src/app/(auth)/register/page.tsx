"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signup } from "@/actions/auth-action";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async (formData: FormData) => {
    const result = await signup(formData);

    if (result?.error) {
      toast.add({
        title: "Đăng ký thất bại",
        description: result.error,
        type: "error",
      });
    } else if (result?.success) {
      toast.add({
        title: "Đăng ký thành công!",
        description: result.success,
        type: "success",
      });
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Đăng ký</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Tạo tài khoản để quản lý công việc của bạn
        </p>
      </div>

      {message && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
          {message}
        </div>
      )}

      <form action={handleRegister} className="flex flex-col gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            id="email"
            name="email"
            type="email"
            placeholder="mail@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Mật khẩu
          </label>

          <div className="relative">
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tạo mật khẩu an toàn..."
              required
              minLength={6}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            Nhập lại mật khẩu
          </label>

          <div className="relative">
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Xác nhận lại mật khẩu..."
              required
              minLength={6}
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full mt-2 h-12 cursor-pointer">
          Đăng ký
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-2">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline transition-all"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-4">Đang tải...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
