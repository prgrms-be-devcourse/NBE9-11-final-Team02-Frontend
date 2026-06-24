import { FacilityCard } from "@/components/facility-card";
import { Header } from "@/components/header";
import { getAvailableFacilities } from "@/lib/api";

export default async function FacilitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams; const facilities = await getAvailableFacilities({ sportType: params.sportType, region: params.region, date: params.date, size: "20" });
  return <><Header/><main className="listing-page"><section className="listing-hero facility-listing-hero"><div className="container"><span className="eyebrow coral">FACILITY FINDER</span><h1>좋은 게임은,<br/><strong>좋은 공간에서</strong></h1><p>원하는 날짜와 지역으로 예약 가능한 경기장을 찾아보세요.</p></div></section><div className="container listing-content"><form className="filter-bar facility-filter"><select name="sportType" defaultValue={params.sportType ?? ""}><option value="">전체 종목</option><option value="FUTSAL">풋살</option><option value="BASKETBALL">농구</option><option value="BADMINTON">배드민턴</option></select><input name="region" defaultValue={params.region ?? ""} placeholder="지역 검색"/><input name="date" defaultValue={params.date ?? ""} type="date"/><button type="submit">경기장 찾기</button></form><div className="list-meta"><h2>예약 가능한 경기장</h2><span>{facilities.length}개의 경기장</span></div><div className="facility-grid listing-grid">{facilities.map((facility,index) => <FacilityCard key={facility.facilityId} facility={facility} index={index}/>)}</div></div></main></>;
}
