import { test, expect } from "@playwright/test";

test.describe("test thêm list", () => {
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
  });

  test.afterEach(async ({ page }) => {
    const deleteButton = page.getByTestId("delete-list-btn").last();
    if (await deleteButton.isVisible()) {
      page.once("dialog", (dialog) => dialog.accept());

      await deleteButton.click();

      const successToast = page.getByText("Xoá thành công!").last();
      await successToast.waitFor({ state: "visible" });
    }
  });

  test("Test 01: Thêm danh sách mới bằng nút thêm ở header", async ({
    page,
  }) => {
    const addButton = page
      .locator("header")
      .getByRole("button", { name: "Thêm danh sách" });
    await addButton.click();

    const successToast = page
      .getByText("Đã tạo danh sách mới thành công")
      .last();
    await expect(successToast).toBeVisible();
  });

  test("Test 02: Thêm danh sách mới bằng nút thêm ở danh sách list", async ({
    page,
  }) => {
    const addButton = page
      .locator("main")
      .getByRole("button", { name: "Thêm danh sách" });
    await addButton.click();

    const successToast = page
      .getByText("Đã tạo danh sách mới thành công")
      .last();
    await expect(successToast).toBeVisible();
  });
});

test.describe("test sửa list", () => {
  test.describe.configure({ mode: "serial" });

  // create a dummy list before testing
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

    const addButton = page
      .getByRole("button", { name: "Thêm danh sách" })
      .first();
    await addButton.click();

    const successToast = page
      .getByText("Đã tạo danh sách mới thành công")
      .last();
    await successToast.waitFor({ state: "visible" });
  });

  test.afterEach(async ({ page }) => {
    const deleteButton = page.getByTestId("delete-list-btn").last();
    if (await deleteButton.isVisible()) {
      page.once("dialog", (dialog) => dialog.accept());

      await deleteButton.click();

      const successToast = page.getByText("Xoá thành công!").last();
      await successToast.waitFor({ state: "visible" });
    }
  });

  test("Test 01: Cập nhật thành công", async ({ page }) => {
    const titleHeader = page.getByTestId("list-title").last();
    await titleHeader.click();

    const titleInput = page.getByTestId("list-title-input").last();
    // await titleInput.click();
    await titleInput.fill("Test");
    await titleInput.press("Enter");

    const successToast = page.getByText("Cập nhật thành công!").last();
    await expect(successToast).toBeVisible();
    await expect(titleHeader).toHaveText("Test");
  });

  test("Test 02: Cập nhật tiêu đề trống", async ({ page }) => {
    const titleHeader = page.getByTestId("list-title").last();
    await titleHeader.click();

    const titleInput = page.getByTestId("list-title-input").last();
    // await titleInput.click();
    await titleInput.fill("");
    await titleInput.press("Enter");

    const errorToast = page.getByText(/Cập nhật thất bại/i).last();
    await expect(errorToast).toBeVisible();
  });

  test("Test 03: Cập nhật tiêu đề chứa mã độc", async ({ page }) => {
    const titleHeader = page.getByTestId("list-title").last();
    await titleHeader.click();

    const titleInput = page.getByTestId("list-title-input").last();
    // await titleInput.click();
    await titleInput.fill("Test ".repeat(20));
    await titleInput.press("Enter");

    const errorToast = page.getByText(/Cập nhật thất bại/i).last();
    await expect(errorToast).toBeVisible();
  });

  test("Test 04: Cập nhật tiêu đề chứa mã độc", async ({ page }) => {
    const titleHeader = page.getByTestId("list-title").last();
    await titleHeader.click();

    const titleInput = page.getByTestId("list-title-input").last();
    // await titleInput.click();
    await titleInput.fill("<script>Hacking...</script>");
    await titleInput.press("Enter");

    const errorToast = page.getByText(/Cập nhật thất bại/i).last();
    await expect(errorToast).toBeVisible();
  });
});

test.describe("test xoá list", () => {
  test.describe.configure({ mode: "serial" });

  // create a dummy list before testing
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

    const addButton = page
      .getByRole("button", { name: "Thêm danh sách" })
      .first();
    await addButton.click();

    const successToast = page
      .getByText("Đã tạo danh sách mới thành công")
      .last();
    await successToast.waitFor({ state: "visible" });
  });

  test("Test 01: Huỷ bỏ khi có hộp thoại xác nhận xoá", async ({ page }) => {
    const listContainers = page.getByTestId("list-container");
    const initialNumber = await listContainers.count();

    page.once("dialog", (dialog) => dialog.dismiss());

    const deleteButton = page.getByTestId("delete-list-btn").last();
    await deleteButton.click();

    const finalNumber = await listContainers.count();
    expect(finalNumber).toEqual(initialNumber);

    const errorToast = page.getByText("Không tìm thấy danh sách");
    await expect(errorToast).not.toBeVisible();

    // clean up
    page.once("dialog", (dialog) => dialog.accept());
    await deleteButton.click();

    const successToast = page.getByText("Xoá thành công!").last();
    await expect(successToast).toBeVisible();
  });

  test("Test 02: Xác nhận khi có hộp thoại xác nhận xoá", async ({ page }) => {
    const listContainers = page.getByTestId("list-container");
    const initialNumber = await listContainers.count();

    page.on("dialog", (dialog) => dialog.accept());

    const titleHeader = page.getByTestId("list-title").last();
    const deletedTitle = await titleHeader.textContent();

    const deleteButton = page.getByTestId("delete-list-btn").last();
    await deleteButton.click();

    const finalNumber = await listContainers.count();
    expect(finalNumber).toEqual(initialNumber - 1);

    const successToast = page.getByText("Xoá thành công!").last();
    await expect(successToast).toBeVisible();

    const deletedList = page.getByText(deletedTitle as string, { exact: true });
    await expect(deletedList).toHaveCount(0);
  });
});

