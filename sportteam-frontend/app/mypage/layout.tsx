import { RequireRole } from "@/components/require-role";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="USER">{children}</RequireRole>;
}
