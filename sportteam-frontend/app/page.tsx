"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API = "http://3.36.243.212";
const MATCH_ID = "77777777-7777-7777-7777-777777777774";
const SLOT_ID = "77777777-7777-7777-7777-777777777772";
const LOGIN_PATH = "/api/v1/auth/login";

type Role = "guest" | "user" | "facility" | "platform";
type View = "explore" | "detail" | "create" | "my" | "review" | "profile" | "facility" | "reservations" | "revenue" | "reports" | "approval" | "ops" | "settings" | "login";
type Api<T> = { data: T; success: true } | { success: false; error: { message: string } };
type Item = { id: string; type: "MATCH" | "FACILITY"; title: string; place: string; sport: string; region: string; date: string; time: string; now: number; max: number; level: string; price: number; status: "open" | "soon" | "closed" };
type Queue = { token: string; position: number; enterable: boolean; expiresAt: string };
type Notice = { notificationId: string; type: string; title: string; content: string };
type User = { userId?: string; id?: string; nickname?: string; name?: string; reason?: string; reviewCount?: number; mannerScore?: number };
type LoginResult = { accessToken?: string; token?: string };
type Toss = { requestPayment: (method: string, option: Record<string, unknown>) => Promise<void> };
declare global { interface Window { TossPayments?: (key: string) => Toss } }

const feed: Item[] = [
  { id: MATCH_ID, type: "MATCH", title: "풋살 강남 저녁매치", place: "삼성 풋살장", sport: "풋살", region: "강남", date: "2026-06-20", time: "19:00 ~ 21:00", now: 6, max: 8, level: "중급", price: 15000, status: "soon" },
  { id: "match-basketball-jamsil", type: "MATCH", title: "농구 잠실 주말매치", place: "잠실 체육관", sport: "농구", region: "잠실", date: "2026-06-21", time: "14:00 ~ 16:00", now: 6, max: 10, level: "초급", price: 0, status: "open" },
  { id: "facility-samsung", type: "FACILITY", title: "삼성 풋살장", place: "삼성 풋살장", sport: "풋살", region: "강남", date: "예약 가능", time: "18:00 ~ 20:00", now: 0, max: 8, level: "시설", price: 80000, status: "open" },
  { id: "match-closed", type: "MATCH", title: "배드민턴 역삼 퇴근매치", place: "강남 실내체육관", sport: "배드민턴", region: "강남", date: "2026-06-18", time: "20:00 ~ 22:00", now: 8, max: 8, level: "상급", price: 12000, status: "closed" },
];
const places = ["삼성 풋살장", "잠실 풋살파크", "강남 실내체육관"];
const facilityOptions = [{ name: "삼성 풋살장", fee: 120000 }, { name: "잠실 풋살파크", fee: 98000 }, { name: "강남 실내체육관", fee: 90000 }];
const participants = ["우호 · 공격수", "민수 · 수비수", "지훈 · 골키퍼", "서연 · 수비수"];
const nav: Record<Role, { label: string; view: View }[]> = {
  guest: [{ label: "Create Match", view: "create" }, { label: "Sign In", view: "login" }, { label: "Explore", view: "explore" }, { label: "Settings", view: "settings" }],
  user: [{ label: "Create Match", view: "create" }, { label: "Explore", view: "explore" }, { label: "My Matches", view: "my" }, { label: "Profile", view: "profile" }, { label: "Settings", view: "settings" }],
  facility: [{ label: "Explore", view: "explore" }, { label: "Facility Management", view: "facility" }, { label: "Reservations", view: "reservations" }, { label: "Revenue", view: "revenue" }, { label: "Settings", view: "settings" }],
  platform: [{ label: "Dashboard", view: "ops" }, { label: "Users / Reports", view: "reports" }, { label: "Matches", view: "ops" }, { label: "Facilities", view: "approval" }, { label: "Settlements", view: "revenue" }, { label: "Settings", view: "settings" }],
};
const won = (n: number) => n ? n.toLocaleString("ko-KR") + "원" : "무료";
const msg = (e: unknown) => e instanceof Error ? e.message : "요청 처리에 실패했습니다.";
async function call<T>(path: string, token: string, init: RequestInit = {}) {
  const h = new Headers(init.headers); if (init.body) h.set("Content-Type", "application/json"); if (token) h.set("Authorization", "Bearer " + token);
  const r = await fetch(API + path, { ...init, headers: h }); const b = await r.json().catch(() => null) as Api<T> | null;
  if (!r.ok || !b || !b.success) throw new Error(b && !b.success ? b.error.message : "HTTP " + r.status); return b.data;
}