test.describe("test sửa & xoá bằng bàn phím", () => {
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

    const addButton = page
      .getByRole("button", { name: "Thêm danh sách" })
      .first();
    await addButton.click();

    const successToast = page
      .getByText("Đã tạo danh sách mới thành công")
      .last();
    await successToast.waitFor({ state: "visible" });
  });

  test("Sửa tiêu đề bằng bàn phím Tab -> Spacebar -> Type -> Enter", async ({
    page,
  }) => {
    const dragHandle = page
      .getByRole("button", { name: /Nhấn Enter để sửa tên/i })
      .last();
    await dragHandle.focus();
    await dragHandle.press("Space");
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Sửa bằng bàn phím");
    await page.keyboard.press("Enter");

    const successToast = page.getByText("Cập nhật thành công!").last();
    await expect(successToast).toBeVisible();

    const titleHeader = page.getByTestId("list-title").last();
    await expect(titleHeader).toHaveText("Sửa bằng bàn phím");

    // clean up
    const deleteButton = page.getByTestId("delete-list-btn").last();
    if (await deleteButton.isVisible()) {
      page.once("dialog", (dialog) => dialog.accept());
      await deleteButton.click();

      const successToast = page.getByText("Xoá thành công!").last();
      await successToast.waitFor({ state: "visible" });
    }
  });

  test("Xoá danh sách bằng bàn phím Tab -> Enter -> Accept/Dismiss", async ({
    page,
  }) => {
    const listContainers = page.getByTestId("list-container");
    const initialNumber = await listContainers.count();

    const deleteButton = page.getByTestId("delete-list-btn").last();

    page.once("dialog", (dialog) => dialog.accept());

    await deleteButton.focus();
    await deleteButton.press("Enter");

    const finalNumber = await listContainers.count();
    expect(finalNumber).toEqual(initialNumber - 1);

    const successToast = page.getByText("Xoá thành công!").last();
    await expect(successToast).toBeVisible();
  });
});

test.describe("test kéo thả danh sách", () => {
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

    const addButton = page
      .getByRole("button", { name: "Thêm danh sách" })
      .first();

    await addButton.click();
    await page
      .getByText("Đã tạo danh sách mới thành công")
      .last()
      .waitFor({ state: "visible" });

    const firstListTitle = page.getByTestId("list-title").last();
    await firstListTitle.click();
    await page.getByTestId("list-title-input").last().fill("List A");
    await page.keyboard.press("Enter");
    await page
      .getByText("Cập nhật thành công!")
      .last()
      .waitFor({ state: "visible" });

    await addButton.click();
    await page
      .getByText("Đã tạo danh sách mới thành công")
      .last()
      .waitFor({ state: "visible" });

    const secondListTitle = page.getByTestId("list-title").last();
    await secondListTitle.click();
    await page.getByTestId("list-title-input").last().fill("List B");
    await page.keyboard.press("Enter");
    await page
      .getByText("Cập nhật thành công!")
      .last()
      .waitFor({ state: "visible" });
  });

  test.afterEach(async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      const deleteBtn = page.getByTestId("delete-list-btn").last();
      if (await deleteBtn.isVisible()) {
        page.once("dialog", (dialog) => dialog.accept());
        await deleteBtn.click();
        await page
          .getByText("Xoá thành công!")
          .last()
          .waitFor({ state: "visible" });
      }
    }
  });

  test("di chuyển danh sách A bằng bàn phím (Control + Mũi tên)", async ({
    page,
  }) => {
    const dragHandleA = page.getByTestId("list-drag-handle").nth(-2);
    await dragHandleA.focus();
    await page.keyboard.press("Control+ArrowRight");
    await page.waitForTimeout(500);

    await expect(page.getByTestId("list-title").nth(-2)).toHaveText("List B");
    await expect(page.getByTestId("list-title").nth(-1)).toHaveText("List A");

    const currentDragHandleA = page.getByTestId("list-drag-handle").nth(-1);
    await currentDragHandleA.focus();
    await page.keyboard.press("Control+ArrowLeft");
    await page.waitForTimeout(500);

    await expect(page.getByTestId("list-title").nth(-2)).toHaveText("List A");
  });

  // test("di chuyển danh sách A bằng chuột (Drag & Drop)", async ({ page }) => {
  //   const dragHandleA = page.getByTestId("list-drag-handle").nth(-2);
  //   const dragHandleB = page.getByTestId("list-drag-handle").nth(-1);

  //   // await dragHandleA.dragTo(dragHandleB);

  //   const boxA = await dragHandleA.boundingBox();
  //   const boxB = await dragHandleB.boundingBox();

  //   if (boxA && boxB) {
  //     await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
  //     await page.mouse.down();
  //     await page.mouse.move(boxB.x + 10, boxB.y + boxB.height / 2, {
  //       steps: 15,
  //     });
  //     await page.waitForTimeout(200);
  //     await page.mouse.up();
  //   }

  //   await page.waitForTimeout(500);

  //   await expect(page.getByTestId("list-title").nth(-2)).toHaveText("List B");
  //   await expect(page.getByTestId("list-title").nth(-1)).toHaveText("List A");
  // });
});
