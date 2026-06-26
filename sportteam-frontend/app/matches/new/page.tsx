"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { createMatch } from "@/lib/match";
import { ApiError } from "@/lib/http";
import {
    calculateHostCancelDeadline,
    calculateParticipantCancelDeadline,
    calculateRecruitDeadline,
    isBeforeNow,
    parseSlotStartAt,
    toDateTimeLocalValue,
} from "@/lib/match-policy";
import type { RequiredGender, SkillLevel, SportType } from "@/lib/types";

const SPORTS: Array<[SportType, string]> = [["FUTSAL", "풋살"], ["SOCCER", "축구"], ["BASKETBALL", "농구"], ["TENNIS", "테니스"], ["BADMINTON", "배드민턴"]];
const LEVELS: Array<[SkillLevel, string]> = [["ANY", "제한 없음"], ["LEVEL_1", "레벨 1"], ["LEVEL_2", "레벨 2"], ["LEVEL_3", "레벨 3"], ["LEVEL_4", "레벨 4"], ["LEVEL_5", "레벨 5"]];

export default function NewMatchPage() {
    return <RequireAuth><Suspense fallback={<PageLoading/>}><MatchCreateForm/></Suspense></RequireAuth>;
}

function MatchCreateForm() {
    const search = useSearchParams();
    const router = useRouter();
    const reservationId = search.get("reservationId") ?? "";
    const facilityId = search.get("facilityId") ?? "";
    const date = search.get("date") ?? "";
    const startTime = search.get("startTime") ?? "";
    const endTime = search.get("endTime") ?? "";
    const amount = Number(search.get("amount") ?? 0);
    const initialSport = (search.get("sportType") ?? "FUTSAL") as SportType;
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);
    const slotLabel = useMemo(() => `${date} ${startTime.slice(0,5)} ~ ${endTime.slice(0,5)}`, [date, endTime, startTime]);
    const matchStartAt = useMemo(() => parseSlotStartAt(date, startTime), [date, startTime]);
    const recruitDeadline = useMemo(() => matchStartAt ? calculateRecruitDeadline(matchStartAt) : null, [matchStartAt]);
    const participantCancelDeadline = useMemo(() => matchStartAt ? calculateParticipantCancelDeadline(matchStartAt) : null, [matchStartAt]);
    const hostCancelDeadline = useMemo(() => matchStartAt ? calculateHostCancelDeadline(matchStartAt) : null, [matchStartAt]);
    const recruitClosed = useMemo(() => isBeforeNow(recruitDeadline), [recruitDeadline]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setError(undefined); setSubmitting(true);
        const data = new FormData(event.currentTarget);
        try {
            if (!recruitDeadline || !participantCancelDeadline || !hostCancelDeadline) {
                setError("경기 시간 정보를 확인할 수 없습니다.");
                return;
            }
            if (recruitClosed) {
                setError("모집 마감 시간이 지난 경기 시간입니다. 다른 시간을 선택해주세요.");
                return;
            }
            const match = await createMatch({
                reservationId,
                title: String(data.get("title")),
                sportType: String(data.get("sportType")) as SportType,
                capacity: Number(data.get("capacity")),
                feePerPerson: Number(data.get("feePerPerson")),
                minSkillLevel: String(data.get("minSkillLevel")) as SkillLevel,
                maxSkillLevel: String(data.get("maxSkillLevel")) as SkillLevel,
                requiredGender: String(data.get("requiredGender")) as RequiredGender,
                recruitDeadline: toDateTimeLocalValue(recruitDeadline),
                participantCancelDeadline: toDateTimeLocalValue(participantCancelDeadline),
                hostCancelDeadline: toDateTimeLocalValue(hostCancelDeadline),
            });
            const query = new URLSearchParams({ matchId: match.matchId, facilityId, slotId: reservationId, date, startTime, endTime, amount: String(amount) });
            router.push(`/checkout/facility?${query}`);
        } catch (err) {
            if (err instanceof ApiError && err.code === "USER_005") {
                const next = window.location.pathname + window.location.search;
                const requiredSport = String(data.get("sportType"));
                router.push(`/mypage/sports?requiredSport=${requiredSport}&next=${encodeURIComponent(next)}`);
                return;
            }
            setError(err instanceof Error ? err.message : "매치를 생성하지 못했습니다.");
        }
        finally { setSubmitting(false); }
    }

    if (!reservationId) return <InvalidSelection/>;
    return <main className="flow-page"><div className="flow-shell"><Link href={`/facilities/${facilityId}`} className="flow-back">← 경기장으로 돌아가기</Link><div className="flow-heading"><span>STEP 1 OF 2</span><h1>함께할 매치를 만들어보세요</h1><p>모집 조건을 설정한 뒤 경기장 결제를 진행합니다.</p></div><div className="selected-slot"><div><span>선택한 경기 시간</span><b>{slotLabel}</b></div><strong>{amount.toLocaleString()}원</strong></div>{recruitClosed ? <div className="policy-notice"><b>모집이 마감된 경기 시간입니다.</b><p>경기 시작 1시간 전까지만 매치를 만들 수 있어요. 다른 시간을 선택해주세요.</p></div> : null}<form className="flow-form" onSubmit={submit}><FormError message={error}/><Field label="매치 제목" htmlFor="title"><Input id="title" name="title" required maxLength={100} placeholder="예: 퇴근 후 가볍게 풋살 한 게임!"/></Field><div className="flow-grid"><Field label="종목" htmlFor="sportType"><Select id="sportType" name="sportType" defaultValue={initialSport}>{SPORTS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></Field><Field label="모집 정원" htmlFor="capacity"><Input id="capacity" name="capacity" type="number" min={2} required defaultValue={10}/></Field><Field label="1인 참가비" htmlFor="feePerPerson"><Input id="feePerPerson" name="feePerPerson" type="number" min={0} required defaultValue={10000}/></Field><Field label="성별 조건" htmlFor="requiredGender"><Select id="requiredGender" name="requiredGender" defaultValue="ANY"><option value="ANY">성별 무관</option><option value="MALE">남성</option><option value="FEMALE">여성</option><option value="MIXED">혼성</option></Select></Field><Field label="최소 실력" htmlFor="minSkillLevel"><Select id="minSkillLevel" name="minSkillLevel" defaultValue="ANY">{LEVELS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></Field><Field label="최대 실력" htmlFor="maxSkillLevel"><Select id="maxSkillLevel" name="maxSkillLevel" defaultValue="ANY">{LEVELS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></Field></div><Button loading={submitting} disabled={recruitClosed} type="submit">{recruitClosed ? "모집 마감" : "매치 만들고 결제하기"}</Button></form></div></main>;
}

function InvalidSelection(){return <main className="flow-page"><div className="flow-shell empty-flow"><h1>선택한 경기 시간이 없습니다.</h1><Link href="/facilities">경기장 찾기</Link></div></main>}
function PageLoading(){return <main className="auth-loading"><span className="auth-spinner"/><p>예약 정보를 불러오고 있어요.</p></main>}
