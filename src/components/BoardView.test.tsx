import { addListAction } from "@/actions/list-actions";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import BoardView from "./BoardView";

vi.mock("@/actions/list-actions", () => ({
  addListAction: vi.fn().mockResolvedValue({ id: "l-new", success: true }),
}));

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

describe("BoardView Component", () => {
  const mockLists = [
    {
      id: "l-1",
      title: "List 1",
      order: "a0",
      cards: [],
    },
    {
      id: "l-2",
      title: "List 2",
      order: "a1",
      cards: [],
    },
  ];

  it("Hiển thị danh sách List và nút Thêm danh sách", () => {
    render(<BoardView initialLists={mockLists} />);

    expect(screen.getByText("List 1")).toBeInTheDocument();
    expect(screen.getByText("List 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thêm danh sách/i }),
    ).toBeInTheDocument();
  });

  it("Thêm list mới thành công và gọi hàm onChange", async () => {
    const user = userEvent.setup();

    render(<BoardView initialLists={mockLists} />);

    await user.click(screen.getByRole("button", { name: /thêm danh sách/i }));

    expect(addListAction).toHaveBeenCalledWith(
      "Danh sách mới",
      expect.any(String),
    );
  });
});
