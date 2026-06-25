import Link from "next/link";

import { FacilityCard } from "@/components/facility-card";
import { Header } from "@/components/header";
import { MatchCard } from "@/components/match-card";
import { getAvailableFacilities, getMatches } from "@/lib/api";

const sports = [
  { value: "SOCCER", label: "축구", icon: "⚽" },
  { value: "FUTSAL", label: "풋살", icon: "🥅" },
  { value: "BASKETBALL", label: "농구", icon: "🏀" },
  { value: "BADMINTON", label: "배드민턴", icon: "🏸" },
  { value: "TENNIS", label: "테니스", icon: "🎾" },
  { value: "VOLLEYBALL", label: "배구", icon: "🏐" },
];

export default async function Home() {
  const [matches, facilities] = await Promise.all([
    getMatches({ size: "4", sort: "DEADLINE_ASC" }),
    getAvailableFacilities({ size: "3" }),
  ]);

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="eyebrow"><i /> 우리 동네 스포츠 메이트</span>
              <h1>함께 뛰면,<br /><strong>게임이 시작된다</strong></h1>
              <p>가까운 경기장에서 나와 딱 맞는 팀원을 만나보세요.<br className="desktop-only" /> 예약부터 매칭, 결제까지 한 번에.</p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/matches">매치 둘러보기 <ArrowIcon /></Link>
                <Link className="button button-ghost" href="/facilities">경기장 찾기</Link>
              </div>
              <div className="hero-proof">
                <div className="avatar-stack"><span>J</span><span>M</span><span>S</span><span>+</span></div>
                <p><strong>2,400+</strong>명의 플레이어가 함께하고 있어요</p>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="court-lines"><i /><i /><i /></div>
              <div className="player-card card-a"><span>⚽</span><div><b>풋살 매치</b><small>오늘 20:00 · 2자리</small></div></div>
              <div className="player-card card-b"><span>🏀</span><div><b>농구 크루</b><small>내일 19:30 · 4자리</small></div></div>
              <div className="hero-ball">PLAY<br /><b>ON</b></div>
              <div className="match-badge"><span>●</span> 지금 18개 매치 모집 중</div>
            </div>
          </div>
        </section>

        <section className="quick-search-section">
          <form action="/matches" className="container quick-search">
            <label><span>종목</span><select name="sportType" defaultValue=""><option value="">어떤 운동을 할까요?</option>{sports.map((sport) => <option key={sport.value} value={sport.value}>{sport.label}</option>)}</select></label>
            <div className="search-divider" />
            <label><span>지역</span><input name="region" placeholder="지역을 선택해주세요" /></label>
            <div className="search-divider" />
            <label><span>날짜</span><input name="date" type="date" /></label>
            <button className="search-button" type="submit"><SearchIcon /> 매치 찾기</button>
          </form>
        </section>

        <section className="section sport-section">
          <div className="container">
            <div className="section-heading centered"><span className="eyebrow coral">SPORTS</span><h2>오늘은 어떤 운동을 해볼까요?</h2><p>좋아하는 종목을 선택하고 함께할 매치를 찾아보세요.</p></div>
            <div className="sport-grid">{sports.map((sport) => <Link key={sport.value} className="sport-item" href={`/matches?sportType=${sport.value}`}><span>{sport.icon}</span><b>{sport.label}</b><small>매치 보기 <ArrowIcon /></small></Link>)}</div>
          </div>
        </section>

        <section className="section matches-section">
          <div className="container">
            <div className="section-heading row"><div><span className="eyebrow">OPEN MATCHES</span><h2>마감 임박 매치</h2><p>지금 참여하면 이번 주에 바로 뛸 수 있어요.</p></div><Link className="text-link" href="/matches">전체 매치 보기 <ArrowIcon /></Link></div>
            <div className="match-grid">{matches.map((match) => <MatchCard key={match.matchId} match={match} />)}</div>
          </div>
        </section>

        <section className="section facility-section">
          <div className="container">
            <div className="section-heading row"><div><span className="eyebrow coral">FACILITIES</span><h2>이번 주 인기 경기장</h2><p>플레이어들이 다시 찾는 검증된 공간이에요.</p></div><Link className="text-link dark" href="/facilities">경기장 전체 보기 <ArrowIcon /></Link></div>
            <div className="facility-grid">{facilities.map((facility, index) => <FacilityCard key={facility.facilityId} facility={facility} index={index} />)}</div>
          </div>
        </section>

        <section className="cta-section"><div className="container cta-inner"><div><span className="eyebrow light">READY TO PLAY?</span><h2>망설이는 사이,<br />좋은 매치는 마감돼요.</h2><p>지금 가입하고 첫 번째 경기를 시작해보세요.</p></div><Link className="button button-light" href="/signup">무료로 시작하기 <ArrowIcon /></Link></div></section>
      </main>
      <footer><div className="container footer-inner"><Link className="brand monochrome" href="/"><LogoIcon /><span>PLAYON</span></Link><p>운동이 필요한 모든 순간, 플레이온</p><span>© 2026 PLAYON. All rights reserved.</span></div></footer>
    </>
  );
}

function ArrowIcon() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>; }
function LogoIcon() { return <svg viewBox="0 0 38 38" aria-hidden="true"><path d="M7 4h15a9 9 0 0 1 0 18H14v12H7V4Z"/><circle cx="22" cy="13" r="3"/></svg>; }
