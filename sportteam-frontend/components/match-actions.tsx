"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function MatchActions({ matchId, disabled }: { matchId: string; disabled: boolean }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    const token = localStorage.getItem("accessToken");
    if (!token) { window.location.href = `/login?next=/matches/${matchId}`; return; }
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/v1/matches/${matchId}/participants`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "매치 참가에 실패했습니다.");
      setMessage("매치 참가 신청이 완료됐어요!");
    } catch (error) { setMessage(error instanceof Error ? error.message : "서버에 연결할 수 없습니다."); }
    finally { setLoading(false); }
  }

  return <div className="match-actions"><button onClick={join} disabled={disabled || loading}>{loading ? "참가 처리 중..." : disabled ? "모집이 마감됐어요" : "이 매치 참가하기"}</button><small>참가 시 1인 분담금 결제가 진행됩니다.</small>{message && <p>{message}</p>}</div>;
}
