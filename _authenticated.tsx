import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (!role) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    // Role-route guard
    const path = location.pathname;
    if (role === "ops" && path.startsWith("/driver")) {
      navigate({ to: "/ops", replace: true });
    } else if (role === "driver" && path.startsWith("/ops")) {
      navigate({ to: "/driver", replace: true });
    }
  }, [loading, session, role, navigate, location.pathname]);

  if (loading || !session || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Truck className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }
  return <Outlet />;
}
