import { Truck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { signOut, role } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-hero-gradient text-primary-foreground shadow-soft">
      <div className="container mx-auto flex items-center justify-between py-3 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Truck className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold">Trinity Hub</div>
            <div className="text-[11px] uppercase tracking-wider text-primary-foreground/70">
              {subtitle ?? (role === "ops" ? "Operations" : "Driver")}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
