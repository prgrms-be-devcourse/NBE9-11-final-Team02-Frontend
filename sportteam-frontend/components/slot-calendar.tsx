"use client";

import { useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number): string {
    return String(n).padStart(2, "0");
}

function toDateString(year: number, month: number, day: number): string {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseYearMonth(dateString: string): { year: number; month: number } {
    const [year, month] = dateString.split("-").map(Number);
    return { year, month: month - 1 };
}

function todayString(): string {
    const now = new Date();
    return toDateString(now.getFullYear(), now.getMonth(), now.getDate());
}

interface SlotCalendarProps {
    /** YYYY-MM-DD */
    selectedDate: string;
    onSelectDate: (date: string) => void;
    /** YYYY-MM-DD. 이 날짜 이전은 선택할 수 없습니다. */
    minDate?: string;
    /** 우측 패널 상단에 표시할 제목 (기본값: "슬롯 선택") */
    listTitle?: string;
    /** 우측에 표시할 선택된 날짜의 슬롯 목록 */
    children: React.ReactNode;
}

export function SlotCalendar({ selectedDate, onSelectDate, minDate, listTitle = "슬롯 선택", children }: SlotCalendarProps) {
    const [{ year, month }, setViewMonth] = useState(() => parseYearMonth(selectedDate));

    function changeMonth(diff: number) {
        const next = new Date(year, month + diff, 1);
        setViewMonth({ year: next.getFullYear(), month: next.getMonth() });
    }

    function goToday() {
        const today = todayString();
        const { year: ty, month: tm } = parseYearMonth(today);
        setViewMonth({ year: ty, month: tm });
        onSelectDate(today);
    }

    const today = todayString();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<number | null> = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className="slot-calendar">
            <div className="slot-calendar-cal">
                <div className="slot-calendar-cal-header">
                    <span className="slot-calendar-cal-nav">
                        <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달">‹</button>
                        <b>{year}년 {month + 1}월</b>
                        <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달">›</button>
                    </span>
                    <button type="button" className="slot-calendar-today" onClick={goToday}>오늘</button>
                </div>
                <div className="slot-calendar-weekdays">
                    {WEEKDAYS.map((w) => (
                        <span key={w}>{w}</span>
                    ))}
                </div>
                <div className="slot-calendar-grid">
                    {cells.map((day, i) => {
                        if (day === null) return <span key={`empty-${i}`} />;
                        const value = toDateString(year, month, day);
                        const disabled = minDate ? value < minDate : false;
                        const selected = value === selectedDate;
                        const isToday = value === today;
                        return (
                            <button
                                key={value}
                                type="button"
                                disabled={disabled}
                                className={[selected && "selected", disabled && "past", isToday && !selected && "today"]
                                    .filter(Boolean)
                                    .join(" ") || undefined}
                                onClick={() => onSelectDate(value)}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="slot-calendar-list">
                <div className="slot-calendar-list-header">
                    <span aria-hidden="true">📅</span>
                    <b>{listTitle}</b>
                </div>
                <div className="slot-calendar-list-body">{children}</div>
            </div>
        </div>
    );
}
