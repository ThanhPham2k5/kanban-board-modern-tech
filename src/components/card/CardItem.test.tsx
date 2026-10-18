import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardItem } from "./CardItem";

vi.mock("@/actions/card-actions", () => ({
  updateCard: vi.fn().mockResolvedValue({ success: true }),
  deleteCard: vi.fn().mockResolvedValue({ success: true }),
}));

describe("CardItem Component", () => {
  const mockCard = {
    id: "card-1",
    list_id: "list-1",
    title: "Nhiệm vụ Frontend",
    description: "Mô tả chi tiết task",
    is_completed: false,
    order: "a0",
    checklists: [
      {
        id: "cl-1",
        card_id: "card-1",
        title: "Checklist 1",
        order: "a0",
        items: [
          {
            id: "item-1",
            checklist_id: "cl-1",
            content: "Subtask 1",
            is_checked: true,
            order: "a0",
          },
        ],
      },
    ],
  };

  it("Hiển thị đúng tiêu đề, trạng thái checkbox và tiến độ bên ngoài card", () => {
    render(
      <CardItem
        card={mockCard}
        onCardDeleted={vi.fn()}
        onCardUpdated={vi.fn()}
        onCardDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    expect(screen.getByText("Nhiệm vụ Frontend")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByText("✓ 1/1")).toBeInTheDocument();
  });

  it("Hiển thị giao diện khi item đã hoàn thành", () => {
    const completedCard = {
      ...mockCard,
      is_completed: true,
    };

    render(
      <CardItem
        card={completedCard}
        onCardDeleted={vi.fn()}
        onCardUpdated={vi.fn()}
        onCardDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    const titleEl = screen.getByText("Nhiệm vụ Frontend");
    expect(titleEl).toHaveClass("line-through");
  });

  it("Mở Dialog chi tiết khi click vào card", async () => {
    const user = userEvent.setup();

    render(
      <CardItem
        card={mockCard}
        onCardDeleted={vi.fn()}
        onCardUpdated={vi.fn()}
        onCardDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByText("Nhiệm vụ Frontend"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Nhập mô tả cho thẻ này..."),
    ).toHaveValue("Mô tả chi tiết task");
    expect(screen.getByText("Checklist 1")).toBeInTheDocument();
  });

  it("Gọi hàm cập nhật khi thay đổi trạng thái", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <CardItem
        card={mockCard}
        onCardDeleted={vi.fn()}
        onCardUpdated={handleUpdated}
        onCardDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card-1", is_completed: true }),
    );
  });

  it("Chuyển sang chế độ chỉnh sửa tiêu đề và lưu thay đổi khi nhấn Enter", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <CardItem
        card={mockCard}
        onCardDeleted={vi.fn()}
        onCardUpdated={handleUpdated}
        onCardDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByText("Nhiệm vụ Frontend"));

    const titleEl = screen.getByRole("heading", { name: "Nhiệm vụ Frontend" });
    await user.click(titleEl);

    const input = screen.getByDisplayValue("Nhiệm vụ Frontend");
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Nhiệm vụ đã đổi tên{Enter}");

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card-1", title: "Nhiệm vụ đã đổi tên" }),
    );
  });

  it("Hủy chỉnh sửa tiêu đề bằng phím Escape và giữ nguyên giá trị cũ", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <CardItem
        card={mockCard}
        onCardDeleted={vi.fn()}
        onCardUpdated={handleUpdated}
        onCardDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByText("Nhiệm vụ Frontend"));

    const titleEl = screen.getByRole("heading", { name: "Nhiệm vụ Frontend" });
    await user.click(titleEl);

    const input = screen.getByDisplayValue("Nhiệm vụ Frontend");
    await user.clear(input);
    await user.type(input, "Tiêu đề nháp{Escape}");

    expect(handleUpdated).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Nhiệm vụ Frontend" }),
    ).toBeInTheDocument();
  });

  it("Gọi onCardDeleted khi click vào nút xóa thẻ", async () => {
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <CardItem
        card={mockCard}
        onCardDeleted={handleDelete}
        onCardUpdated={vi.fn()}
        onCardDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByText("Nhiệm vụ Frontend"));

    const deleteButton = screen.getByRole("button", { name: /xóa thẻ/i });
    await user.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith("card-1");
  });
});
