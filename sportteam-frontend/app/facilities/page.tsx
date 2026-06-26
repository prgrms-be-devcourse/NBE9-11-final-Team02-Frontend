"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui";
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
    const [reloadKey, setReloadKey] = useState(0);
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
    }, [sportType, region, date, page, reloadKey]);

function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setPage(0);
    }

    return (
        <main className="listing-page">
            <section className="listing-hero facility-listing-hero">
                <div className="container">
                    <Link href="/" className="listing-back-home">← 메인으로</Link>
                    <span className="eyebrow coral"><i /> FACILITY</span>
                    <h1>우리 팀에 맞는<br /><strong>경기장 찾기</strong></h1>
                    <p>종목, 지역, 날짜를 기준으로 예약 가능한 경기장을 확인하세요.</p>
                </div>
            </section>

            <section className="listing-content">
                <div className="container">
                <form
                    onSubmit={handleSearch}
                    className="filter-bar facility-filter"
                >
                    <label>
                        <span>종목</span>
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
                    </label>
                    <label>
                        <span>지역</span>
                        <input
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="예: 서울 강남구"
                        />
                    </label>
                    <label>
                        <span>날짜</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </label>
                    <button type="submit">검색</button>
                </form>

                {loading ? (
                    <div className="auth-loading"><span className="auth-spinner" /></div>
                ) : error ? (
                    <div className="manager-empty">
                        <span>!</span>
                        <h2>경기장 목록을 불러오지 못했습니다.</h2>
                        <p>{error}</p>
                        <button type="button" onClick={() => setReloadKey((value) => value + 1)}>다시 시도</button>
                    </div>
                ) : !data || !data.content || data.content.length === 0 ? (
                    <div className="manager-empty">
                        <span>⌕</span>
                        <h2>검색 결과가 없습니다.</h2>
                        <p>필터를 바꾸거나 날짜를 비우고 다시 조회해보세요.</p>
                    </div>
                ) : (
                    <>
                        <div className="list-meta">
                            <h2>경기장 전체보기</h2>
                            <span>{data.totalElements ?? data.content.length}개의 경기장</span>
                        </div>
                        <div className="facility-list-grid">
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
            </section>
        </main>
    );
}

function FacilityCard({ facility }: { facility: FacilityAvailableResponse }) {
    const sports = Array.isArray(facility.sportTypes) ? facility.sportTypes : [];
    const weekdayPrice = Number(facility.defaultWeekdayPrice ?? 0);
    const weekendPrice = Number(facility.defaultWeekendPrice ?? 0);
    const rating = Number(facility.ratingAvg ?? 0);
    const reviewCount = Number(facility.reviewCount ?? 0);

    return (
        <Link
            href={`/facilities/${facility.facilityId}`}
            className="facility-list-card"
        >
            <div className="facility-list-art">
                {facility.thumbnailUrl ? (
                    <Image
                        src={facility.thumbnailUrl}
                        alt={facility.name || "경기장 이미지"}
                        fill
                        sizes="(max-width: 720px) 100vw, 33vw"
                        unoptimized
                    />
                ) : (
                    <span>PLAYON</span>
                )}
                <em>★ {rating.toFixed(1)}</em>
            </div>
            <div className="facility-list-body">
                <div className="manager-sports">
                    {sports.length > 0 ? sports.map((sport) => (
                        <span key={sport}>{SPORT_TYPE_LABEL[sport]}</span>
                    )) : <span>종목 미등록</span>}
                </div>
                <h2>{facility.name || "이름 없는 경기장"}</h2>
                <p>⌖ {facility.address || "주소 정보 없음"}</p>
                <div className="facility-list-price">
                    <span>평일 {weekdayPrice.toLocaleString()}원</span>
                    <small>주말 {weekendPrice.toLocaleString()}원 · 리뷰 {reviewCount}</small>
                </div>
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
        <div className="pagination">
            <button
                type="button"
                disabled={page === 0}
                onClick={() => onChange(page - 1)}
            >
                이전
            </button>
            <span>
        {page + 1} / {totalPages}
      </span>
            <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => onChange(page + 1)}
            >
                다음
            </button>
        </div>
    );
}
