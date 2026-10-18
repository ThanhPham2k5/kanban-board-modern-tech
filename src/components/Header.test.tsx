import { logout } from "@/actions/auth-action";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import Header from "./Header";
import { toast } from "./ui/toast";

vi.mock("@/actions/auth-action", () => ({
  logout: vi.fn(),
}));

vi.mock("./ui/toast", () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("./ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

describe("Header Component", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("Kiểm tra render giao diện", () => {
    render(<Header />);

    expect(screen.getByText("Kanban Board")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm danh sách/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /đăng xuất/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("Kiểm tra sự kiện click Thêm danh sách", async () => {
    const user = userEvent.setup();
    const eventListener = vi.fn();
    window.addEventListener("trigger-add-list", eventListener);

    render(<Header />);
    const addListButton = screen.getByRole("button", {
      name: /thêm danh sách/i,
    });

    await user.click(addListButton);

    expect(eventListener).toHaveBeenCalledTimes(1);

    window.removeEventListener("trigger-add-list", eventListener);
  });

  it("Kiểm tra chức năng Đăng xuất thành công", async () => {
    const user = userEvent.setup();
    (logout as Mock).mockResolvedValueOnce({
      success: "Đăng xuất thành công!",
    });

    render(<Header />);
    const logoutButton = screen.getByRole("button", { name: /đăng xuất/i });

    await user.click(logoutButton);

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Đăng xuất thành công!",
          type: "success",
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("Kiểm tra chức năng Đăng xuất thất bại", async () => {
    const user = userEvent.setup();
    (logout as Mock).mockResolvedValueOnce({
      error: "Lỗi kết nối máy chủ",
    });

    render(<Header />);
    const logoutButton = screen.getByRole("button", { name: /đăng xuất/i });

    await user.click(logoutButton);

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Đăng xuất thất bại",
          description: "Lỗi kết nối máy chủ",
          type: "error",
        }),
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
