"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { deleteAccount, updateMyProfile } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import type { UserProfile, UserProfileUpdateRequest } from "@/lib/types";

const ROLE_LABEL: Record<UserProfile["role"], string> = {
    USER: "일반 회원",
    MANAGER: "시설 관리자",
    ADMIN: "관리자",
};

const REGION_GROUPS: Record<string, string[]> = {
    서울: ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    부산: ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
    대구: ["군위군", "남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
    인천: ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
    광주: ["광산구", "남구", "동구", "북구", "서구"],
    대전: ["대덕구", "동구", "서구", "유성구", "중구"],
    울산: ["남구", "동구", "북구", "울주군", "중구"],
    세종: ["세종시"],
    경기: ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
    강원: ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
    충북: ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
    충남: ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
    전북: ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
    전남: ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
    경북: ["경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
    경남: ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
    제주: ["서귀포시", "제주시"],
};

function resolveProvince(region: string) {
    return Object.keys(REGION_GROUPS).find((province) => region.startsWith(`${province} `)) ?? "";
}

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

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login?next=/mypage");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return <main className="auth-loading"><span className="auth-spinner" /></main>;
    }

    return (
        <main className="listing-page">
            <section className="listing-hero">
                <div className="container">
                    <Link href="/" className="listing-back-home">← 메인으로</Link>
                    <span className="eyebrow"><i /> MY PAGE</span>
                    <h1>안녕하세요,<br /><strong>{user.nickname}</strong>님</h1>
                    <p>프로필 정보를 확인하고 내 매치 기록을 살펴보세요.</p>
                </div>
            </section>

            <section className="listing-content">
                <div className="container" style={{ maxWidth: 760 }}>
                    <div className="manager-form" style={{ transform: "translateY(-43px)", marginBottom: -10 }}>
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

                    <div className="mypage-nav" style={{ paddingTop: 16 }}>
                        <Link href="/mypage/sports">종목별 실력 <small>등록·조회하기</small></Link>
                        <Link href="/mypage/matches">내 매치 <small>참가·결제 내역</small></Link>
                        <Link href="/mypage/records">플레이 기록 <small>경기·평가 통계</small></Link>
                        <Link href="/mypage/reviews">내 후기 <small>작성한 시설 후기</small></Link>
                        <Link href="/notifications">알림 <small>진행 상황 확인</small></Link>
                    </div>

                    <div style={{ marginTop: 28, borderTop: "1px solid var(--line)", paddingTop: 20, paddingBottom: 60 }}>
                        {deleteError ? <p className="form-message">{deleteError}</p> : null}
                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="manager-delete-button"
                            style={{ width: "100%" }}
                        >
                            {deleting ? "탈퇴 처리 중…" : "회원 탈퇴"}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}

function ProfileView({ user, onEdit }: { user: UserProfile; onEdit: () => void }) {
    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <Avatar src={user.profileImg} nickname={user.nickname} />
                <div>
                    <b style={{ fontSize: 17, display: "block" }}>{user.nickname}</b>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{user.email}</span>
                    <span style={{ display: "inline-flex", marginTop: 6, fontSize: 10, background: "#e5f2eb", color: "var(--green)", padding: "4px 8px", borderRadius: 4, fontWeight: 800 }}>
                        {ROLE_LABEL[user.role]}
                    </span>
                </div>
            </div>

            <div className="manager-readonly">
                <ReadOnlyItem label="포지션" value={user.position} />
                <ReadOnlyItem label="주 활동 지역" value={user.activeRegion} />
                <ReadOnlyItem label="선호 종목" value={user.preferredSport} />
                <ReadOnlyItem label="매너 점수" value={user.mannerScore?.toFixed(1) ?? null} />
                <ReadOnlyItem label="실력 점수" value={user.skillScore?.toFixed(1) ?? null} />
            </div>

            <div className="manager-card-actions" style={{ marginTop: 16 }}>
                <button type="button" onClick={onEdit}>프로필 수정</button>
                <Link href="/mypage/matches">내 매치 목록</Link>
            </div>
        </>
    );
}

function ReadOnlyItem({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <span>{label}</span>
            <b>{value ?? "-"}</b>
        </div>
    );
}

function Avatar({ src, nickname }: { src: string | null; nickname: string }) {
    if (src) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={nickname} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />;
    }
    return (
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#d0d9d4", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 800, color: "var(--muted)" }}>
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
    const [activeProvince, setActiveProvince] = useState(() => resolveProvince(user.activeRegion ?? ""));
    const [preferredSport, setPreferredSport] = useState(user.preferredSport ?? "");
    const [profileImg, setProfileImg] = useState(user.profileImg ?? "");
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(undefined);
        setSubmitting(true);

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
                <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={100} />
            </Field>
            <Field label="포지션" htmlFor="position">
                <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 공격수, 가드" maxLength={20} />
            </Field>
            <Field label="주 활동 지역" htmlFor="activeRegion">
                <div className="flow-grid">
                    <Select
                        id="activeProvince"
                        value={activeProvince}
                        onChange={(e) => {
                            setActiveProvince(e.target.value);
                            setActiveRegion("");
                        }}
                    >
                        <option value="">시/도 선택</option>
                        {Object.keys(REGION_GROUPS).map((province) => (
                            <option key={province} value={province}>
                                {province}
                            </option>
                        ))}
                    </Select>
                    <Select
                        id="activeRegion"
                        value={activeRegion}
                        onChange={(e) => setActiveRegion(e.target.value)}
                        disabled={!activeProvince}
                    >
                        <option value="">시/군/구 선택</option>
                        {(REGION_GROUPS[activeProvince] ?? []).map((district) => (
                            <option key={district} value={`${activeProvince} ${district}`}>
                                {district}
                            </option>
                        ))}
                        {activeRegion && !resolveProvince(activeRegion) ? (
                            <option value={activeRegion}>{activeRegion}</option>
                        ) : null}
                    </Select>
                </div>
            </Field>
            <Field label="선호 종목" htmlFor="preferredSport">
                <Input id="preferredSport" value={preferredSport} onChange={(e) => setPreferredSport(e.target.value)} placeholder="예: 축구, 농구" maxLength={50} />
            </Field>
            <Field label="프로필 이미지 URL" htmlFor="profileImg">
                <Input id="profileImg" type="url" value={profileImg} onChange={(e) => setProfileImg(e.target.value)} placeholder="https://..." maxLength={500} />
            </Field>
            <div className="flex gap-3">
                <Button type="submit" loading={submitting}>저장</Button>
                <Button type="button" onClick={onCancel} disabled={submitting} className="bg-white text-zinc-700 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-100">취소</Button>
            </div>
        </form>
    );
}
