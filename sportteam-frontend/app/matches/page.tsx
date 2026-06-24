import { Header } from "@/components/header";
import { MatchCard } from "@/components/match-card";
import { getMatches } from "@/lib/api";

export default async function MatchesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const matches = await getMatches({ sportType: params.sportType, sort: params.sort ?? "LATEST", size: "20" });
  return <><Header/><main className="listing-page"><section className="listing-hero"><div className="container"><span className="eyebrow">MATCH FINDER</span><h1>내가 찾던 매치,<br/><strong>여기 다 모였어요</strong></h1><p>조건에 맞는 매치를 찾고 새로운 팀원과 함께 뛰어보세요.</p></div></section><div className="container listing-content"><form className="filter-bar"><select name="sportType" defaultValue={params.sportType ?? ""}><option value="">전체 종목</option><option value="FUTSAL">풋살</option><option value="SOCCER">축구</option><option value="BASKETBALL">농구</option><option value="BADMINTON">배드민턴</option><option value="TENNIS">테니스</option></select><select name="sort" defaultValue={params.sort ?? "LATEST"}><option value="LATEST">최신순</option><option value="DEADLINE_ASC">마감 임박순</option><option value="FEE_ASC">낮은 가격순</option><option value="PARTICIPANT_DESC">참여자순</option></select><button type="submit">필터 적용</button></form><div className="list-meta"><h2>모집 중인 매치</h2><span>{matches.length}개의 매치</span></div><div className="match-grid listing-grid">{matches.map((match) => <MatchCard key={match.matchId} match={match}/>)}</div></div></main></>;
}