export default function Home() {
  const [role, setRole] = useState<Role>("guest"); const [view, setView] = useState<View>("explore"); const [id, setId] = useState(MATCH_ID);
  const [token, setToken] = useState(() => typeof window === "undefined" ? "" : localStorage.getItem("sportteam.token") || "");
  const go = (v: View, r = role, nextId = id) => { setView(v); setRole(r); setId(nextId); if (typeof window !== "undefined") history.pushState({ v, r, nextId }, "", "?role=" + r + "&view=" + v + "&item=" + nextId); };
    useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(location.search);
      setRole((params.get("role") as Role) || "guest");
      setView((params.get("view") as View) || "explore");
      setId(params.get("item") || MATCH_ID);
    };
    syncFromUrl();
    addEventListener("popstate", syncFromUrl);
    return () => removeEventListener("popstate", syncFromUrl);
  }, []);
  const item = feed.find((x) => x.id === id) || feed[0];
  return <main className="app"><aside><button className="brand" onClick={() => go("explore")}>SPORT MATCH</button><button className="login-shortcut" onClick={() => go("login", "guest")}>Sign In</button><nav>{nav[role].map((n) => <button key={n.label} className={view === n.view ? "on" : ""} onClick={() => go(n.view)}>{n.label}</button>)}</nav></aside><section className="main">{view === "explore" && <Explore role={role} detail={(x) => go("detail", role, x)} create={() => role === "guest" ? go("login") : go("create")} />}{view === "detail" && <Detail role={role} item={item} token={token} login={() => go("login", "guest")} />}{view === "create" && <Create role={role} token={token} login={() => go("login", "guest")} />}{view === "my" && <MyMatches token={token} review={() => go("review")} />}{view === "review" && <Review token={token} />}{view === "profile" && <Profile />}{view === "facility" && <Facility token={token} />}{view === "reservations" && <Reservations token={token} />}{view === "revenue" && <Revenue />}{view === "reports" && <Reports token={token} />}{view === "approval" && <Approval token={token} />}{view === "ops" && <Ops token={token} />}{view === "settings" && <Settings />}{view === "login" && <Login setToken={setToken} onLogin={(nextRole) => go("explore", nextRole)} />}</section></main>;
}

function Head({ title, desc, badge }: { title: string; desc: string; badge?: string }) { return <header className="head">{badge && <span className="pill blue">{badge}</span>}<h1>{title}</h1><p>{desc}</p></header>; }
function Panel({ title, children, side }: { title?: string; children: React.ReactNode; side?: boolean }) { return <section className={side ? "panel side" : "panel"}>{title && <h2>{title}</h2>}{children}</section>; }
function Info({ k, v }: { k: string; v: string }) { return <div className="info"><span>{k}</span><b>{v}</b></div>; }
function Row({ k, v }: { k: string; v: string }) { return <div className="row"><span>{k}</span><b>{v}</b></div>; }
function Progress({ value, red }: { value: number; red?: boolean }) { return <div className="progress"><i className={red ? "red" : ""} style={{ width: Math.min(100, value) + "%" }} /></div>; }

