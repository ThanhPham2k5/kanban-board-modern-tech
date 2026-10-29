# Kanban Board (Next.js 16 + Supabase)

Ứng dụng quản lý công việc dạng bảng Kanban, làm cho học phần _Các công nghệ lập trình hiện đại_ (nhóm 09). Công nghệ chính: **Next.js 16** (App Router, Server Component, Server Action). Dữ liệu lưu trên Supabase (PostgreSQL + Auth).

## Chức năng

- Đăng ký, đăng nhập, đăng xuất (Supabase Auth). Người chưa đăng nhập bị chuyển về `/login` bởi `src/proxy.ts`.
- Một bảng duy nhất tại trang chủ `/`, gồm list, card, checklist và checklist item (thêm, sửa, xóa).
- Kéo thả list, card, checklist item bằng chuột (`@atlaskit/pragmatic-drag-and-drop`) và di chuyển bằng bàn phím.
- Thứ tự lưu bằng Fractional Indexing (`fractional-indexing`), mỗi lần di chuyển chỉ cập nhật một hàng.
- Cập nhật lạc quan (optimistic update) viết bằng `useState`, có rollback cho phần lớn thao tác.
- Chế độ sáng/tối, giao diện Tailwind CSS v4 và shadcn/ui.

## Công nghệ

| Thành phần       | Phiên bản                                                      |
| ---------------- | -------------------------------------------------------------- |
| Next.js          | 16.3.5                                                         |
| React            | 19.2.8                                                         |
| TypeScript       | 5.9.3                                                          |
| Supabase         | `@supabase/supabase-js` 2.x, `@supabase/ssr`                   |
| Kiểm tra đầu vào | Zod 4                                                          |
| Kiểm thử         | Vitest 5, React Testing Library, Playwright 1.62.1             |
| Node.js          | 22 (Dockerfile và CI dùng Node 22; Next.js 16 yêu cầu từ 20.9) |

## Cấu trúc thư mục

```
src/
  app/            Route (App Router): trang chủ, đăng nhập, đăng ký, layout gốc
  actions/        Server Action ("use server"): list, card, checklist, xác thực
  components/     Component giao diện (BoardView, ListContainer, card/, checklist/, ui/)
  lib/            Supabase client (server.ts, client.ts), schema Zod, kiểu dữ liệu
  proxy.ts        Kiểm tra phiên và chuyển hướng trước khi vào route
tests/e2e/        Kiểm thử End-to-End (Playwright)
.github/workflows/playwright.yml   CI: Vitest rồi Playwright
Dockerfile, docker-compose.yml     Đóng gói chế độ standalone
```

## Chạy dự án trên máy

1. Cài Node.js 22 và Git.
2. Tạo project Supabase và chuẩn bị cơ sở dữ liệu (xem mục "Cơ sở dữ liệu" bên dưới).
3. Cài thư viện:

   ```bash
   npm ci
   ```

4. Tạo file cấu hình môi trường:

   ```bash
   cp .env.example .env.local
   ```

   Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` trong `.env.local`.

5. Chạy:

   ```bash
   npm run dev
   ```

   Mở http://localhost:3000, đăng ký một tài khoản rồi đăng nhập.

## Cơ sở dữ liệu

Ứng dụng dùng bốn bảng trong schema `public` của Supabase. Không có bảng Board riêng.

| Bảng             | Cột (theo code)                                                  |
| ---------------- | ---------------------------------------------------------------- |
| `lists`          | `id`, `user_id`, `title`, `order`                                |
| `cards`          | `id`, `list_id`, `title`, `description`, `is_completed`, `order` |
| `checklists`     | `id`, `card_id`, `title`, `order`                                |
| `checklistitems` | `id`, `checklist_id`, `content`, `is_checked`, `order`           |

- Cột `order` kiểu chuỗi, dùng collation `"C"` để so sánh theo thứ tự từ điển đúng với Fractional Indexing.
- Phải bật Row Level Security cho cả bốn bảng: `lists` lọc theo `user_id`, ba bảng còn lại chỉ cho thao tác khi bảng cha thuộc về người dùng đang đăng nhập (xem mục 1.3.4 của báo cáo).
- Lưu ý: repo hiện chưa có file SQL tạo bảng và policy. Bảng và policy cần được tạo thủ công trên Supabase theo mô tả trên.

## Biến môi trường

| Biến                                   | Dùng cho                          | Bắt buộc         |
| -------------------------------------- | --------------------------------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL project Supabase              | Có               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (anon key)        | Có               |
| `BOT_TEST_EMAIL`, `BOT_TEST_PASSWORD`  | Tài khoản test cho Playwright E2E | Chỉ khi chạy E2E |

Không đặt `service_role` key vào biến `NEXT_PUBLIC_*` hoặc vào mã nguồn.

## Kiểm thử

Kiểm thử component (Vitest, 47 test trong 8 file):

```bash
npx vitest run
```

Kiểm thử End-to-End (Playwright, 27 test trong `tests/e2e`). Cần `.env.local` có `BOT_TEST_EMAIL` và `BOT_TEST_PASSWORD` của một tài khoản đã đăng ký sẵn:

```bash
npx playwright install chromium
npx playwright test --project=chromium
```

Playwright tự chạy `npm run build && npm run start` trước khi test. CI chỉ chạy trình duyệt Chromium.

## Docker

```bash
docker compose --env-file .env.local up -d --build
```

Ứng dụng chạy ở http://localhost:3000. Image dùng chế độ `standalone` của Next.js (biến `BUILD_STANDALONE=true` được đặt trong Dockerfile).

## CI

`.github/workflows/playwright.yml` chạy hai job: Vitest, rồi Playwright E2E. Workflow chạy khi push vào nhánh `feature/list-dnd` và khi tạo pull request vào `main` hoặc `master`. Các secret cần khai trong GitHub: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `BOT_TEST_EMAIL`, `BOT_TEST_PASSWORD`.

## Giới hạn đã biết

- Chưa có kiểm thử tự động cho rollback khi Server Action lỗi, cho RLS với nhiều tài khoản, và cho `proxy.ts`.
- Kéo thả list bằng chuột chưa có rollback khi ghi thất bại.
- Chưa hỗ trợ cộng tác thời gian thực: thay đổi của người này chỉ hiện ở người khác sau khi tải lại trang.

## Giấy phép

Xem file `LICENSE`.
