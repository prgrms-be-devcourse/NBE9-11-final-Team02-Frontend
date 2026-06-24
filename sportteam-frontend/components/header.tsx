"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" href="/"><svg viewBox="0 0 38 38" aria-hidden="true"><path d="M7 4h15a9 9 0 0 1 0 18H14v12H7V4Z"/><circle cx="22" cy="13" r="3"/></svg><span>PLAYON</span></Link>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="메뉴 열기"><span/><span/><span/></button>
    <nav className={open ? "open" : ""}><Link href="/matches">매치 찾기</Link><Link href="/facilities">경기장</Link><Link href="/my">마이 플레이</Link><Link className="login-link" href="/login">로그인</Link><Link className="signup-link" href="/signup">회원가입</Link></nav>
  </div></header>;
}
