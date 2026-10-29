import { expect, test } from "@playwright/test";

test.describe("Card E2E Testing", () => {
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
  });

  test("Test 01: Thêm Card mới", async ({ page }) => {
    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .last();
    await addCardBtn.click();

    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Mẫu");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();

    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();
    await expect(page.getByText("Card Mẫu").last()).toBeVisible();
  });

  test("Test 02: Sửa tiêu đề Card", async ({ page }) => {
    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .last();
    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Cũ");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    await page.getByText("Card Cũ").last().click();
    await page.getByText("Card Cũ").last().click();

    const modalTitleInput = page.locator("input.w-full.font-bold").last();
    await modalTitleInput.fill("Card Đã Sửa");
    await modalTitleInput.press("Enter");

    await expect(
      page.getByText("Sửa tiêu đề card thành công!").last(),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText("Card Đã Sửa").last()).toBeVisible();
  });

  test("Test 03: Cập nhật mô tả chi tiết cho Card", async ({ page }) => {
    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .last();
    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Mô Tả");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    await page.getByText("Card Mô Tả").last().click();
    await page.getByText("Card Mô Tả").last().click();

    const textarea = page.getByPlaceholder("Nhập mô tả cho thẻ này...");
    await textarea.fill("Nội dung mô tả chi tiết test E2E.");
    await textarea.blur();

    await expect(
      page.getByText("Sửa mô tả card thành công!").last(),
    ).toBeVisible();
  });

  test("Test 04: Toggle trạng thái hoàn thành Card", async ({ page }) => {
    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .last();
    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Hoàn Thành");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    const cardContainer = page
      .locator(".group", { hasText: "Card Hoàn Thành" })
      .last();
    await cardContainer.getByRole("checkbox").click();

    await expect(
      page.getByText("Cập nhật trạng thái card thành công!").last(),
    ).toBeVisible();
    await expect(cardContainer.locator(".font-semibold")).toHaveClass(
      /line-through/,
    );
  });

  test("Test 05: Xóa Card", async ({ page }) => {
    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .first();
    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Sẽ Xóa");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    await page.getByText("Card Sẽ Xóa").last().click();
    await page.getByText("Card Sẽ Xóa").last().click();
    await page.getByRole("button", { name: "Xóa thẻ" }).click();

    await expect(page.getByText("Xóa card thành công!").last()).toBeVisible();
    await expect(page.getByText("Card Sẽ Xóa")).not.toBeVisible();
  });

  test("Test 06: Di chuyển thẻ bằng bàn phím", async ({ page }) => {
    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .last();

    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Thứ Nhất");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Thứ Hai");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    const rowFirst = page
      .locator(".group", { hasText: "Card Thứ Nhất" })
      .last();
    const dragHandle = rowFirst.getByRole("button", {
      name: "Kéo sắp xếp thẻ",
    });

    await dragHandle.focus();
    await page.keyboard.press("Alt+ArrowDown");

    const cards = page.locator(".group", { hasText: /Card Thứ/ });
    await expect(cards.first()).toContainText("Card Thứ Hai");
  });

  test("Test 07: Di chuyển thẻ bằng chuột", async ({ page }) => {
    const addCardBtn = page
      .getByRole("button", { name: "Thêm thẻ mới" })
      .last();

    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Thứ Nhất");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    await addCardBtn.click();
    await page
      .getByPlaceholder("Nhập tiêu đề thẻ công việc...")
      .fill("Card Thứ Hai");
    await page.getByRole("button", { name: "Thêm thẻ", exact: true }).click();
    await expect(
      page.getByText("Đã tạo thẻ mới thành công").last(),
    ).toBeVisible();

    const rowFirst = page
      .locator(".group", { hasText: "Card Thứ Nhất" })
      .last();
    const rowSecond = page
      .locator(".group", { hasText: "Card Thứ Hai" })
      .last();

    const sourceHandle = rowFirst.getByRole("button", {
      name: "Kéo sắp xếp thẻ",
    });
    const targetHandle = rowSecond.getByRole("button", {
      name: "Kéo sắp xếp thẻ",
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

    const cards = page.locator(".group", { hasText: /Card Thứ/ });
    await expect(cards.first()).toContainText("Card Thứ Hai");
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
