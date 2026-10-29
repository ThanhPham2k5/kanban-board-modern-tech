"use client";

import { login } from "@/actions/auth-action";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "@/components/ui/toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (formData: FormData) => {
    const result = await login(formData);

    if (result?.error) {
      toast.add({
        title: "Đăng nhập thất bại",
        description: result.error,
        type: "error",
      });
      router.push(`/login?message=Đăng nhập thất bại: ${result.error}`);
    } else if (result?.success) {
      toast.add({
        title: "Đăng nhập thành công!",
        description: result.success,
        type: "success",
      });
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Chào mừng bạn đến với Kanban Board
        </p>
      </div>

      {/* visible message from url (search params) */}
      {message && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
          {message}
        </div>
      )}

      {/* form login */}
      <form action={handleLogin} className="flex flex-col gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>

          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-colors"
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-colors"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
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

        <Button className="w-full mt-2 h-12 cursor-pointer" type="submit">
          Đăng nhập
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-2">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline transition-all"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-4">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
