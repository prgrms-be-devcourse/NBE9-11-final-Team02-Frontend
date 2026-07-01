"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, FormError, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getFacilityReservations } from "@/lib/manager-facility";
import type { FacilityReservationOverviewResponse, ReservationStatus, SlotStatus } from "@/lib/types";

const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
    AVAILABLE: "예약 가능",
    PENDING: "결제 대기",
    RESERVED: "예약됨",
    CLOSED: "마감",
    BLOCKED: "차단",
};

const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
    PENDING: "대기",
    CONFIRMED: "확정",
    CANCELLED: "취소",
    COMPLETED: "완료",
};

function dateOffset(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function money(value: number) {
    return new Intl.NumberFormat("ko-KR").format(value);
}

export default function ManagerFacilityReservationsPage() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const { user } = useAuth();
    const [fromDate, setFromDate] = useState(() => dateOffset(0));
    const [toDate, setToDate] = useState(() => dateOffset(7));
    const [overview, setOverview] = useState<FacilityReservationOverviewResponse>();
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(true);

    async function load(nextFromDate = fromDate, nextToDate = toDate) {
        if (!user) return;
        setLoading(true);
        setError(undefined);
        try {
            const data = await getFacilityReservations(user.userId, facilityId, nextFromDate, nextToDate);
            setOverview(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "예약 현황을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!user) return;
        let active = true;
        getFacilityReservations(user.userId, facilityId, fromDate, toDate)
            .then((data) => {
                if (active) setOverview(data);
            })
            .catch((e) => {
                if (active) setError(e instanceof Error ? e.message : "예약 현황을 불러오지 못했습니다.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, facilityId]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void load(fromDate, toDate);
    }

    return (
        <main className="manager-page">
            <div className="manager-shell">
                <Link href="/manager/facilities" className="flow-back">← 내 경기장</Link>
                <div className="manager-heading">
                    <div>
                        <span>RESERVATION BOARD</span>
                        <h1>예약 현황</h1>
                        <p>선택한 기간의 슬롯 예약 상태와 매출을 확인하세요.</p>
                    </div>
                    <Link href={`/manager/facilities/${facilityId}/slots`}>슬롯 생성</Link>
                </div>

                <form className="reservation-filter" onSubmit={submit}>
                    <Field label="시작 날짜" htmlFor="fromDate">
                        <Input id="fromDate" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} required />
                    </Field>
                    <Field label="종료 날짜" htmlFor="toDate">
                        <Input id="toDate" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} required />
                    </Field>
                    <Button type="submit" loading={loading}>조회하기</Button>
                </form>

                <FormError message={error} />

                {!overview && loading ? (
                    <div className="auth-loading"><span className="auth-spinner" /></div>
                ) : overview ? (
                    <>
                        <section className="reservation-summary">
                            <div><span>전체 슬롯</span><strong>{overview.totalSlots}</strong><small>개</small></div>
                            <div><span>예약 슬롯</span><strong>{overview.reservedSlots}</strong><small>개</small></div>
                            <div><span>예약 가능</span><strong>{overview.availableSlots}</strong><small>개</small></div>
                            <div><span>기간 매출</span><strong>{money(overview.totalRevenue)}</strong><small>원</small></div>
                        </section>

                        {overview.slots.length === 0 ? (
                            <div className="manager-empty">
                                <span>□</span>
                                <h2>조회 기간에 생성된 슬롯이 없습니다.</h2>
                                <p>먼저 예약 슬롯을 생성하면 현황을 확인할 수 있어요.</p>
                                <Link href={`/manager/facilities/${facilityId}/slots`}>슬롯 생성하기</Link>
                            </div>
                        ) : (
                            <section className="reservation-table">
                                {overview.slots.map((slot) => (
                                    <article key={slot.slotId}>
                                        <div>
                                            <b>{slot.slotDate}</b>
                                            <span>{slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}</span>
                                        </div>
                                        <div>
                                            <em className={`slot-${slot.slotStatus.toLowerCase()}`}>
                                                {SLOT_STATUS_LABEL[slot.slotStatus]}
                                            </em>
                                            {slot.reservationStatus ? (
                                                <small>{RESERVATION_STATUS_LABEL[slot.reservationStatus]} · {slot.reservationId}</small>
                                            ) : (
                                                <small>예약 없음</small>
                                            )}
                                        </div>
                                        <strong>{money(slot.revenue || slot.price)}원</strong>
                                    </article>
                                ))}
                            </section>
                        )}
                    </>
                ) : null}
            </div>
        </main>
    );
}