function Explore({ role, detail, create }: { role: Role; detail: (id: string) => void; create: () => void }) {
  const [sport, setSport] = useState("전체"); const [region, setRegion] = useState("전체"); const [level, setLevel] = useState("전체"); const [sort, setSort] = useState("마감 임박순");
  const list = useMemo(() => feed.filter((x) => (sport === "전체" || x.sport === sport) && (region === "전체" || x.region === region) && (level === "전체" || x.level === level || x.type === "FACILITY")), [sport, region, level]);
  const reset = sport !== "전체" || region !== "전체" || level !== "전체" || sort !== "마감 임박순";
  return <><Head title="경기/시설 탐색" desc="원하는 종목, 지역, 날짜 조건으로 매칭방과 시설을 찾아보세요." /><div className="filters"><label>종목<select aria-label="종목" value={sport} onChange={(e) => setSport(e.target.value)}><option>전체</option><option>풋살</option><option>농구</option><option>배드민턴</option></select></label><label>지역<select aria-label="지역" value={region} onChange={(e) => setRegion(e.target.value)}><option>전체</option><option>강남</option><option>잠실</option></select></label><label>날짜<input aria-label="날짜" type="date" /></label><label>실력<select aria-label="실력" value={level} onChange={(e) => setLevel(e.target.value)}><option>전체</option><option>초급</option><option>중급</option><option>상급</option></select></label><label>정렬<select aria-label="정렬" value={sort} onChange={(e) => setSort(e.target.value)}><option>마감 임박순</option><option>최신순</option><option>참가자 많은 순</option><option>평점 높은 순</option></select></label><button disabled={!reset} onClick={() => { setSport("전체"); setRegion("전체"); setLevel("전체"); setSort("마감 임박순"); }}>초기화</button></div><div className="quick"><button onClick={create}>Create Match</button><span>{role === "guest" ? "게스트는 조회만 가능하며 생성/참가는 로그인으로 이동합니다." : "참가 신청, 생성, My Matches 확인 가능"}</span></div>{list.length ? <div className="cards">{list.map((x) => <article key={x.id} className={x.type === "MATCH" ? "card match" : "card facility"} onClick={() => detail(x.id)}><div><span className={x.type === "MATCH" ? "pill blue" : "pill green"}>{x.type}</span><span className={x.status === "closed" ? "pill red" : x.now / x.max >= .8 ? "pill orange" : "pill green"}>{x.status === "closed" ? "모집 마감" : x.now / x.max >= .8 ? "마감 임박" : "모집 중"}</span></div><h2>{x.title}</h2><p>{x.place} · {x.date} {x.time}</p><div className="meta"><span>모집 {x.now}/{x.max}</span><span>{x.level}</span><b>{won(x.price)}</b></div><button>상세보기</button></article>)}</div> : <Panel><p className="empty">결과 없음</p></Panel>}</>;
}

function Detail({ role, item, token, login }: { role: Role; item: Item; token: string; login: () => void }) {
  const [cnt, setCnt] = useState(1); const [order, setOrder] = useState<{ merchantUid: string; amount: number } | null>(null); const [pk, setPk] = useState(""); const [msgText, setMsgText] = useState(""); const total = item.price * cnt;
  const prepare = async () => { if (role === "guest") return login(); try { const data = await call<{ merchantUid: string; amount: number }>("/api/v1/payments/prepare", token, { method: "POST", body: JSON.stringify({ matchId: item.id, paymentType: "PARTICIPATION" }) }); setOrder(data); setMsgText("주문서가 생성되었습니다."); } catch (e) { setMsgText(msg(e)); } };
  const toss = async () => { if (!order) return; const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ""; if (!key || !window.TossPayments) return setMsgText("Toss SDK 설정이 없어 수동 confirm으로 테스트하세요."); await window.TossPayments(key).requestPayment("카드", { amount: order.amount, orderId: order.merchantUid, orderName: item.title + " 참가비", successUrl: location.href, failUrl: location.href }); };
  const confirm = async () => { try { await call("/api/v1/payments/confirm", token, { method: "POST", body: JSON.stringify({ paymentKey: pk, orderId: order?.merchantUid, amount: order?.amount || total }) }); setMsgText("결제가 완료되었습니다."); } catch (e) { setMsgText(msg(e)); } };
  return <><Head badge="MATCH" title={item.title} desc={item.place + " · " + item.date + " " + item.time} /><div className="layout"><div className="stack"><Panel title="경기 정보"><div className="grid"><Info k="종목" v={item.sport} /><Info k="지역" v={item.region} /><Info k="실력 수준" v={item.level} /><Info k="참가비" v={won(item.price) + " / 1인"} /></div></Panel><Panel title="모집 현황"><Row k="현재 모집 인원" v={item.now + " / " + item.max + "명"} /><Progress value={(item.now / item.max) * 100} /><div className="grid three"><Info k="공격수" v="2 / 3" /><Info k="수비수" v="3 / 4" /><Info k="골키퍼" v="1 / 1" /></div></Panel><Panel title="참가자"><div className="chips">{participants.map((p) => <span key={p}>{p}</span>)}</div></Panel></div><Panel title="참가 신청" side>{role === "guest" && <div className="notice">게스트는 참가 신청, 채팅, 후기 작성이 불가능합니다.</div>}<label><input type="radio" defaultChecked /> 개인 참가</label><label><input type="radio" /> 팀 참가</label><label>신청 포지션<select><option>공격수</option><option>수비수</option><option>골키퍼</option></select></label><label>참가 인원<input type="number" min={1} value={cnt} onChange={(e) => setCnt(Number(e.target.value))} /></label><div className="pay"><Row k="1인 참가비" v={won(item.price)} /><Row k="참가 인원" v={cnt + "명"} /><Row k="총 결제 금액" v={won(total)} /></div><button className="primary" disabled={item.status === "closed"} onClick={prepare}>결제 후 참가 신청</button><button onClick={toss} disabled={!order}>Toss 결제창</button><label>paymentKey<input value={pk} onChange={(e) => setPk(e.target.value)} /></label><button onClick={confirm} disabled={!order}>Confirm</button>{msgText && <p className="hint">{msgText}</p>}</Panel></div></>;
}

