# 1. Base image
FROM node:22-alpine AS base

# 2. Cài đặt dependencies
FROM base AS deps
# Cài libc6-compat cần thiết cho một số thư viện native
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 3. Build mã nguồn
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Cung cấp biến môi trường public lúc build để Next.js tạo trang tĩnh
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG BOT_TEST_EMAIL
ARG BOT_TEST_PASSWORD
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV BOT_TEST_EMAIL=$BOT_TEST_EMAIL
ENV BOT_TEST_PASSWORD=$BOT_TEST_PASSWORD

RUN npm run build

# 4. Môi trường chạy thực tế (Production)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Tạo user không có quyền root để tăng bảo mật
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy thư mục public và các file đã được build từ bước Builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]