import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowUpDown,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { provisioningClient } from "@/lib/secondaryClient";
import { driverIdToEmail, isValidDriverId } from "@/lib/driverAuth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/ops")({
  head: () => ({ meta: [{ title: "Ops · Trinity Hub" }] }),
  component: OpsDashboard,
});

type Vehicle = { id: string; name: string; plate: string; km_rate: number; active: boolean };
type Profile = { id: string; driver_id: string | null; full_name: string };
type Trip = {
  id: string;
  created_at: string;
  driver_user_id: string;
  vehicle_id: string;
  start_km: number;
  end_km: number;
  petrol_cost: number;
  toll_paid: number;
  receipt_path: string;
  destination: string | null;
};

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

function OpsDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto py-6 px-6 space-y-6">
        <div className="flex flex-col gap-1 animate-fade-in">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Operations</h1>
          <p className="text-sm text-muted-foreground">Live trip activity, revenue, and fleet controls.</p>
        </div>

        <Tabs defaultValue="trips">
          <TabsList>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles & rates</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="trips" className="mt-5">
            <TripsView />
          </TabsContent>
          <TabsContent value="vehicles" className="mt-5">
            <VehiclesView />
          </TabsContent>
          <TabsContent value="drivers" className="mt-5">
            <DriversView />
          </TabsContent>
          <TabsContent value="team" className="mt-5">
            <OpsTeamView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function TripsView() {
  const tripsQ = useQuery({
    queryKey: ["trips", "all"],
    queryFn: async (): Promise<Trip[]> => {
      const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Trip[];
    },
  });

  const vehiclesQ = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase.from("vehicles").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Vehicle[];
    },
  });

  const driversQ = useQuery({
    queryKey: ["profiles", "drivers"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,driver_id,full_name")
        .not("driver_id", "is", null);
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const [search, setSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const vehiclesById = useMemo(
    () => Object.fromEntries((vehiclesQ.data ?? []).map((v) => [v.id, v])),
    [vehiclesQ.data]
  );
  const driversById = useMemo(
    () => Object.fromEntries((driversQ.data ?? []).map((d) => [d.id, d])),
    [driversQ.data]
  );

  const enriched = useMemo(() => {
    return (tripsQ.data ?? []).map((t) => {
      const v = vehiclesById[t.vehicle_id];
      const d = driversById[t.driver_user_id];
      const distance = Number(t.end_km) - Number(t.start_km);
      const rate = v ? Number(v.km_rate) : 0;
      const revenue = distance * rate;
      const cost = Number(t.petrol_cost) + Number(t.toll_paid);
      const profit = revenue - cost;
      return { ...t, distance, revenue, cost, profit, vehicle: v, driver: d };
    });
  }, [tripsQ.data, vehiclesById, driversById]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo).getTime() + 24 * 3600 * 1000 : null;
    let rows = enriched.filter((r) => {
      if (driverFilter !== "all" && r.driver_user_id !== driverFilter) return false;
      if (vehicleFilter !== "all" && r.vehicle_id !== vehicleFilter) return false;
      const ts = new Date(r.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (s) {
        const hay = `${r.driver?.full_name ?? ""} ${r.driver?.driver_id ?? ""} ${r.vehicle?.name ?? ""} ${
          r.vehicle?.plate ?? ""
        } ${r.destination ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    rows.sort((a, b) =>
      sortDesc
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return rows;
  }, [enriched, search, driverFilter, vehicleFilter, dateFrom, dateTo, sortDesc]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.trips += 1;
        acc.distance += r.distance;
        acc.revenue += r.revenue;
        acc.profit += r.profit;
        return acc;
      },
      { trips: 0, distance: 0, revenue: 0, profit: 0 }
    );
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Receipt className="h-4 w-4" />} label="Total Trips" value={totals.trips.toString()} loading={tripsQ.isLoading} />
        <StatCard icon={<Truck className="h-4 w-4" />} label="Total Distance" value={`${totals.distance.toFixed(1)} km`} loading={tripsQ.isLoading} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Total Revenue" value={inr(totals.revenue)} tooltip="Distance × current per-vehicle KM rate" loading={tripsQ.isLoading} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total Profit" value={inr(totals.profit)} tooltip="Revenue − (Petrol + Toll)" loading={tripsQ.isLoading} accent={totals.profit >= 0 ? "success" : "destructive"} />
      </div>

      <Card className="shadow-soft">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search driver, vehicle, plate, destination…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger><SelectValue placeholder="All drivers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All drivers</SelectItem>
                {(driversQ.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.driver_id})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger><SelectValue placeholder="All vehicles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vehicles</SelectItem>
                {(vehiclesQ.data ?? []).map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name} — {v.plate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden shadow-soft md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1 text-left" onClick={() => setSortDesc((s) => !s)}>
                    Date & Time <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Start KM</TableHead>
                <TableHead className="text-right">End KM</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead className="text-right">Petrol</TableHead>
                <TableHead className="text-right">Toll</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tripsQ.isLoading && [0, 1, 2, 3].map((i) => (
                <TableRow key={i}><TableCell colSpan={12}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              ))}
              {!tripsQ.isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">No trips match these filters.</TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.driver?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.driver?.driver_id ?? ""}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.vehicle?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.vehicle?.plate ?? ""}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={r.destination ?? ""}>
                    {r.destination ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">{Number(r.start_km).toFixed(1)}</TableCell>
                  <TableCell className="text-right">{Number(r.end_km).toFixed(1)}</TableCell>
                  <TableCell className="text-right font-medium">{r.distance.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{inr(Number(r.petrol_cost))}</TableCell>
                  <TableCell className="text-right">{inr(Number(r.toll_paid))}</TableCell>
                  <TableCell className="text-right">{inr(r.revenue)}</TableCell>
                  <TableCell className="text-right">
                    <span className={r.profit >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                      {inr(r.profit)}
                    </span>
                  </TableCell>
                  <TableCell><ReceiptButton path={r.receipt_path} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-2 md:hidden">
        {tripsQ.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        {!tripsQ.isLoading && filtered.length === 0 && (
          <Card className="shadow-soft"><CardContent className="py-6 text-center text-sm text-muted-foreground">No trips.</CardContent></Card>
        )}
        {filtered.map((r) => (
          <Card key={r.id} className="shadow-soft">
            <CardContent className="space-y-2 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{r.driver?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <ReceiptButton path={r.receipt_path} />
              </div>
              {r.destination && <div className="text-sm font-medium">To {r.destination}</div>}
              <div className="text-sm text-muted-foreground">{r.vehicle?.name} · {r.vehicle?.plate}</div>
              <div className="flex items-center justify-between text-sm">
                <span>{r.distance.toFixed(1)} km</span>
                <span>Cost {inr(r.cost)}</span>
                <span className={r.profit >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}>
                  {inr(r.profit)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, tooltip, loading, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
  loading?: boolean;
  accent?: "success" | "destructive";
}) {
  const inner = (
    <Card className="shadow-soft">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <div
            className={`mt-1.5 font-display text-2xl font-semibold ${
              accent === "success" ? "text-success" : accent === "destructive" ? "text-destructive" : ""
            }`}
          >
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
  if (!tooltip) return inner;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function ReceiptButton({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);
  const open = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 60);
    setLoading(false);
    if (error || !data) return toast.error("Could not load receipt");
    window.open(data.signedUrl, "_blank", "noopener");
  };
  return (
    <Button variant="ghost" size="sm" onClick={open} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
    </Button>
  );
}

const vehicleSchema = z.object({
  name: z.string().trim().min(1).max(60),
  plate: z.string().trim().min(2).max(20),
  km_rate: z.number().nonnegative(),
});

function VehiclesView() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase.from("vehicles").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Vehicle[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [rate, setRate] = useState("");

  const openNew = () => {
    setEditing(null);
    setName(""); setPlate(""); setRate("");
    setOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setName(v.name); setPlate(v.plate); setRate(String(v.km_rate));
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = vehicleSchema.safeParse({ name, plate, km_rate: Number(rate) });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const payload = { name: parsed.data.name, plate: parsed.data.plate, km_rate: parsed.data.km_rate };
      if (editing) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert({ ...payload, active: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vehicle deactivated");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Vehicles</CardTitle>
          <p className="text-sm text-muted-foreground">Per-vehicle KM rate applies to all trips dynamically.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add vehicle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
              <DialogDescription>Set the per-km revenue rate ops will use.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tata Ace #4" />
              </div>
              <div className="space-y-1.5">
                <Label>Plate</Label>
                <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="MH-12-AB-1234" />
              </div>
              <div className="space-y-1.5">
                <Label>KM rate (₹ per km)</Label>
                <Input type="number" step="0.1" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead className="text-right">KM rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && [0, 1].map((i) => (
              <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No vehicles yet. Add your first one.</TableCell>
              </TableRow>
            )}
            {q.data?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.plate}</TableCell>
                <TableCell className="text-right">{inr(Number(v.km_rate))}/km</TableCell>
                <TableCell>
                  {v.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {v.active && (
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const driverCreateSchema = z.object({
  driverId: z.string().refine(isValidDriverId, "2-32 chars, letters/numbers/_/- only"),
  fullName: z.string().trim().min(2).max(80),
  password: z.string().min(6).max(72),
});

const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function validateDoc(file: File | null, label: string) {
  if (!file) return;
  if (!ALLOWED_DOC_TYPES.includes(file.type)) throw new Error(`${label}: must be JPG, PNG, WEBP, or PDF`);
  if (file.size > MAX_DOC_SIZE) throw new Error(`${label}: max size 5 MB`);
}

function DriversView() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["profiles", "drivers"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,driver_id,full_name")
        .not("driver_id", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const [open, setOpen] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const resetForm = () => {
    setDriverId(""); setFullName(""); setPassword("");
    setAadhaarFile(null); setLicenseFile(null);
  };

  const create = useMutation({
    mutationFn: async () => {
      const parsed = driverCreateSchema.safeParse({ driverId, fullName, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      validateDoc(aadhaarFile, "Aadhaar");
      validateDoc(licenseFile, "Driving license");

      const { data: signUpData, error } = await provisioningClient.auth.signUp({
        email: driverIdToEmail(parsed.data.driverId),
        password: parsed.data.password,
        options: {
          data: {
            account_type: "driver",
            driver_id: parsed.data.driverId.trim().toLowerCase(),
            full_name: parsed.data.fullName,
          },
        },
      });
      if (error) {
        if (/already registered/i.test(error.message)) throw new Error("That Driver ID already exists");
        throw error;
      }
      const userId = signUpData.user?.id;
      if (!userId) return;

      const uploadDoc = async (file: File | null, kind: "aadhaar" | "license") => {
        if (!file) return null;
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${userId}/${kind}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("driver-docs")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw new Error(`Upload ${kind}: ${upErr.message}`);
        return path;
      };

      const aadhaarPath = await uploadDoc(aadhaarFile, "aadhaar");
      const licensePath = await uploadDoc(licenseFile, "license");

      if (aadhaarPath || licensePath) {
        const patch: { aadhaar_path?: string; license_path?: string } = {};
        if (aadhaarPath) patch.aadhaar_path = aadhaarPath;
        if (licensePath) patch.license_path = licensePath;
        const { error: updErr } = await supabase.from("profiles").update(patch).eq("id", userId);
        if (updErr) throw new Error(`Save documents: ${updErr.message}`);
      }
    },
    onSuccess: () => {
      toast.success("Driver created");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["profiles", "drivers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Drivers</CardTitle>
          <p className="text-sm text-muted-foreground">Drivers log in with their Driver ID and password.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add driver</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New driver</DialogTitle>
              <DialogDescription>Share the Driver ID and password with them privately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Driver ID</Label>
                <Input value={driverId} onChange={(e) => setDriverId(e.target.value)} placeholder="D-1043" />
              </div>
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Temporary password</Label>
                <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 chars" />
              </div>
              <div className="space-y-1.5">
                <Label>Aadhaar (JPG/PNG/PDF, ≤5 MB)</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setAadhaarFile(e.target.files?.[0] ?? null)}
                />
                {aadhaarFile && <p className="text-xs text-muted-foreground">{aadhaarFile.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Driving license (JPG/PNG/PDF, ≤5 MB)</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
                />
                {licenseFile && <p className="text-xs text-muted-foreground">{licenseFile.name}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => create.mutate()} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create driver
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver ID</TableHead>
              <TableHead>Full name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && [0, 1].map((i) => (
              <TableRow key={i}><TableCell colSpan={2}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">No drivers yet. Add one to get started.</TableCell>
              </TableRow>
            )}
            {q.data?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono">{d.driver_id}</TableCell>
                <TableCell>{d.full_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const opsCreateSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  fullName: z.string().trim().min(2, "Required").max(80),
  password: z.string().min(8, "Min 8 characters").max(72),
});

type OpsMember = { id: string; full_name: string };

function OpsTeamView() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["profiles", "ops"],
    queryFn: async (): Promise<OpsMember[]> => {
      // Ops policy allows reading all profiles; drivers are the ones with a driver_id.
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,driver_id,created_at")
        .is("driver_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d) => ({ id: d.id, full_name: d.full_name }));
    },
  });

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const parsed = opsCreateSchema.safeParse({ email, fullName, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await provisioningClient.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            account_type: "ops",
            full_name: parsed.data.fullName,
            invited: true,
          },
        },
      });
      if (error) {
        if (/already registered/i.test(error.message)) throw new Error("That email is already registered");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Ops member invited");
      setOpen(false);
      setEmail(""); setFullName(""); setPassword("");
      qc.invalidateQueries({ queryKey: ["profiles", "ops"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Operations team</CardTitle>
          <p className="text-sm text-muted-foreground">Ops members sign in with their email and password.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add ops member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New ops member</DialogTitle>
              <DialogDescription>Share the email and temporary password with them privately. They can change the password after signing in.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Temporary password</Label>
                <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 8 chars" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => create.mutate()} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create ops member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && [0, 1].map((i) => (
              <TableRow key={i}><TableCell><Skeleton className="h-6 w-full" /></TableCell></TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow>
                <TableCell className="py-8 text-center text-muted-foreground">No ops members yet.</TableCell>
              </TableRow>
            )}
            {q.data?.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.full_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
