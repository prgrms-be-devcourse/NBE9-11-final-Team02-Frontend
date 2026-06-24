"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, FormError } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth-context";
import { completeDevPayment, getQueueStatus, issueQueueToken, prepareFacilityPayment } from "@/lib/payment";
import type { WaitingQueueTokenResponse } from "@/lib/types";

export default function FacilityCheckoutPage() {
    return <RequireAuth><Suspense fallback={<CheckoutLoading/>}><FacilityCheckout/></Suspense></RequireAuth>;
}

function FacilityCheckout() {
    const search = useSearchParams(); const router = useRouter(); const { user } = useAuth();
    const matchId = search.get("matchId") ?? ""; const slotId = search.get("slotId") ?? ""; const facilityId = search.get("facilityId") ?? "";
    const date = search.get("date") ?? ""; const startTime = search.get("startTime") ?? ""; const endTime = search.get("endTime") ?? ""; const amount = Number(search.get("amount") ?? 0);
    const [queue, setQueue] = useState<WaitingQueueTokenResponse>(); const [error,setError] = useState<string>(); const [loading,setLoading] = useState(false);

    async function pay() {
        if (!user) return; setLoading(true); setError(undefined);
        try {
            let current = queue ?? await issueQueueToken(slotId, user.userId);
            if (!current.enterable) current = await getQueueStatus(current.token);
            setQueue(current);
            if (!current.enterable) return;
            const prepared = await prepareFacilityPayment({ facilitySlotId: slotId, amount, queueToken: current.token, userId: user.userId });
            await completeDevPayment(prepared.merchantUid);
            router.replace(`/matches/${matchId}?payment=success`);
        } catch (err) { setError(err instanceof Error ? err.message : "결제를 처리하지 못했습니다."); }
        finally { setLoading(false); }
    }

    if (!matchId || !slotId || !amount) return <InvalidCheckout/>;
    return <main className="flow-page"><div className="flow-shell checkout-shell"><Link href={`/facilities/${facilityId}`} className="flow-back">← 경기장으로 돌아가기</Link><div className="flow-heading"><span>STEP 2 OF 2</span><h1>경기장 결제를 완료해주세요</h1><p>결제가 완료되면 생성한 매치가 바로 공개됩니다.</p></div><section className="payment-summary"><div className="payment-art">✓</div><dl><div><dt>이용 일시</dt><dd>{date} · {startTime.slice(0,5)} ~ {endTime.slice(0,5)}</dd></div><div><dt>결제 항목</dt><dd>경기장 대관료</dd></div><div className="payment-total"><dt>최종 결제 금액</dt><dd>{amount.toLocaleString()}원</dd></div></dl></section>{queue && !queue.enterable && <div className="queue-notice"><b>현재 대기 순번 {queue.position}번</b><p>앞에 {queue.waitingCount}명이 있습니다. 잠시 후 다시 확인해주세요.</p></div>}<FormError message={error}/><Button type="button" loading={loading} onClick={pay}>{queue && !queue.enterable ? "대기 순번 다시 확인" : "로컬 결제 완료하기"}</Button><p className="dev-payment-note">현재 로컬 개발 환경에서는 테스트 결제로 처리됩니다.</p></div></main>;
}

function InvalidCheckout(){return <main className="flow-page"><div className="flow-shell empty-flow"><h1>결제 정보가 올바르지 않습니다.</h1><Link href="/facilities">경기장 찾기</Link></div></main>}
function CheckoutLoading(){return <main className="auth-loading"><span className="auth-spinner"/><p>결제 정보를 불러오고 있어요.</p></main>}
