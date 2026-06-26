import { AdminNav } from "@/components/admin-nav";
import { RequireRole } from "@/components/require-role";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireRole role="ADMIN">
            <main className="admin-page">
                <div className="admin-shell">
                    <AdminNav />
                    {children}
                </div>
            </main>
        </RequireRole>
    );
}