function Create({ role, token, login }: { role: Role; token: string; login: () => void }) {
  const [q, setQ] = useState<Queue | null>(null);
  const [cap, setCap] = useState(8);
  const [selectedFacility, setSelectedFacility] = useState(facilityOptions[0]);
  const [fee, setFee] = useState(selectedFacility.fee);
  const [m, setM] = useState("");
  const selectFacility = (facility: typeof facilityOptions[number]) => {
    setSelectedFacility(facility);
    setFee(facility.fee);
  };
  const queue = async () => {
    if (role === "guest") return login();
    try { setQ(await call<Queue>("/api/v1/waiting-queues/facility-slots/" + SLOT_ID + "/tokens", token, { method: "POST" })); setM("대기열 토큰 발급 완료"); }
    catch (e) { setM(msg(e)); }
  };
  return <><Head title="매칭 방 생성 및 시설 예약" desc="시설 예약과 동시에 총 이용료와 정원을 설정하고 방장 몫을 결제합니다." /><div className="layout"><div className="stack"><Panel title="시설 선택">{facilityOptions.map((facility) => <button type="button" className={selectedFacility.name === facility.name ? "facility-option selected" : "facility-option"} key={facility.name} onClick={() => selectFacility(facility)}><b>{facility.name}</b><span>예약 가능 · 18:00 ~ 20:00 · {won(facility.fee)}</span></button>)}</Panel><Panel title="매칭 방 정보"><div className="grid"><label>경기 제목<input defaultValue="풋살 강남 저녁매치" /></label><label>종목<select><option>풋살</option></select></label><label>모집 정원<input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))} /></label><label>총 이용료<input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} /></label></div><div className="chips"><span>공격수</span><span>수비수</span><span>골키퍼</span></div></Panel></div><Panel title="방장 결제" side><div className="pay"><Row k="선택 시설" v={selectedFacility.name} /><Row k="총 이용료" v={won(fee)} /><Row k="정원" v={cap + "명"} /><Row k="1인 참가비" v={won(Math.ceil(fee / cap))} /></div><button onClick={queue}>대기열 진입</button>{q && <div className="pay"><Row k="현재 순번" v={String(q.position)} /><Row k="입장 가능" v={q.enterable ? "가능" : "대기"} /><Row k="만료" v={q.expiresAt} /></div>}<button className="primary" disabled={!q?.enterable}>방장 몫 결제 후 생성</button>{m && <p className="hint">{m}</p>}</Panel></div></>;
}
function MyMatches({ token, review }: { token: string; review: () => void }) { const [list, setList] = useState<Notice[]>([]); const [state, setState] = useState("SSE 미연결"); const sse = useRef<EventSource | null>(null); const sub = () => { sse.current?.close(); const es = new EventSource(API + "/api/v1/notifications/subscribe"); sse.current = es; setState("연결 중"); es.addEventListener("connect", () => setState("연결됨")); es.addEventListener("heartbeat", () => undefined); es.onmessage = (e) => { try { setList((p) => [JSON.parse(e.data) as Notice, ...p]); } catch { setList((p) => [{ notificationId: String(Date.now()), type: "NOTICE", title: "알림", content: e.data }, ...p]); } }; es.onerror = () => setState("연결 끊김"); }; return <><Head title="모집 결과 알림" desc="예약 확정 또는 취소/환불 상태를 확인합니다." /><div className="cards two"><Panel><span className="pill green">예약 확정</span><h2>풋살 강남 저녁매치</h2><p>삼성 풋살장 · 2026-06-20 19:00</p><Progress value={100} /><div className="notice green">예약이 확정되었습니다.</div><button className="primary">채팅방 입장</button></Panel><Panel><span className="pill red">예약 취소</span><h2>농구 잠실 주말매치</h2><p>잠실 체육관 · 2026-06-21 14:00</p><Progress value={60} red /><div className="pay"><Row k="환불 예정 금액" v="10,000원" /><Row k="환불 상태" v="진행 중" /></div><button onClick={review}>환불 내역 보기</button></Panel></div><Panel title="실시간 알림"><button onClick={sub}>SSE 구독 시작</button><span className="hint"> {state} · token length {token.length}</span>{list.map((n) => <div className="mini" key={n.notificationId}><b>{n.title}</b><span>{n.type} · {n.content}</span></div>)}</Panel></>; }
function Review({ token }: { token: string }) { const [m, setM] = useState(""); const post = async () => { try { await call("/api/v1/reviews/facility", token, { method: "POST", body: JSON.stringify({ matchId: MATCH_ID, rating: 5, content: "시설 상태가 좋았습니다." }) }); setM("후기 제출 요청 완료"); } catch (e) { setM(msg(e)); } }; return <><Head title="경기 후기 및 평가" desc="시설 후기와 참가자 매너/실력을 평가합니다." /><Panel title="시설 후기"><b className="stars">★★★★★</b><label>후기<textarea placeholder="시설 상태나 이용 경험을 작성해주세요." /></label></Panel><Panel title="참가자 평가">{["민수", "서연"].map((p) => <div className="review" key={p}><b>{p}</b><span>실력 ★★★★★</span><span>매너 ★★★★★</span></div>)}</Panel><button className="primary full" onClick={post}>평가 제출</button>{m && <p className="hint">{m}</p>}</>; }
function Profile() { return <><Head title="My Page" desc="누적 운동 기록, 자주 가는 구장, 매너/실력 점수를 확인합니다." /><Panel><div className="profile"><div>W</div><section><h2>철수</h2><p>풋살 · 공격수 · 강남/잠실 선호</p></section></div></Panel><div className="metrics"><Info k="총 참가 경기" v="28회" /><Info k="매너 점수" v="4.8" /><Info k="실력 점수" v="4.2" /><Info k="후기 수" v="19개" /></div><div className="cards two"><Panel title="종목별 참가 기록"><Bar k="풋살" v={18} /><Bar k="농구" v={7} /><Bar k="배드민턴" v={3} /></Panel><Panel title="자주 가는 구장">{places.map((p, i) => <div className="mini" key={p}><b>{p}</b><span>방문 {9 - i * 3}회 · 최근 방문 2026-06-{20 - i * 6}</span></div>)}</Panel></div></>; }
function Facility({ token }: { token: string }) { const [m, setM] = useState(""); const post = async () => { try { await call("/api/v1/facilities", token, { method: "POST", body: JSON.stringify({ name: "삼성 풋살장", address: "서울시 강남구", sport: "풋살", capacity: 10, basePrice: 100000 }) }); setM("시설 등록 요청 완료"); } catch (e) { setM(msg(e)); } }; return <><Head title="시설 정보 등록" desc="구장 정보, 이용 요금, 편의시설, 영업시간을 등록합니다." /><div className="layout"><Panel title="기본 정보"><label>시설명<input placeholder="예: 삼성 풋살장" /></label><label>주소<input placeholder="예: 서울시 강남구" /></label><label>지원 종목<select><option>풋살</option><option>농구</option></select></label><label>수용 가능 인원<input defaultValue="10" /></label><label>시설 설명<textarea /></label></Panel><Panel title="요금 및 운영 정보" side><label>기본 이용 요금<input placeholder="100,000원" /></label><div className="grid"><input defaultValue="09:00" /><input defaultValue="22:00" /></div><div className="days">{"월화수목금토일".split("").map((d) => <button key={d}>{d}</button>)}</div>{["주차 가능", "샤워실", "탈의실", "조명", "장비 대여"].map((a) => <label key={a}><input type="checkbox" /> {a}</label>)}<button className="primary" onClick={post}>시설 등록하기</button>{m && <p className="hint">{m}</p>}</Panel></div></>; }
function Reservations({ token }: { token: string }) { const [m, setM] = useState(""); const cancel = async () => { try { await call("/api/v1/facilities/facility-samsung/reservations/reservation-1/cancel", token, { method: "POST", body: JSON.stringify({ reason: "시설 사정" }) }); setM("취소/환불 요청 완료"); } catch (e) { setM(msg(e)); } }; return <><Head title="예약 현황 관리" desc="시설 예약 현황을 캘린더로 확인하고 예약 취소/환불을 관리합니다." /><div className="layout"><Panel title="2026년 6월"><div className="calendar">{Array.from({ length: 21 }, (_, i) => i + 1).map((d) => <div key={d} className={d === 16 ? "sel" : d === 10 || d === 12 ? "book" : ""}><b>{d}</b>{d === 10 && <span>풋살 19:00</span>}{d === 12 && <span>농구 14:00</span>}{d === 18 && <em>취소됨</em>}</div>)}</div></Panel><Panel title="예약 확정" side><h2>풋살 강남 저녁매치</h2><p>삼성 풋살장 · 2026-06-16 20:00</p><div className="pay"><Row k="참가 인원" v="8 / 8명" /><Row k="결제 상태" v="결제 완료" /><Row k="호스트" v="짱구" /></div><label>취소 사유<textarea /></label><button className="danger" onClick={cancel}>예약 강제 취소 및 환불</button>{m && <p className="hint">{m}</p>}</Panel></div></>; }
function Revenue() { return <><Head title="Revenue Dashboard" desc="예약 매출, 환불, 플랫폼 수수료, 정산 예정 금액을 확인합니다." /><div className="metrics"><Info k="총 예약 건수" v="124건" /><Info k="총 매출" v="8,420,000원" /><Info k="환불 금액" v="320,000원" /><Info k="정산 예정 금액" v="7,258,000원" /></div><div className="cards two"><Panel title="월별 매출"><div className="chart">{[35, 45, 50, 58, 70, 82].map((v, i) => <span key={i} style={{ height: v + "%" }} />)}</div></Panel><Panel title="시설별 매출">{places.map((p, i) => <div className="mini" key={p}><b>{p}</b><span>예약 {62 - i * 20}건</span><strong>{won(4120000 - i * 1200000)}</strong></div>)}</Panel></div></>; }
function Reports({ token }: { token: string }) { const [users, setUsers] = useState<User[]>([{ userId: "1", nickname: "김민수", reason: "노쇼", reviewCount: 4, mannerScore: 2.1 }, { userId: "2", nickname: "박지훈", reason: "욕설", reviewCount: 2, mannerScore: 2.4 }]); const [m, setM] = useState(""); const load = async () => { try { setUsers(await call<User[]>("/api/v1/admin/users/blacklist/candidates?maxMannerScore=2.5&minReviewCount=3", token)); } catch (e) { setM(msg(e)); } }; const ban = async (u: User) => { try { await call("/api/v1/admin/users/" + (u.userId || u.id) + "/restriction", token, { method: "PATCH", body: JSON.stringify({ restricted: true, reason: "비매너 신고 누적" }) }); setM("이용 제한 요청 완료"); } catch (e) { setM(msg(e)); } }; return <><Head title="비매너 신고 관리" desc="누적 신고 내역을 확인하고 악성 유저의 이용을 제한합니다." /><div className="metrics"><Info k="접수된 신고" v="42건" /><Info k="검토 중" v="12건" /><Info k="블랙리스트" v="5명" /><Info k="오늘 처리" v="8건" /></div><div className="layout"><Panel title="신고 목록"><button onClick={load}>후보 조회</button><Table heads={["신고 대상", "사유", "누적", "조치"]} rows={users.map((u) => [u.nickname || u.name || "사용자", u.reason || "비매너", (u.reviewCount || 0) + "회", <button key="b" className="danger small" onClick={() => ban(u)}>제한</button>])} /></Panel><Panel title="신고 상세" side><span className="pill red">신고 상세</span><h2>김민수</h2><div className="pay"><Row k="누적 신고" v="4회" /><Row k="매너 점수" v="2.1" /><Row k="신고 사유" v="노쇼" /></div><textarea placeholder="이용 제한 사유" /><button className="danger">블랙리스트 등록</button>{m && <p className="hint">{m}</p>}</Panel></div></>; }
function Approval({ token }: { token: string }) { const [m, setM] = useState(""); const act = async (ok: boolean) => { try { await call("/api/v1/admin/facilities/facility-samsung/approval", token, { method: "PATCH", body: JSON.stringify({ approved: ok, reason: ok ? null : "정보 확인 필요" }) }); setM(ok ? "승인 요청 완료" : "반려 요청 완료"); } catch (e) { setM(msg(e)); } }; return <><Head title="시설 승인 관리" desc="시설 관리자가 등록한 시설 요청을 검토하고 승인/반려합니다." /><div className="layout"><Panel title="시설 등록 요청"><Table heads={["시설명", "운영자", "종목", "상태"]} rows={[["삼성 풋살장", "김시설", "풋살", "승인 대기"], ["잠실 풋살파크", "이관리", "풋살", "승인 완료"], ["강남 실내체육관", "박운영", "농구", "반려"]]} /></Panel><Panel title="삼성 풋살장" side><div className="image">Facility Image</div><div className="pay"><Row k="운영자" v="김시설" /><Row k="수용 인원" v="10명" /><Row k="편의시설" v="주차, 샤워실" /></div><textarea placeholder="반려 사유" /><button className="success" onClick={() => act(true)}>시설 승인</button><button className="danger" onClick={() => act(false)}>시설 반려</button>{m && <p className="hint">{m}</p>}</Panel></div></>; }
function Ops({ token }: { token: string }) { const [m, setM] = useState(""); const del = async () => { try { await call("/api/v1/admin/matches/" + MATCH_ID, token, { method: "DELETE", body: JSON.stringify({ reason: "부적절한 모집글" }) }); setM("운영 조치 요청 완료"); } catch (e) { setM(msg(e)); } }; return <><Head title="플랫폼 운영 관리" desc="사용자, 경기 게시물, 전체 경기 현황을 관리합니다." /><div className="metrics"><Info k="전체 사용자" v="1,284명" /><Info k="모집 중 경기" v="86개" /><Info k="예약 확정" v="42개" /><Info k="취소/삭제" v="7개" /></div><div className="layout"><Panel title="경기 매칭 방 관리"><Table heads={["경기명", "생성자", "상태", "조치"]} rows={[["풋살 강남 저녁매치", "우호", "모집 중", <button key="d" className="danger small" onClick={del}>삭제</button>], ["농구 잠실 주말매치", "민수", "예약 확정", "상세"], ["광고성 모집글", "스팸유저", "삭제됨", "이력"]]} /></Panel><Panel title="관리 대상" side><span className="pill red">관리 대상</span><h2>풋살 강남 저녁매치</h2><div className="pay"><Row k="생성자" v="우호" /><Row k="상태" v="모집 중" /><Row k="신고 수" v="2건" /></div><textarea placeholder="삭제/비공개 사유" /><button className="danger" onClick={del}>경기 삭제</button>{m && <p className="hint">{m}</p>}</Panel></div></>; }
function Login({ setToken, onLogin }: { setToken: (value: string) => void; onLogin: (role: Role) => void }) {
  const [selected, setSelected] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const submit = async () => {
    setMessage("");
    try {
      const result = await call<LoginResult>(LOGIN_PATH, "", { method: "POST", body: JSON.stringify({ email, password }) });
      const nextToken = result.accessToken || result.token || "";
      if (!nextToken) throw new Error("로그인 응답에 accessToken이 없습니다.");
      localStorage.setItem("sportteam.token", nextToken);
      setToken(nextToken);
      onLogin(selected);
    } catch (error) {
      setMessage(msg(error) + " 현재 백엔드 로그인 경로는 " + LOGIN_PATH + " 기준입니다.");
    }
  };
  return <><Head title="Sign In" desc="SportTeam 계정으로 로그인하고 매칭 생성, 참가 신청, 채팅, 후기 작성을 이어가세요." /><div className="auth-layout"><Panel title="로그인"><div className="login-box"><label>이메일<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sportteam@example.com" autoComplete="email" /></label><label>비밀번호<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="비밀번호" autoComplete="current-password" /></label><label>접속 역할<select value={selected} onChange={(e) => setSelected(e.target.value as Role)}><option value="user">일반 유저</option><option value="facility">시설 관리자</option></select></label><button className="primary" onClick={submit}>Sign In</button>{message && <p className="hint">{message}</p>}</div></Panel><Panel title="계정 안내"><div className="mini"><b>일반 유저</b><span>경기 탐색, 참가 신청, 결제, My Matches, 후기 작성</span></div><div className="mini"><b>시설 관리자</b><span>시설 등록, 예약 현황 관리, 강제 취소/환불, 매출 확인</span></div></Panel></div></>;
}
function Settings() {
  return <><Head title="Settings" desc="서비스 이용에 필요한 정책과 고객 지원 정보를 확인합니다." /><div className="settings-grid"><Panel title="이용약관"><p>SportTeam은 스포츠 시설 예약과 팀 매칭을 연결하는 플랫폼입니다. 회원은 정확한 프로필과 참가 정보를 제공해야 하며, 예약 확정 후에는 경기 운영 규칙과 시설 이용 수칙을 준수해야 합니다. 무단 불참, 허위 정보 등록, 광고성 모집글, 타인에게 불쾌감을 주는 행위는 서비스 이용 제한 사유가 될 수 있습니다.</p><p>결제, 예약 취소, 환불은 각 경기의 모집 상태와 시설 정책, 결제 승인 시점에 따라 처리됩니다. 모집 실패나 시설 사정으로 예약이 취소될 경우 관련 참가자에게 알림이 발송되며 환불 절차가 진행됩니다.</p></Panel><Panel title="개인정보 처리방침"><p>서비스 제공을 위해 이메일, 닉네임, 선호 종목, 참가 이력, 결제 및 환불 처리에 필요한 최소 정보를 수집합니다. 수집된 정보는 매칭 추천, 예약 관리, 결제 확인, 신고 처리, 고객 문의 응대 목적에 한해 사용됩니다.</p><p>결제 정보는 결제대행사를 통해 처리되며, 플랫폼은 승인 결과와 거래 식별자 등 서비스 운영에 필요한 정보만 보관합니다. 회원은 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.</p></Panel><Panel title="문의하기"><p>서비스 이용 중 문제가 발생하면 경기명, 예약 일시, 결제 주문번호, 오류 화면을 함께 전달해주세요. 일반 문의는 영업일 기준 1~2일 내 답변을 목표로 하며, 결제/환불 및 신고 관련 문의는 처리 이력을 확인한 뒤 안내합니다.</p><div className="contact-box"><b>고객센터</b><span>support@sportteam.example</span><b>운영 시간</b><span>평일 10:00 ~ 18:00</span></div></Panel></div></>;
}
function Bar({ k, v }: { k: string; v: number }) { return <div className="bar"><span>{k}</span><i><b style={{ width: v * 5 + "%" }} /></i><strong>{v}회</strong></div>; }
function Table({ heads, rows }: { heads: string[]; rows: React.ReactNode[][] }) { return <table><thead><tr>{heads.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>; }












