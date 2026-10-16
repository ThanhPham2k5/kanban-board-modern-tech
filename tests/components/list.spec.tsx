import { test, expect } from "@playwright/experimental-ct-react";
import ListContainer from "@/components/ListContainer";

// mock list data
const mockList = {
  id: "list-1",
  title: "Danh sách mẫu",
  order: "a0",
  cards: [],
};

test.describe("Test list components", () => {
  test("Test 01: Render đúng tiêu đề danh sách", async ({ mount }) => {
    const component = await mount(
      <ListContainer
        list={mockList}
        onUpdateTitle={() => {}}
        onDelete={() => {}}
        onMoveList={() => {}}
        onChange={() => {}}
        handleCardMoveAcrossLists={() => {}}
      />,
    );

    await expect(component.getByTestId("list-title")).toHaveText(
      "Danh sách mẫu",
    );
  });

  test("Test 02: Cập nhật tiêu đề danh sách", async ({ mount }) => {
    let updateId = "";
    let updateTitle = "";

    const component = await mount(
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
      />,
    );

    await component.getByTestId("list-title").click();

    const input = component.getByTestId("list-title-input");
    await expect(input).toBeVisible();
    await input.fill("Tiêu đề mới");
    await input.press("Enter");

    expect(updateId).toBe("list-1");
    expect(updateTitle).toBe("Tiêu đề mới");
  });

  test("Test 03: Xoá danh sách khi ấn nút xoá", async ({ mount }) => {
    let deleteId = "";

    const component = await mount(
      <ListContainer
        list={mockList}
        onUpdateTitle={() => {}}
        onDelete={(id) => {
          deleteId = id;
        }}
        onMoveList={() => {}}
        onChange={() => {}}
        handleCardMoveAcrossLists={() => {}}
      />,
    );

    const deleteBtn = component.getByTestId("delete-list-btn");
    await deleteBtn.click();

    expect(deleteId).toBe("list-1");
  });

  test("Test 04: Di chuyển danh sách bằng bàn phím (Ctrl + Arrow)", async ({
    mount,
  }) => {
    let moveDirection = "";

    const component = await mount(
      <ListContainer
        list={mockList}
        onUpdateTitle={() => {}}
        onDelete={() => {}}
        onMoveList={(id, direction) => {
          moveDirection = direction;
        }}
        onChange={() => {}}
        handleCardMoveAcrossLists={() => {}}
      />,
    );

    const dragHandle = component.getByTestId("list-drag-handle");
    await dragHandle.focus();
    await dragHandle.press("Control+ArrowRight");
    expect(moveDirection).toBe("right");

    await dragHandle.focus();
    await dragHandle.press("Control+ArrowLeft");
    expect(moveDirection).toBe("left");
  });
});
