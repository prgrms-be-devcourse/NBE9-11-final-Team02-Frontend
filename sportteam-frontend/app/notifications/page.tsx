"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { getNotifications, markNotificationRead } from "@/lib/user-service";
import type { NotificationResponse } from "@/lib/types";

export default function NotificationsPage(){return <RequireAuth><NotificationList/></RequireAuth>}
function NotificationList(){const[items,setItems]=useState<NotificationResponse[]>();const[error,setError]=useState<string>();useEffect(()=>{let active=true;getNotifications().then(v=>{if(active)setItems(v)}).catch(e=>{if(active)setError(e instanceof Error?e.message:"알림을 불러오지 못했습니다.")});return()=>{active=false}},[]);async function read(item:NotificationResponse){if(item.read)return;try{const updated=await markNotificationRead(item.notificationId);setItems(current=>current?.map(v=>v.notificationId===updated.notificationId?updated:v))}catch(e){setError(e instanceof Error?e.message:"알림을 읽음 처리하지 못했습니다.")}}return <main className="flow-page"><div className="flow-shell"><div className="flow-heading"><span>NOTIFICATIONS</span><h1>알림</h1><p>매치 진행과 결제 상태를 놓치지 마세요.</p></div>{error&&<p className="notification-error">{error}</p>}<div className="notification-list">{!items?<div className="auth-loading"><span className="auth-spinner"/></div>:items.length===0?<p className="record-empty">새로운 알림이 없습니다.</p>:items.map(item=><button type="button" key={item.notificationId} className={item.read?"read":""} onClick={()=>read(item)}><i/><div><b>{item.title}</b><p>{item.content}</p><small>{new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(item.createdAt))}</small></div></button>)}</div></div></main>}
