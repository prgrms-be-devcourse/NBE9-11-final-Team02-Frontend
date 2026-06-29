"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, FormError, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getManagerFacility, setupFacilitySlots } from "@/lib/manager-facility";
import type { FacilityResponse } from "@/lib/types";

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function FacilitySlotsPage() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const { user } = useAuth();
    const [facility, setFacility] = useState<FacilityResponse>();
    const [error, setError] = useState<string>();
    const [saving, setSaving] = useState(false);
    const [count, setCount] = useState<number>();

    useEffect(() => {
        if (!user) return;
        let active = true;
        getManagerFacility(user.userId, facilityId)
            .then((data) => {
                if (active) setFacility(data);
            })
            .catch((err) => {
                if (active) setError(err instanceof Error ? err.message : "경기장 정보를 불러오지 못했습니다.");
            });
        return () => {
            active = false;
        };
    }, [facilityId, user]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!user) return;
        setSaving(true);
        setError(undefined);

        const data = new FormData(event.currentTarget);
        try {
            const slots = await setupFacilitySlots(user.userId, facilityId, {
                fromDate: String(data.get("fromDate")),
                toDate: String(data.get("toDate")),
                startTime: String(data.get("startTime")),
                endTime: String(data.get("endTime")),
                weekdayPrice: Number(data.get("weekdayPrice")),
                weekendPrice: Number(data.get("weekendPrice")),
            });
            setCount(slots.length);
        } catch (e) {
            setError(e instanceof Error ? e.message : "예약 슬롯을 생성하지 못했습니다.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="manager-page">
            <div className="manager-form-shell">
                <Link href="/manager/facilities" className="flow-back">← 내 경기장</Link>
                <div className="flow-heading">
                    <span>SLOT SCHEDULE</span>
                    <h1>예약 슬롯 설정</h1>
                    <p>
                        경기장 기본 요금을 기준으로 슬롯 요금이 채워집니다.
                        필요하면 이번 슬롯 생성에만 적용할 요금으로 수정할 수 있어요.
                    </p>
                </div>

                {count !== undefined ? (
                    <div className="slot-success">
                        <span>✓</span>
                        <div>
                            <b>{count}개의 예약 슬롯을 만들었습니다.</b>
                            <p>이제 사용자 화면에서 예약 가능한 시간을 확인할 수 있어요.</p>
                        </div>
                        <Link href={`/facilities/${facilityId}`}>사용자 화면 확인</Link>
                    </div>
                ) : null}

                <form className="manager-form" onSubmit={submit}>
                    <FormError message={error} />
                    <div className="flow-grid">
                        <Field label="시작 날짜" htmlFor="fromDate">
                            <Input id="fromDate" name="fromDate" type="date" min={today()} required />
                        </Field>
                        <Field label="종료 날짜" htmlFor="toDate">
                            <Input id="toDate" name="toDate" type="date" min={today()} required />
                        </Field>
                        <Field label="운영 시작" htmlFor="startTime">
                            <Input id="startTime" name="startTime" type="time" defaultValue="09:00" required />
                        </Field>
                        <Field label="운영 종료" htmlFor="endTime">
                            <Input id="endTime" name="endTime" type="time" defaultValue="22:00" required />
                        </Field>
                        <Field label="평일 슬롯 요금" htmlFor="weekdayPrice">
                            <Input
                                key={`weekday-${facility?.defaultWeekdayPrice ?? "loading"}`}
                                id="weekdayPrice"
                                name="weekdayPrice"
                                type="number"
                                min={0}
                                defaultValue={facility?.defaultWeekdayPrice ?? ""}
                                disabled={!facility}
                                required
                            />
                        </Field>
                        <Field label="주말 슬롯 요금" htmlFor="weekendPrice">
                            <Input
                                key={`weekend-${facility?.defaultWeekendPrice ?? "loading"}`}
                                id="weekendPrice"
                                name="weekendPrice"
                                type="number"
                                min={0}
                                defaultValue={facility?.defaultWeekendPrice ?? ""}
                                disabled={!facility}
                                required
                            />
                        </Field>
                    </div>
                    <Button type="submit" loading={saving} disabled={!facility}>
                        예약 슬롯 생성하기
                    </Button>
                </form>
            </div>
        </main>
    );
}
