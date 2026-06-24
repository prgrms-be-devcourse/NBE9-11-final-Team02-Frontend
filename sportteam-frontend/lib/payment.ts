import { apiFetch } from "./http";
import type { PaymentPrepareResponse, WaitingQueueTokenResponse } from "./types";

export function issueQueueToken(facilitySlotId: string, userId: string) {
    return apiFetch<WaitingQueueTokenResponse>(
        `/api/v1/queue/facility-slots/${facilitySlotId}/tokens`,
        { method: "POST", auth: true, headers: { "X-USER-ID": userId } },
    );
}

export function getQueueStatus(token: string) {
    return apiFetch<WaitingQueueTokenResponse>(`/api/v1/queue/tokens/${token}`, {
        auth: true,
    });
}

export function prepareFacilityPayment(input: {
    facilitySlotId: string;
    amount: number;
    queueToken: string;
    userId: string;
}) {
    const query = new URLSearchParams({ queueToken: input.queueToken });
    return apiFetch<PaymentPrepareResponse>(`/api/v1/payments/prepare?${query}`, {
        method: "POST",
        auth: true,
        headers: { "X-USER-ID": input.userId },
        body: {
            matchId: null,
            facilitySlotId: input.facilitySlotId,
            amount: input.amount,
            paymentType: "FACILITY",
        },
    });
}

/** 로컬 dev 프로필에서 PG 결제 성공 웹훅을 모의 실행 */
export function completeDevPayment(merchantUid: string) {
    return apiFetch<{ status: string }>(`/api/v1/dev/payments/${merchantUid}/success`, {
        method: "POST",
        auth: true,
    });
}
