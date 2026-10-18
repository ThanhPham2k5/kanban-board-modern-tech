import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChecklistCard } from "./ChecklistCard";

vi.mock("@/actions/checklist-actions", () => ({
  updateChecklist: vi.fn().mockResolvedValue({ success: true }),
  deleteChecklist: vi.fn().mockResolvedValue({ success: true }),
  createChecklistItem: vi.fn().mockResolvedValue({ success: true }),

  updateChecklistItem: vi.fn().mockResolvedValue({ success: true }),
  deleteChecklistItem: vi.fn().mockResolvedValue({ success: true }),
}));

describe("ChecklistCard Component", () => {
  const mockChecklist = {
    id: "checklist-1",
    card_id: "card-1",
    title: "Danh sách công việc",
    order: "a0",
    items: [
      {
        id: "item-1",
        checklist_id: "checklist-1",
        content: "Nhiệm vụ 1",
        is_checked: true,
        order: "a0",
      },
      {
        id: "item-2",
        checklist_id: "checklist-1",
        content: "Nhiệm vụ 2",
        is_checked: false,
        order: "a1",
      },
    ],
  };

  it("Hiển thị đúng tiêu đề, danh sách item và tính toán tiến độ", () => {
    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={vi.fn()}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    expect(screen.getByText("Danh sách công việc")).toBeInTheDocument();
    expect(screen.getByText("Nhiệm vụ 1")).toBeInTheDocument();
    expect(screen.getByText("Nhiệm vụ 2")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("Chuyển sang chế độ chỉnh sửa tiêu đề và lưu thay đổi khi nhấn Enter", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={handleUpdated}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    const titleEl = screen.getByText("Danh sách công việc");
    await user.click(titleEl);

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Kế hoạch tuần mới{Enter}");

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Kế hoạch tuần mới" }),
    );
  });

  it("Không gọi hàm cập nhật nếu nội dung tiêu đề trống hoặc không đổi", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={handleUpdated}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    const titleEl = screen.getByText("Danh sách công việc");
    await user.click(titleEl);

    const input = screen.getByRole("textbox");

    await user.clear(input);
    await user.type(input, "{Enter}");

    expect(handleUpdated).not.toHaveBeenCalled();
    expect(screen.getByText("Danh sách công việc")).toBeInTheDocument();
  });

  it("Hủy chỉnh sửa tiêu đề bằng phím Escape", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={handleUpdated}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    const titleEl = screen.getByText("Danh sách công việc");
    await user.click(titleEl);

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Tiêu đề nháp{Escape}");

    expect(handleUpdated).not.toHaveBeenCalled();
    expect(screen.getByText("Danh sách công việc")).toBeInTheDocument();
  });

  it("Hàm onChecklistDeleted được gọi đúng khi nhấn vào nút xóa", async () => {
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={handleDelete}
        onChecklistUpdated={vi.fn()}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: /xóa checklist/i });
    await user.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith("checklist-1");
  });

  it("Mở form thêm item khi click vào nút Thêm một mục", async () => {
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={vi.fn()}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    const addButton = screen.getByRole("button", { name: /thêm một mục/i });
    await user.click(addButton);

    const input = screen.getByPlaceholderText("Thêm một mục công việc...");
    expect(input).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm item/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hủy/i })).toBeInTheDocument();
  });

  it("Đóng form và xóa nội dung khi click nút Hủy", async () => {
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={vi.fn()}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /thêm một mục/i }));

    const input = screen.getByPlaceholderText("Thêm một mục công việc...");
    await user.type(input, "Nội dung nháp");

    await user.click(screen.getByRole("button", { name: /hủy/i }));

    expect(
      screen.queryByPlaceholderText("Thêm một mục công việc..."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm một mục/i }),
    ).toBeInTheDocument();
  });

  it("Thêm item mới thành công và gọi hàm onChecklistUpdated", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={handleUpdated}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /thêm một mục/i }));

    const input = screen.getByPlaceholderText("Thêm một mục công việc...");
    await user.type(input, "Nghiên cứu tài liệu mới{Enter}");

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ content: "Nghiên cứu tài liệu mới" }),
        ]),
      }),
    );
  });

  it("Cập nhật lại thanh tiến độ và gọi onChecklistUpdated khi một item con được check", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={handleUpdated}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: "item-2", is_checked: true }),
        ]),
      }),
    );
  });

  it("Xóa item con thành công và gọi onChecklistUpdated với danh sách đã lọc bỏ", async () => {
    const handleUpdated = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistCard
        checklist={mockChecklist}
        onChecklistDeleted={vi.fn()}
        onChecklistUpdated={handleUpdated}
        onChecklistDeleteFailed={vi.fn()}
        onMove={vi.fn()}
        onMoveItem={vi.fn()}
        isFocused={null}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: /xóa item/i });
    await user.click(deleteButtons[0]);

    expect(handleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [expect.objectContaining({ id: "item-2" })],
      }),
    );
  });
});
