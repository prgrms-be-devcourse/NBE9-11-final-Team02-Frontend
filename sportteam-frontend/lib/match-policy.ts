export const RECRUIT_DEADLINE_BEFORE_HOURS = 1;
export const PARTICIPANT_CANCEL_BEFORE_HOURS = 24;
export const HOST_CANCEL_BEFORE_HOURS = 72;

function pad(value: number) {
    return String(value).padStart(2, "0");
}

export function parseLocalDateTime(value: string | null | undefined) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function parseSlotStartAt(date: string, startTime: string) {
    const normalizedTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    return parseLocalDateTime(`${date}T${normalizedTime}`);
}

export function addHours(date: Date, hours: number) {
    const next = new Date(date);
    next.setHours(next.getHours() + hours);
    return next;
}

export function toDateTimeLocalValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatPolicyDateTime(value: Date | string | null | undefined) {
    const date = typeof value === "string" ? parseLocalDateTime(value) : value;
    if (!date || Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function calculateRecruitDeadline(matchStartAt: Date) {
    return addHours(matchStartAt, -RECRUIT_DEADLINE_BEFORE_HOURS);
}

export function calculateParticipantCancelDeadline(matchStartAt: Date) {
    return addHours(matchStartAt, -PARTICIPANT_CANCEL_BEFORE_HOURS);
}

export function calculateHostCancelDeadline(matchStartAt: Date) {
    return addHours(matchStartAt, -HOST_CANCEL_BEFORE_HOURS);
}

export function inferMatchStartAtFromCancelDeadline(cancelDeadline: string | null | undefined) {
    const deadline = parseLocalDateTime(cancelDeadline);
    return deadline ? addHours(deadline, PARTICIPANT_CANCEL_BEFORE_HOURS) : null;
}

export function isBeforeNow(deadline: Date | string | null | undefined) {
    const date = typeof deadline === "string" ? parseLocalDateTime(deadline) : deadline;
    return !date || Date.now() >= date.getTime();
}
