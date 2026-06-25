import { RequireRole } from "@/components/require-role";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    return <RequireRole role="MANAGER">{children}</RequireRole>;
}
