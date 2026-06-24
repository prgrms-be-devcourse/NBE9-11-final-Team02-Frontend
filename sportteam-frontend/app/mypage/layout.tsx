import { RequireAuth } from "@/components/require-auth";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
