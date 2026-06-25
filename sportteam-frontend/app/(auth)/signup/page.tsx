"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { signup } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import type { UserRole } from "@/lib/types";

interface FieldErrors {
    email?: string;
    password?: string;
    passwordConfirm?: string;
    nickname?: string;
}

function validate(
    email: string,
    password: string,
    passwordConfirm: string,
    nickname: string,
): FieldErrors {
    const errors: FieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "이메일 형식이 올바르지 않습니다.";
    }
    if (password.length < 8 || password.length > 64) {
        errors.password = "비밀번호는 8자 이상 64자 이하입니다.";
    }
    if (password !== passwordConfirm) {
        errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }
    if (!nickname.trim()) {
        errors.nickname = "닉네임은 필수입니다.";
    } else if (nickname.length > 100) {
        errors.nickname = "닉네임은 100자 이하입니다.";
    }
    return errors;
}

export default function SignupPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState<UserRole>("USER");

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(undefined);

        const errors = validate(email, password, passwordConfirm, nickname);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        try {
            await signup({ email, password, nickname, role, provider: "LOCAL" });
            router.push("/login?registered=1");
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? err.message
                    : "회원가입에 실패했습니다. 다시 시도해주세요.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-zinc-900">회원가입</h1>
                <p className="text-sm text-zinc-500">SportTeam 계정을 만들어보세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <FormError message={error} />

                <Field label="이메일" htmlFor="email" error={fieldErrors.email}>
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

                <Field label="비밀번호" htmlFor="password" error={fieldErrors.password}>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="8자 이상 64자 이하"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Field>

                <Field
                    label="비밀번호 확인"
                    htmlFor="passwordConfirm"
                    error={fieldErrors.passwordConfirm}
                >
                    <Input
                        id="passwordConfirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                    />
                </Field>

                <Field label="닉네임" htmlFor="nickname" error={fieldErrors.nickname}>
                    <Input
                        id="nickname"
                        type="text"
                        autoComplete="nickname"
                        placeholder="닉네임"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                    />
                </Field>

                <Field label="회원 유형" htmlFor="role">
                    <Select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                        <option value="USER">일반 회원</option>
                        <option value="MANAGER">시설 관리자</option>
                    </Select>
                </Field>

                <Button type="submit" loading={submitting}>
                    회원가입
                </Button>
            </form>

            <p className="text-center text-sm text-zinc-500">
                이미 계정이 있으신가요?{" "}
                <Link
                    href="/login"
                    className="font-medium text-zinc-900 underline-offset-4 hover:underline"
                >
                    로그인
                </Link>
            </p>
        </div>
    );
}