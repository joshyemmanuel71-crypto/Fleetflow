import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Camera, Loader2, CheckCircle2, X, Play, Square, Plus, Fuel, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/driver")({
  head: () => ({ meta: [{ title: "Driver · Fleetbook" }] }),
  component: DriverDashboard,
});

type Vehicle = { id: string; name: string; plate: string; km_rate: number };
type Expense = { id: string; type: "petrol" | "toll"; amount: number; note?: string };
type StoredReceipt = { dataUrl: string; name: string; type: string; size: number };
type ActiveTrip = {
  vehicle_id: string;
  start_km: number;
  destination: string;
  started_at: string;
  expenses: Expense[];
  end_km?: string;
  receipt?: StoredReceipt;
};

const dataUrlToFile = (r: StoredReceipt): File => {
  const [meta, b64] = r.dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || r.type || "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], r.name, { type: mime });
};

const fileToDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(f);
  });

const ACTIVE_KEY = (uid: string) => `fleetbook:active-trip:${uid}`;

const startSchema = z.object({
  vehicle_id: z.string().uuid("Select a vehicle"),
  start_km: z.number().nonnegative("Must be ≥ 0"),
  destination: z.string().trim().min(2, "Enter the destination").max(120, "Destination is too long"),
});

function DriverDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const vehiclesQ = useQuery({
    queryKey: ["vehicles", "active"],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id,name,plate,km_rate")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Vehicle[];
    },
  });

  const tripsQ = useQuery({
    queryKey: ["trips", "driver", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id,created_at,vehicle_id,start_km,end_km,petrol_cost,toll_paid,destination")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [active, setActive] = useState<ActiveTrip | null>(null);
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(ACTIVE_KEY(user.id));
      if (raw) setActive(JSON.parse(raw));
    } catch {}
  }, [user]);
  const persistActive = (a: ActiveTrip | null) => {
    if (!user) return;
    setActive(a);
    if (a) localStorage.setItem(ACTIVE_KEY(user.id), JSON.stringify(a));
    else localStorage.removeItem(ACTIVE_KEY(user.id));
  };

  const [vehicleId, setVehicleId] = useState("");
  const [startKm, setStartKm] = useState("");
  const [destination, setDestination] = useState("");

  const startTrip = () => {
    const parsed = startSchema.safeParse({
      vehicle_id: vehicleId,
      start_km: Number(startKm),
      destination,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    persistActive({
      vehicle_id: parsed.data.vehicle_id,
      start_km: parsed.data.start_km,
      destination: parsed.data.destination,
      started_at: new Date().toISOString(),
      expenses: [],
    });
    setVehicleId("");
    setStartKm("");
    setDestination("");
    toast.success("Trip started");
  };

  const [expType, setExpType] = useState<"petrol" | "toll">("petrol");
  const [expAmount, setExpAmount] = useState("");
  const addExpense = () => {
    if (!active) return;
    const amt = Number(expAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    persistActive({
      ...active,
      expenses: [...active.expenses, { id: crypto.randomUUID(), type: expType, amount: amt }],
    });
    setExpAmount("");
  };
  const removeExpense = (id: string) => {
    if (!active) return;
    persistActive({ ...active, expenses: active.expenses.filter((e) => e.id !== id) });
  };

  const [endKm, setEndKm] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!active) return;
    if (active.end_km !== undefined && endKm === "") setEndKm(active.end_km);
    if (active.receipt && !receipt) {
      const f = dataUrlToFile(active.receipt);
      setReceipt(f);
      setPreview(active.receipt.dataUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.vehicle_id, active?.started_at]);

  const updateEndKm = (v: string) => {
    setEndKm(v);
    if (active) persistActive({ ...active, end_km: v });
  };

  const handleFile = async (f: File | null) => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setReceipt(f);
    if (!f) {
      setPreview(null);
      if (active) persistActive({ ...active, receipt: undefined });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(f);
      setPreview(dataUrl);
      if (active) {
        persistActive({
          ...active,
          receipt: { dataUrl, name: f.name, type: f.type, size: f.size },
        });
      }
    } catch {
      setPreview(URL.createObjectURL(f));
    }
  };

  const activeVehicle = vehiclesQ.data?.find((v) => v.id === active?.vehicle_id);
  const petrolTotal = active?.expenses.filter((e) => e.type === "petrol").reduce((s, e) => s + e.amount, 0) ?? 0;
  const tollTotal = active?.expenses.filter((e) => e.type === "toll").reduce((s, e) => s + e.amount, 0) ?? 0;
  const liveDistance = active && endKm ? Number(endKm) - active.start_km : 0;

  const endTrip = useMutation({
    mutationFn: async () => {
      if (!user || !active) throw new Error("No active trip");
      if (!receipt) throw new Error("Please attach the receipt image");
      if (receipt.size > 5 * 1024 * 1024) throw new Error("Receipt must be under 5 MB");
      if (!receipt.type.startsWith("image/")) throw new Error("Receipt must be an image");
      const end = Number(endKm);
      if (!end || end <= active.start_km) throw new Error("End KM must be greater than Start KM");

      const vehicle = vehiclesQ.data?.find((v) => v.id === active.vehicle_id);
      if (!vehicle) throw new Error("Vehicle not found");

      const ext = receipt.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("receipts")
        .upload(path, receipt, { contentType: receipt.type, upsert: false });
      if (upErr) throw new Error("Upload failed: " + upErr.message);

      const { error: insErr } = await supabase.from("trips").insert({
        driver_user_id: user.id,
        vehicle_id: active.vehicle_id,
        start_km: active.start_km,
        end_km: end,
        petrol_cost: petrolTotal,
        toll_paid: tollTotal,
        km_rate_snapshot: vehicle.km_rate,
        receipt_path: path,
        destination: active.destination,
      });
      if (insErr) {
        await supabase.storage.from("receipts").remove([path]);
        if (/rate limit/i.test(insErr.message)) throw new Error("Rate limit: max 10 trips per hour");
        if (/duplicate/i.test(insErr.message)) throw new Error("Duplicate trip detected. Please wait a moment.");
        throw new Error(insErr.message);
      }
    },
    onSuccess: () => {
      toast.success("Trip completed");
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      setReceipt(null);
      setPreview(null);
      setEndKm("");
      persistActive(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["trips", "driver", user?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelTrip = () => {
    if (!confirm("Cancel this active trip? Logged expenses will be discarded.")) return;
    persistActive(null);
    setEndKm("");
    handleFile(null);
    toast.message("Trip cancelled");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="container mx-auto max-w-xl py-5 px-4 space-y-5">
        {!active ? (
          <>
            <div className="animate-fade-in">
              <h1 className="font-display text-2xl font-semibold">Start a trip</h1>
              <p className="text-sm text-muted-foreground">
                Pick your vehicle and record the starting odometer.
              </p>
            </div>
            <Card className="shadow-soft">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="veh">Vehicle</Label>
                  {vehiclesQ.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={vehicleId} onValueChange={setVehicleId}>
                      <SelectTrigger id="veh">
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {(vehiclesQ.data ?? []).map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} — {v.plate}
                          </SelectItem>
                        ))}
                        {vehiclesQ.data && vehiclesQ.data.length === 0 && (
                          <div className="px-2 py-3 text-sm text-muted-foreground">
                            No vehicles yet. Ask ops.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sk">Start KM</Label>
                  <Input
                    id="sk"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={startKm}
                    onChange={(e) => setStartKm(e.target.value)}
                    placeholder="e.g. 45230"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dest">Destination</Label>
                  <Input
                    id="dest"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Mumbai → Pune"
                    maxLength={120}
                  />
                </div>
                <Button onClick={startTrip} className="h-12 w-full text-base">
                  <Play className="mr-2 h-4 w-4" /> Start trip
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="animate-fade-in flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
                  Trip in progress
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  To <span className="font-medium text-foreground">{active.destination}</span>
                  {" · "}
                  {activeVehicle ? `${activeVehicle.name} · ${activeVehicle.plate}` : "Vehicle"}
                  {" · "}Started {new Date(active.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={cancelTrip} disabled={endTrip.isPending}>
                Cancel
              </Button>
            </div>

            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Start KM</div>
                    <div className="mt-1 font-display text-lg font-semibold">{active.start_km}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Petrol</div>
                    <div className="mt-1 font-display text-lg font-semibold">₹{petrolTotal.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Tolls</div>
                    <div className="mt-1 font-display text-lg font-semibold">₹{tollTotal.toFixed(0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add expense</CardTitle>
                <CardDescription>Log petrol fills and toll payments as you go.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={expType === "petrol" ? "default" : "outline"}
                    onClick={() => setExpType("petrol")}
                  >
                    <Fuel className="mr-2 h-4 w-4" /> Petrol
                  </Button>
                  <Button
                    type="button"
                    variant={expType === "toll" ? "default" : "outline"}
                    onClick={() => setExpType("toll")}
                  >
                    <ReceiptIcon className="mr-2 h-4 w-4" /> Toll
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={`Amount (₹)`}
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                  />
                  <Button type="button" onClick={addExpense}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {active.expenses.length > 0 && (
                  <ul className="divide-y rounded-lg border">
                    {active.expenses.map((e) => (
                      <li key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          {e.type === "petrol" ? (
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="capitalize">{e.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">₹{e.amount.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeExpense(e.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft border-accent/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">End trip</CardTitle>
                <CardDescription>Enter the ending odometer and upload your receipt.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    endTrip.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="ek">End KM</Label>
                    <Input
                      id="ek"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.1"
                      value={endKm}
                      onChange={(e) => updateEndKm(e.target.value)}
                      disabled={endTrip.isPending}
                      required
                    />
                  </div>

                  {liveDistance > 0 && (
                    <div className="rounded-lg bg-secondary px-3 py-2 text-sm">
                      Distance: <span className="font-semibold">{liveDistance.toFixed(1)} km</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Receipt photo</Label>
                    {preview ? (
                      <div className="relative overflow-hidden rounded-lg border bg-muted">
                        <img src={preview} alt="Receipt preview" className="h-48 w-full object-contain" />
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute right-2 top-2 h-7 w-7"
                          onClick={() => handleFile(null)}
                          disabled={endTrip.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={endTrip.isPending}
                        className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
                      >
                        <Camera className="h-6 w-6" />
                        <span className="text-sm font-medium">Tap to capture or upload</span>
                        <span className="text-xs">Max 5 MB · JPG/PNG</span>
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <Button type="submit" className="h-12 w-full text-base" disabled={endTrip.isPending}>
                    {endTrip.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        <Square className="mr-2 h-4 w-4" /> End trip
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        <div>
          <h2 className="mb-2 font-display text-lg font-semibold">Recent trips</h2>
          <div className="space-y-2">
            {tripsQ.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            {tripsQ.data?.length === 0 && (
              <Card className="shadow-soft">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  No trips yet. Start your first one above.
                </CardContent>
              </Card>
            )}
            {tripsQ.data?.map((t: any) => {
              const v = vehiclesQ.data?.find((x) => x.id === t.vehicle_id);
              const dist = Number(t.end_km) - Number(t.start_km);
              return (
                <Card key={t.id} className="shadow-soft">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.destination ?? "Trip"}</div>
                      <div className="text-xs text-muted-foreground">
                        {v?.name ?? "Vehicle"} · {dist.toFixed(1)} km · {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        ₹{(Number(t.petrol_cost) + Number(t.toll_paid)).toFixed(0)}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
