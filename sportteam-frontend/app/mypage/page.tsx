"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, FormError, Input } from "@/components/ui";
import { deleteAccount, updateMyProfile } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import type { UserProfile, UserProfileUpdateRequest } from "@/lib/types";

const ROLE_LABEL: Record<UserProfile["role"], string> = {
    USER: "일반 회원",
    MANAGER: "시설 관리자",
    ADMIN: "관리자",
};

export default function MyPage() {
    const router = useRouter();
    const { user, loading, refreshProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string>();

    async function handleDeleteAccount() {
        if (
            !window.confirm(
                "회원 탈퇴 시 계정과 관련 정보가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠어요?",
            )
        ) {
            return;
        }
        setDeleting(true);
        setDeleteError(undefined);
        try {
            await deleteAccount();
            window.location.href = "/";
        } catch (e) {
            setDeleteError(
                e instanceof ApiError ? e.message : "회원 탈퇴에 실패했습니다.",
            );
            setDeleting(false);
        }
    }

    // 미로그인 시 로그인 페이지로 (로그인 후 돌아오도록 next 지정)
    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login?next=/mypage");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <main className="flex flex-1 items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-400">불러오는 중…</p>
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        마이페이지
                    </h1>
                    <Link
                        href="/"
                        className="text-sm text-zinc-500 underline-offset-4 hover:underline"
                    >
                        홈으로
                    </Link>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    {editing ? (
                        <ProfileEditForm
                            user={user}
                            onCancel={() => setEditing(false)}
                            onSaved={async () => {
                                await refreshProfile();
                                setEditing(false);
                            }}
                        />
                    ) : (
                        <ProfileView user={user} onEdit={() => setEditing(true)} />
                    )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link href="/mypage/sports" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">종목별 실력 <span className="mt-1 block text-xs font-normal text-zinc-400">등록·조회하기</span></Link>
                    <Link href="/mypage/matches" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">내 매치 <span className="mt-1 block text-xs font-normal text-zinc-400">참가·결제 내역</span></Link>
                    <Link href="/mypage/records" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">플레이 기록 <span className="mt-1 block text-xs font-normal text-zinc-400">경기·평가 통계</span></Link>
                    <Link href="/notifications" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">알림 <span className="mt-1 block text-xs font-normal text-zinc-400">진행 상황 확인</span></Link>
                    <Link href="/mypage/records" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">플레이 기록 <span className="mt-1 block text-xs font-normal text-zinc-400">경기·평가 통계</span></Link>
                    <Link href="/mypage/reviews" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">내 후기 <span className="mt-1 block text-xs font-normal text-zinc-400">작성한 시설 후기</span></Link>
                    <Link href="/notifications" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">알림 <span className="mt-1 block text-xs font-normal text-zinc-400">진행 상황 확인</span></Link>
                    <Link href="/notifications" className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400">알림 <span className="mt-1 block text-xs font-normal text-zinc-400">진행 상황 확인</span></Link>
                </div>

                <div className="mt-8 border-t border-zinc-100 pt-6">
                    {deleteError ? (
                        <p className="mb-3 text-sm text-red-600">{deleteError}</p>
                    ) : null}
                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="text-sm font-medium text-red-500 underline-offset-4 hover:underline disabled:opacity-50"
                    >
                        {deleting ? "탈퇴 처리 중…" : "회원 탈퇴"}
                    </button>
                </div>
            </div>
        </main>
    );
}

function ProfileView({
                         user,
                         onEdit,
                     }: {
    user: UserProfile;
    onEdit: () => void;
}) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Avatar src={user.profileImg} nickname={user.nickname} />
                <div className="flex flex-col">
          <span className="text-lg font-semibold text-zinc-900">
            {user.nickname}
          </span>
                    <span className="text-sm text-zinc-500">{user.email}</span>
                    <span className="mt-1 inline-flex w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
            {ROLE_LABEL[user.role]}
          </span>
                </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-zinc-100 pt-6">
                <ReadOnlyItem label="포지션" value={user.position} />
                <ReadOnlyItem label="주 활동 지역" value={user.activeRegion} />
                <ReadOnlyItem label="선호 종목" value={user.preferredSport} />
                <ReadOnlyItem
                    label="매너 점수"
                    value={user.mannerScore?.toFixed(1) ?? null}
                />
                <ReadOnlyItem
                    label="실력 점수"
                    value={user.skillScore?.toFixed(1) ?? null}
                />
            </dl>

            <div className="flex gap-3">
                <Button type="button" onClick={onEdit}>
                    프로필 수정
                </Button>
                <Link
                    href="/mypage/matches"
                    className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                    내 매치 목록
                </Link>
            </div>
        </div>
    );
}

