"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, FormError, Select } from "@/components/ui";
import { getSportStats, registerSportStats } from "@/lib/sport-stat";
import type { SelfReportedLevel, SportStatResponse, SportType } from "@/lib/types";

const SPORT_LABEL: Record<SportType,string> = { FUTSAL:"풋살", SOCCER:"축구", BASKETBALL:"농구", TENNIS:"테니스", BADMINTON:"배드민턴" };
const LEVEL_LABEL: Record<SelfReportedLevel,string> = { BEGINNER:"하 · 입문", INTERMEDIATE:"중 · 중급", ADVANCED:"상 · 숙련" };

export default function SportStatsPage(){return <Suspense fallback={<Loading/>}><SportStats/></Suspense>}

function SportStats(){
    const router=useRouter(); const search=useSearchParams(); const [stats,setStats]=useState<SportStatResponse[]>(); const [selected,setSelected]=useState<Record<string,SelfReportedLevel>>({}); const [error,setError]=useState<string>(); const [saving,setSaving]=useState(false);
    const requiredSport = search.get("requiredSport") as SportType | null;
    const visibleStats = stats ? (requiredSport ? stats.filter((stat)=>stat.sportType===requiredSport) : stats) : undefined;
    const requiredRegistered = requiredSport ? stats?.some((stat)=>stat.sportType===requiredSport&&stat.registered) : false;
    useEffect(()=>{let active=true; getSportStats().then((data)=>{if(active)setStats(data)}).catch((err)=>{if(active)setError(err instanceof Error?err.message:"실력 정보를 불러오지 못했습니다.")}); return()=>{active=false}},[]);
    async function save(){const next=search.get("next"); const safeNext=next&&next.startsWith("/")&&!next.startsWith("//")?next:"/mypage"; if(requiredRegistered){router.push(safeNext);return} const entries=requiredSport&&selected[requiredSport]?[{sportType:requiredSport,selfReportedLevel:selected[requiredSport]}]:Object.entries(selected).map(([sportType,selfReportedLevel])=>({sportType:sportType as SportType,selfReportedLevel})); if(requiredSport&&!selected[requiredSport]){setError(`${SPORT_LABEL[requiredSport]} 실력을 선택해주세요.`);return} if(!entries.length){setError("등록할 종목의 실력을 선택해주세요.");return} setSaving(true);setError(undefined);try{await registerSportStats(entries);router.push(safeNext)}catch(err){setError(err instanceof Error?err.message:"실력 정보를 등록하지 못했습니다.")}finally{setSaving(false)}}
    return <main className="flow-page"><div className="flow-shell"><Link href="/mypage" className="flow-back">← 마이페이지</Link><div className="flow-heading"><span>MY SPORTS</span><h1>{requiredSport?`${SPORT_LABEL[requiredSport]} 실력을 등록해주세요`:"종목별 실력을 등록해주세요"}</h1><p>{requiredSport?`선택한 매치를 진행하려면 ${SPORT_LABEL[requiredSport]} 실력 정보만 등록하면 됩니다.`:"매치를 만들거나 참가하기 전에 해당 종목의 실력 정보가 필요합니다."}</p></div><FormError message={error}/><div className="sport-stat-list">{!visibleStats?<Loading/>:visibleStats.map((stat)=><div key={stat.sportType} className={`${stat.registered?"registered":""} ${stat.sportType===requiredSport?"required":""}`}><div><b>{SPORT_LABEL[stat.sportType]}</b><small>{stat.sportType===requiredSport&&!stat.registered?"이 종목 하나만 등록하면 계속 진행할 수 있어요":stat.registered?"등록 완료":"최초 등록 후에는 수정할 수 없어요"}</small></div>{stat.registered?<span>{LEVEL_LABEL[stat.selfReportedLevel!]}</span>:<Select aria-label={`${SPORT_LABEL[stat.sportType]} 실력`} value={selected[stat.sportType]??""} onChange={(event)=>setSelected((current)=>({...current,[stat.sportType]:event.target.value as SelfReportedLevel}))}><option value="">실력 선택</option>{Object.entries(LEVEL_LABEL).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>}</div>)}</div><Button type="button" loading={saving} onClick={save} className="mt-5">{requiredRegistered?"계속하기":requiredSport?`${SPORT_LABEL[requiredSport]} 실력 등록하고 계속하기`:"선택한 실력 등록하기"}</Button></div></main>
}
function Loading(){return <div className="auth-loading"><span className="auth-spinner"/><p>실력 정보를 불러오고 있어요.</p></div>}
