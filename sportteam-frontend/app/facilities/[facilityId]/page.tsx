"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFacility, getFacilitySlots } from "@/lib/facility";
import { ApiError } from "@/lib/http";
import { useAuth } from "@/lib/auth-context";
import { calculateRecruitDeadline, isBeforeNow, parseSlotStartAt } from "@/lib/match-policy";
import type {
    Amenity,
    FacilityResponse,
    FacilitySlotResponse,
    SportType,
} from "@/lib/types";

const SPORT_TYPE_LABEL: Record<SportType, string> = {
    FUTSAL: "풋살",
    SOCCER: "축구",
    BASKETBALL: "농구",
    TENNIS: "테니스",
    BADMINTON: "배드민턴",
};

const AMENITY_LABEL: Record<Amenity, string> = {
    PARKING: "주차",
    SHOWER: "샤워실",
    LOCKER: "락커룸",
    EQUIPMENT_RENTAL: "장비 대여",
};

function todayString(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function FacilityDetailPage() {
    const params = useParams<{ facilityId: string }>();
    const facilityId = params.facilityId;

    const [facility, setFacility] = useState<FacilityResponse>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getFacility(facilityId)
            .then((res) => {
                if (active) setFacility(res);
            })
            .catch((err) => {
                if (!active) return;
                setError(
                    err instanceof ApiError
                        ? err.message
                        : "시설 정보를 불러오지 못했습니다.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [facilityId]);

    return (
        <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12">
            <div className="w-full max-w-3xl">
                <Link
                    href="/facilities"
                    className="mb-6 inline-block text-sm text-zinc-500 underline-offset-4 hover:underline"
                >
                    ← 목록으로
                </Link>

                {loading ? (
                    <p className="py-12 text-center text-sm text-zinc-400">불러오는 중…</p>
                ) : error || !facility ? (
                    <p className="py-12 text-center text-sm text-red-600">
                        {error ?? "시설 정보를 찾을 수 없습니다."}
                    </p>
                ) : (
                    <>
                        <FacilityInfo facility={facility} />
                        <SlotBrowser facilityId={facilityId} sportType={facility.sportTypes[0]} />
                    </>
                )}
            </div>
        </main>
    );
}

function FacilityInfo({ facility }: { facility: FacilityResponse }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            {facility.imageUrls.length > 0 ? (
                <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={facility.imageUrls[0]}
                        alt={facility.name}
                        className="h-full w-full object-cover"
                    />
                </div>
            ) : null}

            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {facility.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{facility.address}</p>
            <p className="mt-1 text-sm text-zinc-500">{facility.phone}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
                {facility.sportTypes.map((sport) => (
                    <span
                        key={sport}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
                    >
            {SPORT_TYPE_LABEL[sport]}
          </span>
                ))}
            </div>

            <p className="mt-4 whitespace-pre-line text-sm text-zinc-700">
                {facility.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 pt-6 text-sm">
                <DetailItem label="수용 인원" value={`${facility.capacity}명`} />
                <DetailItem
                    label="슬롯 단위"
                    value={`${facility.slotDurationMinutes}분`}
                />
                <DetailItem
                    label="평일 요금"
                    value={`${facility.defaultWeekdayPrice.toLocaleString()}원`}
                />
                <DetailItem
                    label="주말 요금"
                    value={`${facility.defaultWeekendPrice.toLocaleString()}원`}
                />
            </dl>

            {facility.amenities.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {facility.amenities.map((amenity) => (
                        <span
                            key={amenity}
                            className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600"
                        >
              {AMENITY_LABEL[amenity]}
            </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="font-medium text-zinc-900">{value}</dd>
        </div>
    );
}

const SLOT_STATUS_LABEL: Record<FacilitySlotResponse["status"], string> = {
    AVAILABLE: "예약 가능",
    PENDING: "결제 대기",
    RESERVED: "예약됨",
    CLOSED: "마감",
    BLOCKED: "마감",
};

function SlotBrowser({ facilityId, sportType }: { facilityId: string; sportType: SportType }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [date, setDate] = useState(todayString());
    const [slots, setSlots] = useState<FacilitySlotResponse[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(undefined);

        getFacilitySlots(facilityId, date)
            .then((res) => {
                if (active) setSlots(res);
            })
            .catch((err) => {
                if (!active) return;
                setError(
                    err instanceof ApiError
                        ? err.message
                        : "예약 가능 시간을 불러오지 못했습니다.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [facilityId, date]);

    return (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">예약 가능 시간</h2>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
            </div>

            {loading ? (
                <p className="py-8 text-center text-sm text-zinc-400">불러오는 중…</p>
            ) : error ? (
                <p className="py-8 text-center text-sm text-red-600">{error}</p>
            ) : !slots || slots.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                    해당 날짜에 등록된 시간이 없습니다.
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.map((slot) => {
                        const startAt = parseSlotStartAt(slot.slotDate, slot.startTime);
                        const recruitClosed = startAt ? isBeforeNow(calculateRecruitDeadline(startAt)) : true;
                        const disabled = slot.status !== "AVAILABLE" || recruitClosed || authLoading;

                        return (
                            <button
                                key={slot.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                    const next = `/facilities/${facilityId}`;
                                    if (!user) {
                                        router.push(`/login?next=${encodeURIComponent(next)}`);
                                        return;
                                    }
                                    const query = new URLSearchParams({
                                        reservationId: slot.id,
                                        facilityId,
                                        sportType,
                                        date: slot.slotDate,
                                        startTime: slot.startTime,
                                        endTime: slot.endTime,
                                        amount: String(slot.price),
                                    });
                                    router.push(`/matches/new?${query}`);
                                }}
                                className={
                                    !disabled
                                        ? "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left text-sm transition hover:border-emerald-500 hover:bg-emerald-50"
                                        : "cursor-not-allowed rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-left text-sm opacity-50"
                                }
                            >
                                <p className="font-medium text-zinc-900">
                                    {slot.startTime.slice(0, 5)} ~ {slot.endTime.slice(0, 5)}
                                </p>
                                <p className="text-zinc-500">{slot.price.toLocaleString()}원</p>
                                <p className="text-xs text-zinc-400">
                                    {recruitClosed && slot.status === "AVAILABLE" ? "모집 마감" : SLOT_STATUS_LABEL[slot.status]}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
