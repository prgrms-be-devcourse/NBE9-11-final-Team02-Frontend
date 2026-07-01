# syntax=docker/dockerfile:1

# =========================
# 1️⃣ Dependencies Stage
# =========================
# package-lock.json 기준으로 의존성만 먼저 설치 → 소스 변경 시 레이어 캐시 재사용
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# =========================
# 2️⃣ Build Stage
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 텔레메트리 비활성화 (빌드 로그 정리 및 외부 전송 방지)
ENV NEXT_TELEMETRY_DISABLED=1

# Toss 결제창에서 사용하는 공개 클라이언트 키
# NEXT_PUBLIC_* 값은 Next.js 클라이언트 번들에 빌드 시점에 주입된다.
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY
ENV NEXT_PUBLIC_TOSS_CLIENT_KEY=${NEXT_PUBLIC_TOSS_CLIENT_KEY}

# next.config.ts의 output: "standalone" 설정으로 .next/standalone 생성
RUN npm run build

# =========================
# 3️⃣ Run Stage
# =========================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 비루트 사용자로 실행 (보안)
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# 정적 자산(public)과 standalone 산출물만 복사 → 경량 이미지
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# 컨테이너 외부에서 접근 가능하도록 0.0.0.0 바인딩
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone 번들이 생성한 최소 서버 진입점
CMD ["node", "server.js"]
