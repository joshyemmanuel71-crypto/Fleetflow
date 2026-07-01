import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Fleetbook" }],
  }),
  component: Index,
});

function Index() {
  const { loading, session, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/auth", replace: true });
    else if (role === "ops") navigate({ to: "/ops", replace: true });
    else if (role === "driver") navigate({ to: "/driver", replace: true });
    else navigate({ to: "/auth", replace: true });
  }, [loading, session, role, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Truck className="h-6 w-6 animate-pulse text-primary" />
    </div>
  );
}
