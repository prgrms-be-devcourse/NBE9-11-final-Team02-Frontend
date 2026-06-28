"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

const fieldErrorStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--coral)",
    marginTop: -4,
};

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
        <main className="listing-page">
            <section className="listing-hero">
                <div className="container">
                    <Link href="/" className="listing-back-home">← 메인으로</Link>
                    <span className="eyebrow"><i /> SIGN UP</span>
                    <h1>함께 뛸 준비,<br /><strong>회원가입</strong></h1>
                    <p>계정을 만들고 가까운 경기장에서 매치를 시작해보세요.</p>
                </div>
            </section>

            <section className="listing-content">
                <div className="container">
                    <div className="listing-form-card">
                        <h2>회원가입</h2>
                        <p>플레이온 계정을 만들어보세요.</p>
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
                                {fieldErrors.email ? <span style={fieldErrorStyle}>{fieldErrors.email}</span> : null}
                            </label>
                            <label htmlFor="password">
                                비밀번호
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="8자 이상 64자 이하"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {fieldErrors.password ? <span style={fieldErrorStyle}>{fieldErrors.password}</span> : null}
                            </label>
                            <label htmlFor="passwordConfirm">
                                비밀번호 확인
                                <input
                                    id="passwordConfirm"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="비밀번호를 다시 입력하세요"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    required
                                />
                                {fieldErrors.passwordConfirm ? <span style={fieldErrorStyle}>{fieldErrors.passwordConfirm}</span> : null}
                            </label>
                            <label htmlFor="nickname">
                                닉네임
                                <input
                                    id="nickname"
                                    type="text"
                                    autoComplete="nickname"
                                    placeholder="닉네임"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    required
                                />
                                {fieldErrors.nickname ? <span style={fieldErrorStyle}>{fieldErrors.nickname}</span> : null}
                            </label>
                            <label htmlFor="role">
                                회원 유형
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                >
                                    <option value="USER">일반 회원</option>
                                    <option value="MANAGER">시설 관리자</option>
                                </select>
                            </label>
                            <button type="submit" className="auth-submit" disabled={submitting}>
                                {submitting ? "처리 중…" : "회원가입"}
                            </button>
                        </form>
                        <p className="auth-switch">
                            이미 계정이 있으신가요?{" "}
                            <Link href="/login">로그인</Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
