import { expect, test } from "@playwright/test";

test.describe("Checklist & ChecklistItem E2E Testing", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page
      .locator('input[name="email"]')
      .fill(process.env.BOT_TEST_EMAIL || "");
    await page
      .locator('input[name="password"]')
      .fill(process.env.BOT_TEST_PASSWORD || "");
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL("http://localhost:3000/");

    await expect(page.getByTestId("board-skeleton")).toBeHidden({
      timeout: 15_000,
    });
    await expect(page.getByTestId("board-add-btn")).toBeVisible({
      timeout: 15_000,
    });

    const addListBtn = page
      .getByRole("button", { name: "Thêm danh sách" })
      .first();
    await addListBtn.click();
    await expect(
      page.getByText("Đã tạo danh sách mới thành công").last(),
    ).toBeVisible();

    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .last();
    await addCardBtn.click();

    const cardInput = page.getByPlaceholder("Nhập tiêu đề thẻ công việc...");
    await cardInput.fill("Card Test Checklist");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    const cardItem = page.getByText("Card Test Checklist").last();
    await cardItem.click();
  });

  test("Test 01: Thêm checklist mới", async ({ page }) => {
    const addChecklistBtn = page.getByRole("button", {
      name: /thêm danh sách công việc/i,
    });
    await addChecklistBtn.click();

    const input = page.getByPlaceholder("Nhập tên checklist");
    await expect(input).toBeVisible();
    await input.fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    const checklistTitle = page.getByText("Checklist Mẫu").last();
    await expect(checklistTitle).toBeVisible();
  });

  test("Test 02: Sửa tiêu đề checklist", async ({ page }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    const titleEl = page.getByText("Checklist Mẫu").last();
    await titleEl.click();

    const input = page.locator("input.font-semibold").last();
    await input.fill("Checklist Đã Sửa");
    await input.press("Enter");

    await expect(page.getByText("Checklist Đã Sửa").last()).toBeVisible();
  });

  test("Test 03: Xóa checklist", async ({ page }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Đã Sửa");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    const deleteChecklistBtn = page
      .getByRole("button", { name: "Xóa checklist" })
      .last();
    await deleteChecklistBtn.click();

    await expect(page.getByText("Checklist Đã Sửa")).not.toBeVisible();
  });

  test("Test 04: Thêm checklist item vào checklist", async ({ page }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    const addItemBtn = page
      .getByRole("button", { name: /thêm một mục/i })
      .last();
    await addItemBtn.click();

    const input = page.getByPlaceholder("Thêm một mục công việc...");
    await expect(input).toBeVisible();
    await input.fill("Viết Unit Test");
    await page.getByRole("button", { name: "Thêm item" }).click();

    await expect(page.getByText("Viết Unit Test").last()).toBeVisible();
  });

  test("Test 05: Toggle trạng thái hoàn thành checklist item", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /thêm một mục/i })
      .last()
      .click();
    await page
      .getByPlaceholder("Thêm một mục công việc...")
      .fill("Viết Unit Test");
    await page.getByRole("button", { name: "Thêm item" }).click();

    const checkbox = page.getByRole("checkbox").last();
    await checkbox.click();

    const itemText = page.getByText("Viết Unit Test").last();
    await expect(itemText).toHaveClass(/line-through/);
  });

  test("Test 06: Sửa nội dung checklist item", async ({ page }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /thêm một mục/i })
      .last()
      .click();
    await page
      .getByPlaceholder("Thêm một mục công việc...")
      .fill("Viết Unit Test");
    await page.getByRole("button", { name: "Thêm item" }).click();

    const itemText = page.getByText("Viết Unit Test").last();
    await itemText.click();

    const input = page.locator("input.text-sm.px-2\\.5").last();
    await input.fill("Viết E2E Test");
    await input.press("Enter");

    await expect(page.getByText("Viết E2E Test").last()).toBeVisible();
  });

  test("Test 07: Xóa checklist item", async ({ page }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /thêm một mục/i })
      .last()
      .click();
    await page
      .getByPlaceholder("Thêm một mục công việc...")
      .fill("Viết E2E Test");
    await page.getByRole("button", { name: "Thêm item" }).click();

    const deleteItemBtn = page.getByRole("button", { name: "Xóa item" }).last();
    await deleteItemBtn.click();

    await expect(page.getByText("Viết E2E Test")).not.toBeVisible();
  });

  test("Test 08: Di chuyển checklist item bằng bàn phím", async ({ page }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /thêm một mục/i })
      .last()
      .click();
    await page
      .getByPlaceholder("Thêm một mục công việc...")
      .fill("Item Thứ Nhất");
    await page.getByRole("button", { name: "Thêm item" }).click();
    await expect(page.getByText("Tạo item thành công!").last()).toBeVisible();

    await page
      .getByRole("button", { name: /thêm một mục/i })
      .last()
      .click();
    await page
      .getByPlaceholder("Thêm một mục công việc...")
      .fill("Item Thứ Hai");
    await page.getByRole("button", { name: "Thêm item" }).click();
    await expect(page.getByText("Tạo item thành công!").last()).toBeVisible();

    const dragHandle = page
      .getByRole("button", { name: "Kéo để sắp xếp", exact: true })
      .first();
    await dragHandle.focus();
    await page.keyboard.press("Alt+ArrowDown");

    const rows = page.locator(
      ".group.relative.flex.items-center.justify-between",
    );
    await expect(rows.first()).toContainText("Item Thứ Hai");
  });

  test("Test 09: Di chuyển checklist item bằng chuột", async ({ page }) => {
    await page
      .getByRole("button", { name: /thêm danh sách công việc/i })
      .click();
    await page.getByPlaceholder("Nhập tên checklist").fill("Checklist Mẫu");
    await page.getByRole("button", { name: "Thêm checklist" }).click();
    await expect(
      page.getByText("Đã tạo checklist mới thành công").last(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /thêm một mục/i })
      .last()
      .click();
    await page
      .getByPlaceholder("Thêm một mục công việc...")
      .fill("Item Thứ Nhất");
    await page.getByRole("button", { name: "Thêm item" }).click();
    await expect(page.getByText("Tạo item thành công!").last()).toBeVisible();

    await page
      .getByRole("button", { name: /thêm một mục/i })
      .last()
      .click();
    await page
      .getByPlaceholder("Thêm một mục công việc...")
      .fill("Item Thứ Hai");
    await page.getByRole("button", { name: "Thêm item" }).click();
    await expect(page.getByText("Tạo item thành công!").last()).toBeVisible();

    const rowFirst = page.locator(
      ".group.relative.flex.items-center.justify-between",
      {
        hasText: "Item Thứ Nhất",
      },
    );
    const rowSecond = page.locator(
      ".group.relative.flex.items-center.justify-between",
      {
        hasText: "Item Thứ Hai",
      },
    );

    const sourceHandle = rowFirst.getByRole("button", {
      name: "Kéo để sắp xếp",
      exact: true,
    });
    const targetHandle = rowSecond.getByRole("button", {
      name: "Kéo để sắp xếp",
      exact: true,
    });

    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();

    if (sourceBox && targetBox) {
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2,
      );
      await page.mouse.down();

      const dropX = targetBox.x + targetBox.width / 2;
      const dropY = targetBox.y + targetBox.height * 0.75;

      await page.mouse.move(dropX, dropY, { steps: 15 });

      await page.mouse.up();
    }

    const rows = page.locator(
      ".group.relative.flex.items-center.justify-between",
    );
    await expect(rows.first()).toContainText("Item Thứ Hai");
  });

  test.afterEach(async ({ page }) => {
    await page.keyboard.press("Escape");

    const deleteButton = page.getByTestId("delete-list-btn").last();
    if (await deleteButton.isVisible()) {
      page.once("dialog", (dialog) => dialog.accept());
      await deleteButton.click();
      await expect(page.getByText("Xoá thành công!").last()).toBeVisible();
    }
  });
});
