import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChecklistItemRow } from "./ChecklistItemRow";

vi.mock("@/actions/checklist-actions", () => ({
  updateChecklistItem: vi.fn().mockResolvedValue({ success: true }),
  deleteChecklistItem: vi.fn().mockResolvedValue({ success: true }),
}));

describe("ChecklistItemRow Component", () => {
  const mockItem = {
    id: "item-1",
    checklist_id: "check-1",
    content: "Hoàn thành báo cáo",
    is_checked: false,
    order: "a0",
  };

  it("Hiển thị đúng nội dung và trạng thái checkbox", () => {
    render(
      <ChecklistItemRow
        item={mockItem}
        onItemUpdated={vi.fn()}
        onItemDeleted={vi.fn()}
        onItemDeleteFailed={vi.fn()}
      />,
    );

    expect(screen.getByText("Hoàn thành báo cáo")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("Hiển thị giao diện khi item đã hoàn thành", () => {
    const checkedItem = { ...mockItem, is_checked: true };
    render(
      <ChecklistItemRow
        item={checkedItem}
        onItemUpdated={vi.fn()}
        onItemDeleted={vi.fn()}
        onItemDeleteFailed={vi.fn()}
      />,
    );

    const textSpan = screen.getByText("Hoàn thành báo cáo");
    expect(textSpan).toHaveClass("line-through");
  });

  it("Hàm onItemUpdated được gọi đúng khi nhấn vào checkbox", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistItemRow
        item={mockItem}
        onItemUpdated={handleUpdated}
        onItemDeleted={vi.fn()}
        onItemDeleteFailed={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: "item-1", is_checked: true }),
    );
  });

  it("Chuyển sang chế độ chỉnh sửa tiêu đề và lưu thay đổi khi nhấn Enter", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistItemRow
        item={mockItem}
        onItemUpdated={handleUpdated}
        onItemDeleted={vi.fn()}
        onItemDeleteFailed={vi.fn()}
      />,
    );

    const textSpan = screen.getByText("Hoàn thành báo cáo");
    await user.click(textSpan);

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Viết test{Enter}");

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Viết test" }),
    );
  });

  it("Hủy chỉnh sửa tiêu đề bằng phím Escape", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistItemRow
        item={mockItem}
        onItemUpdated={handleUpdated}
        onItemDeleted={vi.fn()}
        onItemDeleteFailed={vi.fn()}
      />,
    );

    const textSpan = screen.getByText("Hoàn thành báo cáo");
    await user.click(textSpan);

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Nội dung nháp{Escape}");

    expect(handleUpdated).not.toHaveBeenCalled();
    expect(screen.getByText("Hoàn thành báo cáo")).toBeInTheDocument();
  });

  it("Không gọi hàm cập nhật nếu nội dung tiêu đề trống hoặc không đổi", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistItemRow
        item={mockItem}
        onItemUpdated={handleUpdated}
        onItemDeleted={vi.fn()}
        onItemDeleteFailed={vi.fn()}
      />,
    );

    const textSpan = screen.getByText("Hoàn thành báo cáo");
    await user.click(textSpan);

    const input = screen.getByRole("textbox");

    await user.clear(input);
    await user.type(input, "{Enter}");

    expect(handleUpdated).not.toHaveBeenCalled();
    expect(screen.getByText("Hoàn thành báo cáo")).toBeInTheDocument();
  });

  it("Hàm onItemDeleted được gọi đúng khi nhấn vào nút xóa", async () => {
    const handleDeleted = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistItemRow
        item={mockItem}
        onItemUpdated={vi.fn()}
        onItemDeleted={handleDeleted}
        onItemDeleteFailed={vi.fn()}
      />,
    );

    const deleteButton = screen.getByRole("button", {
      name: /xóa item/i,
    });
    await user.click(deleteButton);

    expect(handleDeleted).toHaveBeenCalledWith("item-1");
  });
});
