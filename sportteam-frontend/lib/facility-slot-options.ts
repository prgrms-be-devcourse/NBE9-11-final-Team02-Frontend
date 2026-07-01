export const SLOT_DURATIONS = [30, 60, 90, 120, 150, 180, 210, 240];

export function slotDurationLabel(minutes: number) {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
