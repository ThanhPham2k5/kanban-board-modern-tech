import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChecklistSection } from "./ChecklistSection";

vi.mock("@/actions/checklist-actions", () => ({
  createChecklist: vi.fn().mockResolvedValue({ success: true }),
  updateChecklistOrder: vi.fn().mockResolvedValue({ success: true }),
  updateChecklistItemOrder: vi.fn().mockResolvedValue({ success: true }),

  updateChecklist: vi.fn().mockResolvedValue({ success: true }),
  deleteChecklist: vi.fn().mockResolvedValue({ success: true }),
}));

describe("ChecklistSection Component", () => {
  const mockChecklists = [
    {
      id: "cl-1",
      card_id: "card-1",
      title: "Nhóm việc 1",
      order: "a0",
      items: [],
    },
  ];

  it("Hiển thị danh sách ChecklistCard tương ứng với dữ liệu truyền vào", () => {
    render(
      <ChecklistSection
        cardId="card-1"
        checklists={mockChecklists}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Nhóm việc 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm danh sách công việc/i }),
    ).toBeInTheDocument();
  });

  it("Mở form thêm checklist khi click vào nút Thêm danh sách công việc", async () => {
    const user = userEvent.setup();

    render(
      <ChecklistSection
        cardId="card-1"
        checklists={mockChecklists}
        onChange={vi.fn()}
      />,
    );

    const addBtn = screen.getByRole("button", {
      name: /thêm danh sách công việc/i,
    });
    await user.click(addBtn);

    expect(
      screen.getByPlaceholderText("Nhập tên checklist"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm checklist/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hủy/i })).toBeInTheDocument();
  });

  it("Đóng form và xóa nội dung khi click nút Hủy", async () => {
    const user = userEvent.setup();

    render(
      <ChecklistSection
        cardId="card-1"
        checklists={mockChecklists}
        onChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /thêm danh sách công việc/i }),
    );

    const input = screen.getByPlaceholderText("Nhập tên checklist");
    await user.type(input, "Nội dung nháp");

    await user.click(screen.getByRole("button", { name: /hủy/i }));

    expect(
      screen.queryByPlaceholderText("Nhập tên checklist"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm danh sách công việc/i }),
    ).toBeInTheDocument();
  });

  it("Thêm checklist mới thành công và gọi hàm onChange", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistSection
        cardId="card-1"
        checklists={mockChecklists}
        onChange={handleChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /thêm danh sách công việc/i }),
    );

    const input = screen.getByPlaceholderText("Nhập tên checklist");
    await user.type(input, "Nhóm việc 2{Enter}");

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: "Nhóm việc 2" }),
      ]),
    );
  });

  it("Xóa checklist con thành công và gọi hàm onChange với mảng đã lọc bỏ phần tử đó", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    const multipleChecklists = [
      {
        id: "cl-1",
        card_id: "card-1",
        title: "Nhóm việc 1",
        order: "a0",
        items: [],
      },
      {
        id: "cl-2",
        card_id: "card-1",
        title: "Nhóm việc 2",
        order: "a1",
        items: [],
      },
    ];

    render(
      <ChecklistSection
        cardId="card-1"
        checklists={multipleChecklists}
        onChange={handleChange}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", {
      name: /xóa checklist/i,
    });
    await user.click(deleteButtons[0]);

    expect(handleChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "cl-2", title: "Nhóm việc 2" }),
    ]);
  });

  it("Cập nhật thông tin checklist con thành công và gọi hàm onChange với dữ liệu mới", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ChecklistSection
        cardId="card-1"
        checklists={mockChecklists}
        onChange={handleChange}
      />,
    );

    const titleEl = screen.getByText("Nhóm việc 1");
    await user.click(titleEl);

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Nhóm việc đã đổi tên{Enter}");

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "cl-1", title: "Nhóm việc đã đổi tên" }),
      ]),
    );
  });
});
