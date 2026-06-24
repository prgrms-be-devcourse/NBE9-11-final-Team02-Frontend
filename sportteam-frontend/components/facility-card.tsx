import Link from "next/link";
import type { FacilitySummary } from "@/lib/types";

const gradients = ["facility-court-a", "facility-court-b", "facility-court-c"];
export function FacilityCard({ facility, index }: { facility: FacilitySummary; index: number }) {
  const price = Math.min(facility.defaultWeekdayPrice, facility.defaultWeekendPrice);
  return <Link className="facility-card" href={`/facilities/${facility.facilityId}`}><div className={`facility-art ${gradients[index % gradients.length]}`}><span>{index === 0 ? "⚽" : index === 1 ? "🏀" : "🏸"}</span><em>♡</em></div><div className="facility-body"><div className="rating">★ <b>{facility.ratingAvg.toFixed(1)}</b> <span>({facility.reviewCount})</span></div><h3>{facility.name}</h3><p>⌖ {facility.address}</p><div><span>{[...facility.sportTypes].slice(0, 2).join(" · ")}</span><strong>{price.toLocaleString()}원~ <small>/ 시간</small></strong></div></div></Link>;
}
