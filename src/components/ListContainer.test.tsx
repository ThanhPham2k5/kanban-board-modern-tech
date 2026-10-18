import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ListContainer from "./ListContainer";

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

const mockList = {
  id: "list-1",
  title: "Danh sách mẫu",
  order: "a0",
  cards: [],
};

describe("Test list components (Vitest)", () => {
  it("Test 01: Render đúng tiêu đề danh sách", () => {
    render(
      <ListContainer
        list={mockList}
        onUpdateTitle={() => {}}
        onDelete={() => {}}
        onMoveList={() => {}}
        onChange={() => {}}
        handleCardMoveAcrossLists={() => {}}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    expect(screen.getByTestId("list-title")).toHaveTextContent("Danh sách mẫu");
  });

  it("Test 02: Cập nhật tiêu đề danh sách", async () => {
    const user = userEvent.setup();
    let updateId = "";
    let updateTitle = "";

    render(
      <ListContainer
        list={mockList}
        onUpdateTitle={(id, title) => {
          updateId = id;
          updateTitle = title;
        }}
        onDelete={() => {}}
        onMoveList={() => {}}
        onChange={() => {}}
        handleCardMoveAcrossLists={() => {}}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    const titleElement = screen.getByTestId("list-title");
    await user.click(titleElement);

    const input = screen.getByTestId("list-title-input");
    expect(input).toBeVisible();

    await user.clear(input);
    await user.type(input, "Tiêu đề mới");
    await user.keyboard("{Enter}");

    expect(updateId).toBe("list-1");
    expect(updateTitle).toBe("Tiêu đề mới");
  });

  it("Test 03: Xoá danh sách khi ấn nút xoá", async () => {
    const user = userEvent.setup();
    let deleteId = "";

    render(
      <ListContainer
        list={mockList}
        onUpdateTitle={() => {}}
        onDelete={(id) => {
          deleteId = id;
        }}
        onMoveList={() => {}}
        onChange={() => {}}
        handleCardMoveAcrossLists={() => {}}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    const deleteBtn = screen.getByTestId("delete-list-btn");
    await user.click(deleteBtn);

    expect(deleteId).toBe("list-1");
  });

  it("Test 04: Di chuyển danh sách bằng bàn phím (Ctrl + Arrow)", async () => {
    const user = userEvent.setup();
    let moveDirection = "";

    render(
      <ListContainer
        list={mockList}
        onUpdateTitle={() => {}}
        onDelete={() => {}}
        onMoveList={(id, direction) => {
          moveDirection = direction;
        }}
        onChange={() => {}}
        handleCardMoveAcrossLists={() => {}}
        onMoveAcrossLists={vi.fn()}
        isFocused={null}
      />,
    );

    const dragHandle = screen.getByTestId("list-drag-handle");
    dragHandle.focus();

    await user.keyboard("{Control>}›{ArrowRight}{/Control}");
    expect(moveDirection).toBe("right");

    dragHandle.focus();

    await user.keyboard("{Control>}›{ArrowLeft}{/Control}");
    expect(moveDirection).toBe("left");
  });
});
