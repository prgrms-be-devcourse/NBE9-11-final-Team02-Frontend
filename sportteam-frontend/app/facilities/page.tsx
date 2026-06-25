"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Select } from "@/components/ui";
import { getAvailableFacilities } from "@/lib/facility";
import { ApiError } from "@/lib/http";
import type { FacilityAvailableResponse, PageResponse, SportType } from "@/lib/types";

const SPORT_TYPE_LABEL: Record<SportType, string> = {
    FUTSAL: "풋살",
    SOCCER: "축구",
    BASKETBALL: "농구",
    TENNIS: "테니스",
    BADMINTON: "배드민턴",
};

const PAGE_SIZE = 12;

export default function FacilitiesPage() {
    const [sportType, setSportType] = useState<SportType | "">("");
    const [region, setRegion] = useState("");
    const [date, setDate] = useState("");

    const [page, setPage] = useState(0);
    const [data, setData] = useState<PageResponse<FacilityAvailableResponse>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getAvailableFacilities({
            sportType: sportType || undefined,
            region: region.trim() || undefined,
            date: date || undefined,
            page,
            size: PAGE_SIZE,
        })
            .then((res) => {
                if (!active) return;
                setData(res);
            })
            .catch((err) => {
                if (!active) return;
                setError(
                    err instanceof ApiError
                        ? err.message
                        : "시설 목록을 불러오지 못했습니다.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [sportType, region, date, page]);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setPage(0);
    }

    return (
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-4xl">
                <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900">
                    시설 찾기
                </h1>

                <form
                    onSubmit={handleSearch}
                    className="mb-8 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
                >
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            종목
                        </label>
                        <Select
                            value={sportType}
                            onChange={(e) => setSportType(e.target.value as SportType | "")}
                        >
                            <option value="">전체</option>
                            {Object.entries(SPORT_TYPE_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            지역
                        </label>
                        <input
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="예: 서울 강남구"
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                            날짜
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                        />
                    </div>
                    <Button type="submit" className="sm:w-32">
                        검색
                    </Button>
                </form>

                {loading ? (
                    <p className="py-12 text-center text-sm text-zinc-400">불러오는 중…</p>
                ) : error ? (
                    <p className="py-12 text-center text-sm text-red-600">{error}</p>
                ) : !data || data.content.length === 0 ? (
                    <p className="py-12 text-center text-sm text-zinc-400">
                        검색 결과가 없습니다.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {data.content.map((facility) => (
                                <FacilityCard key={facility.facilityId} facility={facility} />
                            ))}
                        </div>

                        <Pagination
                            page={data.number}
                            totalPages={data.totalPages}
                            onChange={setPage}
                        />
                    </>
                )}
            </div>
        </main>
    );
}

function FacilityCard({ facility }: { facility: FacilityAvailableResponse }) {
    return (
        <Link
            href={`/facilities/${facility.facilityId}`}
            className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-zinc-100">
                {facility.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={facility.thumbnailUrl}
                        alt={facility.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                        이미지 없음
                    </div>
                )}
            </div>
            <h2 className="font-semibold text-zinc-900">{facility.name}</h2>
            <p className="text-sm text-zinc-500">{facility.address}</p>
            <div className="flex flex-wrap gap-1.5">
                {facility.sportTypes.map((sport) => (
                    <span
                        key={sport}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
                    >
            {SPORT_TYPE_LABEL[sport]}
          </span>
                ))}
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-zinc-900">
          평일 {facility.defaultWeekdayPrice.toLocaleString()}원
        </span>
                <span className="text-zinc-500">
          ★ {facility.ratingAvg.toFixed(1)} ({facility.reviewCount})
        </span>
            </div>
        </Link>
    );
}

function Pagination({
                        page,
                        totalPages,
                        onChange,
                    }: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-8 flex items-center justify-center gap-2">
            <button
                type="button"
                disabled={page === 0}
                onClick={() => onChange(page - 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                이전
            </button>
            <span className="text-sm text-zinc-600">
        {page + 1} / {totalPages}
      </span>
            <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => onChange(page + 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                다음
            </button>
        </div>
    );
}