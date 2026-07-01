"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { SlotCalendar } from "@/components/slot-calendar";
import { useAuth } from "@/lib/auth-context";
import { getManagerFacility, getManagerFacilitySlots, setupFacilitySlots, updateFacilitySlot } from "@/lib/manager-facility";
import type { FacilityResponse, FacilitySlotResponse, SlotStatus } from "@/lib/types";

function today() {
    return new Date().toISOString().slice(0, 10);
}

const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
    AVAILABLE: "예약 가능",
    PENDING: "결제 대기",
    RESERVED: "예약 완료",
    CLOSED: "운영 종료",
    BLOCKED: "차단",
};

function isEditableSlot(slot: FacilitySlotResponse) {
    return slot.status === "AVAILABLE" || slot.status === "CLOSED";
}

export default function FacilitySlotsPage() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const { user } = useAuth();
    const [facility, setFacility] = useState<FacilityResponse>();
    const [error, setError] = useState<string>();
    const [saving, setSaving] = useState(false);
    const [count, setCount] = useState<number>();

    const [viewDate, setViewDate] = useState(today());
    const [slots, setSlots] = useState<FacilitySlotResponse[]>();
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [slotsError, setSlotsError] = useState<string>();
    const [refreshKey, setRefreshKey] = useState(0);
    const [editingSlotId, setEditingSlotId] = useState<string>();
    const [savingSlotId, setSavingSlotId] = useState<string>();

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

    useEffect(() => {
        if (!user) return;
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSlotsLoading(true);
        setSlotsError(undefined);
        getManagerFacilitySlots(facilityId, viewDate)
            .then((data) => {
                if (active) setSlots(data);
            })
            .catch((err) => {
                if (active) setSlotsError(err instanceof Error ? err.message : "슬롯을 불러오지 못했습니다.");
            })
            .finally(() => {
                if (active) setSlotsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [facilityId, user, viewDate, count, refreshKey]);

    async function submitSlotEdit(event: FormEvent<HTMLFormElement>, slotId: string) {
        event.preventDefault();
        if (!user) return;
        const data = new FormData(event.currentTarget);
        setSavingSlotId(slotId);
        setSlotsError(undefined);
        try {
            await updateFacilitySlot(user.userId, facilityId, slotId, {
                price: Number(data.get("price")),
                status: String(data.get("status")) as "AVAILABLE" | "CLOSED",
            });
            setEditingSlotId(undefined);
            setRefreshKey((key) => key + 1);
        } catch (e) {
            setSlotsError(e instanceof Error ? e.message : "슬롯 정보를 수정하지 못했습니다.");
        } finally {
            setSavingSlotId(undefined);
        }
    }

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
                            <p>아래 목록에서 생성된 슬롯을 확인할 수 있어요.</p>
                        </div>
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
                        슬롯 생성하기
                    </Button>
                </form>

                <div className="flow-heading">
                    <span>SLOT LIST</span>
                    <h2>등록된 슬롯</h2>
                    <p>날짜를 선택해 해당 일자의 슬롯 구성을 확인하세요.</p>
                </div>

                <SlotCalendar selectedDate={viewDate} onSelectDate={setViewDate} listTitle="등록된 슬롯">
                    {slotsError ? (
                        <FormError message={slotsError} />
                    ) : slotsLoading || !slots ? (
                        <p className="manager-empty">불러오는 중…</p>
                    ) : slots.length === 0 ? (
                        <p className="manager-empty">이 날짜에 등록된 슬롯이 없습니다.</p>
                    ) : (
                        slots.map((slot) => {
                            const editable = isEditableSlot(slot);
                            const editing = editingSlotId === slot.id;
                            return (
                                <div key={slot.id}>
                                    <button
                                        type="button"
                                        className="slot-calendar-list-item"
                                        disabled={!editable}
                                        onClick={() => setEditingSlotId(editing ? undefined : slot.id)}
                                    >
                                        <span>
                                            <b>{slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}</b>
                                            <span>{editable ? (editing ? "닫기" : SLOT_STATUS_LABEL[slot.status]) : SLOT_STATUS_LABEL[slot.status]}</span>
                                        </span>
                                        <strong>{slot.price.toLocaleString()}원</strong>
                                    </button>
                                    {editing ? (
                                        <form className="slot-edit-form" onSubmit={(event) => submitSlotEdit(event, slot.id)}>
                                            <Field label="슬롯 요금" htmlFor={`price-${slot.id}`}>
                                                <Input id={`price-${slot.id}`} name="price" type="number" min={0} defaultValue={slot.price} required />
                                            </Field>
                                            <Field label="슬롯 상태" htmlFor={`status-${slot.id}`}>
                                                <Select id={`status-${slot.id}`} name="status" defaultValue={slot.status === "CLOSED" ? "CLOSED" : "AVAILABLE"} required>
                                                    <option value="AVAILABLE">예약 가능</option>
                                                    <option value="CLOSED">마감</option>
                                                </Select>
                                            </Field>
                                            <Button type="submit" loading={savingSlotId === slot.id}>저장하기</Button>
                                        </form>
                                    ) : null}
                                </div>
                            );
                        })
                    )}
                </SlotCalendar>
            </div>
        </main>
    );
}
