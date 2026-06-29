import Link from "next/link";
import { REQUIRED_GENDER_LABEL, formatSkillRange } from "@/lib/match-labels";
import type { MatchSummaryResponse } from "@/lib/types";

const sportInfo: Record<string, { label: string; icon: string; className: string }> = {
  SOCCER: { label: "축구", icon: "⚽", className: "green" }, FUTSAL: { label: "풋살", icon: "🥅", className: "green" },
  BASKETBALL: { label: "농구", icon: "🏀", className: "orange" }, BADMINTON: { label: "배드민턴", icon: "🏸", className: "blue" },
  TENNIS: { label: "테니스", icon: "🎾", className: "lime" }, VOLLEYBALL: { label: "배구", icon: "🏐", className: "purple" },
};

export function MatchCard({ match }: { match: MatchSummaryResponse }) {
  const sport = sportInfo[match.sportType] ?? { label: match.sportType, icon: "🏃", className: "blue" };
  const unavailable = match.status === "CANCELLED" || match.status === "COMPLETED";
  const deadline = new Date(match.recruitDeadline);
  const date = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(deadline);
  const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(deadline);
  const almostFull = match.capacity - match.currentCount <= 2;
  const statusLabel = match.status === "RECRUITING"
      ? (almostFull ? "마감 임박" : "모집 중")
      : match.status === "CONFIRMED" ? "확정"
          : match.status === "COMPLETED" ? "완료" : "취소됨";
  return <Link className={`match-card${unavailable ? " unavailable" : ""}`} href={`/matches/${match.matchId}`}>
    <div className={`match-art ${sport.className}`}><span>{sport.icon}</span><i className="art-line one"/><i className="art-line two"/><em>{statusLabel}</em></div>
    <div className="match-body"><div className="match-tags"><span>{sport.label}</span><small>{formatSkillRange(match.minSkillLevel, match.maxSkillLevel)}</small></div><h3>{match.title}</h3><dl><div><dt>주최자</dt><dd>{match.hostNickname || "알 수 없음"}</dd></div><div><dt>일시</dt><dd>{date} · {time}</dd></div><div><dt>조건</dt><dd>{REQUIRED_GENDER_LABEL[match.requiredGender]} · {formatSkillRange(match.minSkillLevel, match.maxSkillLevel)}</dd></div></dl><div className="match-bottom"><div className="people"><span/><span/><span/><b>{match.currentCount}/{match.capacity}명</b></div><strong>{match.feePerPerson.toLocaleString()}원</strong></div></div>
  </Link>;
}
