"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Select } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";
import { getMatchRecommendations } from "@/lib/match";
import {
    REQUIRED_GENDER_LABEL,
    SPORT_TYPE_LABEL,
    formatSkillRange,
} from "@/lib/match-labels";
import type {
    MatchRecommendationResponse,
    RequiredGender,
    SportType,
} from "@/lib/types";

const SPORT_TYPES: SportType[] = [
    "FUTSAL",
    "SOCCER",
    "BASKETBALL",
    "TENNIS",
    "BADMINTON",
];
const GENDERS: RequiredGender[] = ["ANY", "MALE", "FEMALE", "MIXED"];

function isSportType(value: string | null): value is SportType {
    return value !== null && (SPORT_TYPES as string[]).includes(value);
}

export default function RecommendationsPage() {
    return (
        <RequireAuth>
            <Recommendations />
        </RequireAuth>
    );
}

function Recommendations() {
    const { user } = useAuth();
    const preferred = user?.preferredSport ?? null;

    const [sportType, setSportType] = useState<SportType>(
        isSportType(preferred) ? preferred : "FUTSAL",
    );
    const [gender, setGender] = useState<RequiredGender | "">("");
    const [items, setItems] = useState<MatchRecommendationResponse[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const result = await getMatchRecommendations({
                sportType,
                gender: gender || undefined,
                size: 10,
            });
            setItems(result);
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : "추천 매치를 불러오지 못했습니다.",
            );
            setItems(undefined);
        } finally {
            setLoading(false);
        }
    }, [sportType, gender]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    return (
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-4xl">
                <Link
                    href="/matches"
                    className="mb-6 inline-block text-sm text-zinc-500 underline-offset-4 hover:underline"
                >
                    ← 매치 찾기
                </Link>
                <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900">
                    맞춤 추천 매치
                </h1>
                <p className="mb-6 text-sm text-zinc-500">
                    선호 종목과 실력·활동 정보를 바탕으로 추천된 매치예요.
                </p>

                <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            종목
                        </label>
                        <Select
                            value={sportType}
                            onChange={(e) =>
                                setSportType(e.target.value as SportType)
                            }
                        >
                            {SPORT_TYPES.map((s) => (
                                <option key={s} value={s}>
                                    {SPORT_TYPE_LABEL[s]}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            성별 조건
                        </label>
                        <Select
                            value={gender}
                            onChange={(e) =>
                                setGender(e.target.value as RequiredGender | "")
                            }
                        >
                            <option value="">전체</option>
                            {GENDERS.map((g) => (
                                <option key={g} value={g}>
                                    {REQUIRED_GENDER_LABEL[g]}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {loading ? (
                    <p className="py-12 text-center text-sm text-zinc-400">
                        불러오는 중…
                    </p>
                ) : error ? (
                    <p className="py-12 text-center text-sm text-red-600">{error}</p>
                ) : !items || items.length === 0 ? (
                    <p className="py-12 text-center text-sm text-zinc-400">
                        추천할 매치가 아직 없어요. 다른 종목을 선택해보세요.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {items.map((m) => (
                            <RecommendationCard key={m.matchId} match={m} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

function RecommendationCard({ match }: { match: MatchRecommendationResponse }) {
    const full = match.currentCount >= match.capacity;

    return (
        <Link
            href={`/matches/${match.matchId}`}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-zinc-900">{match.title}</h2>
                <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    추천 {match.recommendationScore}점
                </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {SPORT_TYPE_LABEL[match.sportType]}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {REQUIRED_GENDER_LABEL[match.requiredGender]}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {formatSkillRange(match.minSkillLevel, match.maxSkillLevel)}
                </span>
            </div>

            {match.reasons.length > 0 ? (
                <ul className="flex flex-col gap-1">
                    {match.reasons.map((reason, i) => (
                        <li
                            key={`${match.matchId}-reason-${i}`}
                            className="flex items-start gap-1.5 text-xs text-zinc-500"
                        >
                            <span className="text-emerald-500">✓</span>
                            {reason}
                        </li>
                    ))}
                </ul>
            ) : null}

            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-sm">
                <span className={full ? "font-medium text-red-600" : "text-zinc-600"}>
                    {match.currentCount}/{match.capacity}명
                </span>
                <strong className="text-zinc-900">
                    {match.feePerPerson.toLocaleString()}원
                </strong>
            </div>
        </Link>
    );
}
