"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Field, FormError, Input } from "@/components/ui";
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
            router.push(next && next.startsWith("/") ? next : "/");
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-zinc-900">로그인</h1>
                <p className="text-sm text-zinc-500">SportTeam 계정으로 로그인하세요.</p>
            </div>

            {justRegistered ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                    회원가입이 완료되었습니다. 로그인해주세요.
                </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <FormError message={error} />

                <Field label="이메일" htmlFor="email">
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </Field>

                <Field label="비밀번호" htmlFor="password">
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Field>

                <Button type="submit" loading={submitting}>
                    로그인
                </Button>
            </form>

            <p className="text-center text-sm text-zinc-500">
                아직 계정이 없으신가요?{" "}
                <Link
                    href="/signup"
                    className="font-medium text-zinc-900 underline-offset-4 hover:underline"
                >
                    회원가입
                </Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}