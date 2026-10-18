import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardSection } from "./CardSection";

vi.mock("@/actions/card-actions", () => ({
  createCard: vi.fn().mockResolvedValue({ success: true }),
  updateCardOrder: vi.fn().mockResolvedValue({ success: true }),

  updateCard: vi.fn().mockResolvedValue({ success: true }),
  deleteCard: vi.fn().mockResolvedValue({ success: true }),
}));

describe("CardSection Component", () => {
  const mockCards = [
    {
      id: "card-1",
      list_id: "list-1",
      title: "Nhiệm vụ 1",
      description: "Mô tả 1",
      is_completed: false,
      order: "a0",
      checklists: [],
    },
    {
      id: "card-2",
      list_id: "list-1",
      title: "Nhiệm vụ 2",
      description: "Mô tả 2",
      is_completed: true,
      order: "a1",
      checklists: [],
    },
  ];

  it("Hiển thị đúng danh sách các thẻ và nút thêm thẻ", () => {
    render(
      <CardSection
        listId="list-1"
        cards={mockCards}
        onChange={vi.fn()}
        onCardMoveAcrossLists={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    expect(screen.getByText("Nhiệm vụ 1")).toBeInTheDocument();
    expect(screen.getByText("Nhiệm vụ 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm thẻ mới/i }),
    ).toBeInTheDocument();
  });

  it("Mở form thêm thẻ khi click vào nút Thêm thẻ mới", async () => {
    const user = userEvent.setup();

    render(
      <CardSection
        listId="list-1"
        cards={mockCards}
        onChange={vi.fn()}
        onCardMoveAcrossLists={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    const addButton = screen.getByRole("button", { name: /thêm thẻ mới/i });
    await user.click(addButton);

    expect(
      screen.getByPlaceholderText("Nhập tiêu đề thẻ công việc..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm thẻ/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hủy/i })).toBeInTheDocument();
  });

  it("Đóng form và xóa nội dung khi click nút Hủy", async () => {
    const user = userEvent.setup();

    render(
      <CardSection
        listId="list-1"
        cards={mockCards}
        onChange={vi.fn()}
        onCardMoveAcrossLists={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /thêm thẻ mới/i }));

    const input = screen.getByPlaceholderText("Nhập tiêu đề thẻ công việc...");

    await user.type(input, "Tiêu đề nháp");
    expect(input).toHaveValue("Tiêu đề nháp");

    const cancelButton = screen.getByRole("button", { name: /hủy/i });
    await user.click(cancelButton);

    expect(
      screen.queryByPlaceholderText("Nhập tiêu đề thẻ công việc..."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm thẻ mới/i }),
    ).toBeInTheDocument();
  });

  it("Thêm card thành công và gọi hàm onChange", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CardSection
        listId="list-1"
        cards={mockCards}
        onChange={handleChange}
        onCardMoveAcrossLists={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /thêm thẻ mới/i }));

    const input = screen.getByPlaceholderText("Nhập tiêu đề thẻ công việc...");
    await user.type(input, "Thẻ mới từ server{Enter}");

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Thẻ mới từ server",
        }),
      ]),
    );
  });

  it("Không gọi hàm createCard nếu input trống hoặc chỉ chứa khoảng trắng", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CardSection
        listId="list-1"
        cards={mockCards}
        onChange={handleChange}
        onCardMoveAcrossLists={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /thêm thẻ mới/i }));

    const input = screen.getByPlaceholderText("Nhập tiêu đề thẻ công việc...");

    await user.type(input, "   {Enter}");

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("Xóa card con và gọi hàm onChange với mảng cards đã lọc bỏ card đó", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CardSection
        listId="list-1"
        cards={mockCards}
        onChange={handleChange}
        onCardMoveAcrossLists={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByText("Nhiệm vụ 1"));

    const deleteButton = screen.getByRole("button", { name: /xóa thẻ/i });
    await user.click(deleteButton);

    expect(handleChange).toHaveBeenCalledWith([mockCards[1]]);
  });

  it("Cập nhật card con và gọi hàm onChange với card đã được cập nhật nội dung", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CardSection
        listId="list-1"
        cards={mockCards}
        onChange={handleChange}
        onCardMoveAcrossLists={vi.fn()}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByText("Nhiệm vụ 1"));

    const titleEl = screen.getByRole("heading", { name: "Nhiệm vụ 1" });
    await user.click(titleEl);

    const input = screen.getByDisplayValue("Nhiệm vụ 1");
    await user.clear(input);
    await user.type(input, "Nhiệm vụ 1 đã đổi tên{Enter}");

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "card-1",
          title: "Nhiệm vụ 1 đã đổi tên",
        }),
      ]),
    );
  });
});
