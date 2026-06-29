"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const justRegistered = searchParams.get("registered") === "1";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(undefined);
        setSubmitting(true);
        try {
            await login({ email, password });
            const next = searchParams.get("next");
            router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? err.message
                    : "로그인에 실패했습니다. 다시 시도해주세요.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="listing-page">
            <section className="listing-hero">
                <div className="container">
                    <Link href="/" className="listing-back-home">← 메인으로</Link>
                    <span className="eyebrow"><i /> ACCOUNT</span>
                    <h1>다시 만나서<br /><strong>반가워요!</strong></h1>
                    <p>플레이온 계정으로 로그인하고 팀을 찾아보세요.</p>
                </div>
            </section>

            <section className="listing-content">
                <div className="container">
                    <div className="listing-form-card">
                        <h2>로그인</h2>
                        <p>플레이온 계정으로 로그인하세요.</p>
                        {justRegistered ? (
                            <p className="form-message" style={{ color: "var(--green)" }}>
                                회원가입이 완료되었습니다. 로그인해주세요.
                            </p>
                        ) : null}
                        {error ? <p className="form-message">{error}</p> : null}
                        <form onSubmit={handleSubmit} className="auth-form" noValidate>
                            <label htmlFor="email">
                                이메일
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </label>
                            <label htmlFor="password">
                                비밀번호
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </label>
                            <button type="submit" className="auth-submit" disabled={submitting}>
                                {submitting ? "로그인 중…" : "로그인"}
                            </button>
                        </form>
                        <p className="auth-switch">
                            아직 계정이 없으신가요?{" "}
                            <Link href="/signup">회원가입</Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
