"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
    const { user, loading, logout } = useAuth();

    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-4 py-16">
            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                    SportTeam
                </h1>
                <p className="max-w-md text-zinc-600">
                    스포츠 시설을 예약하고 팀을 매칭하세요.
                </p>
            </div>

            {loading ? (
                <p className="text-sm text-zinc-400">불러오는 중…</p>
            ) : user ? (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-zinc-700">
                        <span className="font-semibold">{user.nickname}</span>님, 환영합니다.
                    </p>
                    <div className="flex gap-3">
                        <Link
                            href="/matches"
                            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                        >
                            매치 찾기
                        </Link>
                        <Link
                            href="/facilities"
                            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                            시설 찾기
                        </Link>
                        <Link
                            href="/mypage"
                            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                            마이페이지
                        </Link>
                        <button
                            onClick={() => void logout()}
                            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <Link
                        href="/matches"
                        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                        매치 찾기
                    </Link>
                    <Link
                        href="/facilities"
                        className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                        시설 찾기
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                        로그인
                    </Link>
                    <Link
                        href="/signup"
                        className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                        회원가입
                    </Link>
                </div>
            )}
        </main>
    );
}