function ReadOnlyItem({
                          label,
                          value,
                      }: {
    label: string;
    value: string | null;
}) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-zinc-500">{label}</dt>
            <dd className="text-sm text-zinc-900">{value ?? "-"}</dd>
        </div>
    );
}

function Avatar({
                    src,
                    nickname,
                }: {
    src: string | null;
    nickname: string;
}) {
    if (src) {
        // 외부 이미지 URL — next/image 도메인 설정 부담을 피하기 위해 img 사용
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={nickname}
                className="h-16 w-16 rounded-full object-cover"
            />
        );
    }
    return (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-xl font-semibold text-zinc-500">
            {nickname.charAt(0).toUpperCase()}
        </div>
    );
}

function ProfileEditForm({
                             user,
                             onCancel,
                             onSaved,
                         }: {
    user: UserProfile;
    onCancel: () => void;
    onSaved: () => Promise<void>;
}) {
    const [nickname, setNickname] = useState(user.nickname ?? "");
    const [position, setPosition] = useState(user.position ?? "");
    const [activeRegion, setActiveRegion] = useState(user.activeRegion ?? "");
    const [preferredSport, setPreferredSport] = useState(
        user.preferredSport ?? "",
    );
    const [profileImg, setProfileImg] = useState(user.profileImg ?? "");

    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(undefined);
        setSubmitting(true);

        // 빈 문자열은 보내지 않고, 변경된 값만 전송
        const trimmed: UserProfileUpdateRequest = {
            nickname: nickname.trim() || undefined,
            position: position.trim() || undefined,
            activeRegion: activeRegion.trim() || undefined,
            preferredSport: preferredSport.trim() || undefined,
            profileImg: profileImg.trim() || undefined,
        };

        try {
            await updateMyProfile(trimmed);
            await onSaved();
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? err.message
                    : "프로필 수정에 실패했습니다. 다시 시도해주세요.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <FormError message={error} />

            <Field label="닉네임" htmlFor="nickname">
                <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={100}
                />
            </Field>

            <Field label="포지션" htmlFor="position">
                <Input
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="예: 공격수, 가드"
                    maxLength={20}
                />
            </Field>

            <Field label="주 활동 지역" htmlFor="activeRegion">
                <Input
                    id="activeRegion"
                    value={activeRegion}
                    onChange={(e) => setActiveRegion(e.target.value)}
                    placeholder="예: 서울 강남구"
                    maxLength={100}
                />
            </Field>

            <Field label="선호 종목" htmlFor="preferredSport">
                <Input
                    id="preferredSport"
                    value={preferredSport}
                    onChange={(e) => setPreferredSport(e.target.value)}
                    placeholder="예: 축구, 농구"
                    maxLength={50}
                />
            </Field>

            <Field label="프로필 이미지 URL" htmlFor="profileImg">
                <Input
                    id="profileImg"
                    type="url"
                    value={profileImg}
                    onChange={(e) => setProfileImg(e.target.value)}
                    placeholder="https://..."
                    maxLength={500}
                />
            </Field>

            <div className="flex gap-3">
                <Button type="submit" loading={submitting}>
                    저장
                </Button>
                <Button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="bg-white text-zinc-700 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-100"
                >
                    취소
                </Button>
            </div>
        </form>
    );
}