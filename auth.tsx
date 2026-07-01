import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { driverIdToEmail, isValidDriverId } from "@/lib/driverAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const driverSchema = z.object({
  driverId: z.string().refine(isValidDriverId, "2-32 chars, letters/numbers/_/- only"),
  password: z.string().min(6, "Min 6 characters"),
});

const opsSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(128),
});

const opsSignupSchema = opsSchema.extend({
  fullName: z.string().trim().min(2, "Required").max(80),
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · Trinity Hub" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && session && role) {
      navigate({ to: role === "ops" ? "/ops" : "/driver", replace: true });
    }
  }, [session, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center py-10 px-6">
        <div className="mb-7 flex flex-col items-center text-primary-foreground">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lift">
            <Truck className="h-7 w-7" strokeWidth={2.4} />
          </div>
          <h1 className="font-display text-3xl font-semibold">Trinity Hub</h1>
          <p className="text-sm text-primary-foreground/70">Logistics trip tracker</p>
        </div>

        <Card className="w-full max-w-md shadow-lift animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Choose your account type</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="driver">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="driver">Driver</TabsTrigger>
                <TabsTrigger value="ops">Operations</TabsTrigger>
              </TabsList>
              <TabsContent value="driver" className="mt-5">
                <DriverLogin />
              </TabsContent>
              <TabsContent value="ops" className="mt-5">
                <OpsAuth />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DriverLogin() {
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = driverSchema.safeParse({ driverId, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: driverIdToEmail(parsed.data.driverId),
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error("Invalid Driver ID or password");
      return;
    }
    toast.success("Welcome back");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="driverId">Driver ID</Label>
        <Input
          id="driverId"
          autoComplete="username"
          placeholder="e.g. D-1043"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          disabled={busy}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dpw">Password</Label>
        <Input
          id="dpw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Don't have a Driver ID? Ask your operations team.
      </p>
    </form>
  );
}

function OpsAuth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const parsed = opsSchema.safeParse({ email, password });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw new Error("Invalid email or password");
        toast.success("Welcome back");
      } else {
        const parsed = opsSignupSchema.safeParse({ email, password, fullName });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { account_type: "ops", full_name: parsed.data.fullName },
          },
        });
        if (error) {
          if (/already registered/i.test(error.message)) throw new Error("That email is already registered");
          throw error;
        }
        toast.success("Account created");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="fn">Full name</Label>
          <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={busy} required />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="em">Email</Label>
        <Input
          id="em"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pw">Password</Label>
        <Input
          id="pw"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "signin" ? "Sign in" : "Create ops account"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {mode === "signin" ? "First time setting up?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="font-medium text-primary underline-offset-2 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create the first ops account" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
