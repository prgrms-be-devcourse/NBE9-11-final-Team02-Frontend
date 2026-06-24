"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMyFacilities } from "@/lib/manager-facility";
import type { FacilitySummaryResponse, SportType } from "@/lib/types";

const SPORT_LABEL:Record<SportType,string>={FUTSAL:"풋살",SOCCER:"축구",BASKETBALL:"농구",TENNIS:"테니스",BADMINTON:"배드민턴"};

export default function ManagerFacilitiesPage(){const{user}=useAuth();const[items,setItems]=useState<FacilitySummaryResponse[]>();const[error,setError]=useState<string>();useEffect(()=>{if(!user)return;let active=true;getMyFacilities(user.userId).then(v=>{if(active)setItems(v)}).catch(e=>{if(active)setError(e instanceof Error?e.message:"경기장을 불러오지 못했습니다.")});return()=>{active=false}},[user]);return <main className="manager-page"><div className="manager-shell"><div className="manager-heading"><div><span>FACILITY MANAGER</span><h1>내 경기장</h1><p>등록한 경기장과 운영 상태를 확인하세요.</p></div><Link href="/manager/facilities/new">+ 경기장 등록</Link></div>{error?<p className="manager-error">{error}</p>:!items?<div className="auth-loading"><span className="auth-spinner"/></div>:items.length===0?<div className="manager-empty"><span>⌂</span><h2>아직 등록한 경기장이 없습니다.</h2><p>첫 경기장을 등록하고 예약을 받아보세요.</p><Link href="/manager/facilities/new">경기장 등록하기</Link></div>:<div className="manager-facility-grid">{items.map(item=><article key={item.id}><div className="manager-facility-art">{item.thumbnailUrl?<img src={item.thumbnailUrl} alt=""/>:<span>PLAYON</span>}<em className={item.status.toLowerCase()}>{item.status==="ACTIVE"?"운영 중":"운영 종료"}</em></div><div><div className="manager-sports">{item.sportTypes.map(v=><span key={v}>{SPORT_LABEL[v]}</span>)}</div><h2>{item.name}</h2><p>⌖ {item.address}</p><div className="manager-card-actions"><Link href={`/facilities/${item.id}`}>사용자 화면</Link><Link href={`/manager/facilities/${item.id}/slots`}>슬롯 관리</Link></div></div></article>)}</div>}</div></main>}
