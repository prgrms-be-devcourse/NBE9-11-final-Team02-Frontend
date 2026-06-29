import type {
    FacilityStatus,
    MatchSortType,
    MatchStatus,
    RequiredGender,
    SettlementStatus,
    SkillLevel,
    SportType,
    UserRole,
} from "./types";

export const SPORT_TYPE_LABEL: Record<SportType, string> = {
    FUTSAL: "풋살",
    SOCCER: "축구",
    BASKETBALL: "농구",
    TENNIS: "테니스",
    BADMINTON: "배드민턴",
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
    RECRUITING: "모집 중",
    CONFIRMED: "확정",
    COMPLETED: "완료",
    CANCELLED: "취소됨",
};

export const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
    ANY: "제한 없음",
    LEVEL_1: "레벨 1",
    LEVEL_2: "레벨 2",
    LEVEL_3: "레벨 3",
    LEVEL_4: "레벨 4",
    LEVEL_5: "레벨 5",
};

export const REQUIRED_GENDER_LABEL: Record<RequiredGender, string> = {
    ANY: "성별 무관",
    MALE: "남성",
    FEMALE: "여성",
    MIXED: "혼성",
};

export const MATCH_SORT_LABEL: Record<MatchSortType, string> = {
    LATEST: "최신순",
    DEADLINE_ASC: "마감 임박순",
    FEE_ASC: "참가비 낮은순",
    PARTICIPANT_DESC: "참여 많은순",
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
    USER: "일반 회원",
    MANAGER: "경기장 관리자",
    ADMIN: "운영자",
};

export const FACILITY_STATUS_LABEL: Record<FacilityStatus, string> = {
    ACTIVE: "운영 중",
    CLOSED: "운영 종료",
};

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
    HOLDING: "정산 대기",
    SETTLED: "정산 완료",
    FAILED: "정산 실패",
};

/** 모집 레벨 범위를 사람이 읽을 수 있는 문자열로 */
export function formatSkillRange(
    min: SkillLevel,
    max: SkillLevel,
): string {
    if (min === "ANY" && max === "ANY") return "제한 없음";
    if (min === max) return SKILL_LEVEL_LABEL[min];
    return `${SKILL_LEVEL_LABEL[min]} ~ ${SKILL_LEVEL_LABEL[max]}`;
}
