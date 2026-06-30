// Supabase connection settings for FleetFlow
// Safe to expose publicly — this is the "anon" public key, access is controlled
// by Row Level Security rules set on the database itself.
const SUPABASE_URL = 'https://sasgoxcndceuldjuvmda.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc2dveGNuZGNldWxkanV2bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTE5NDQsImV4cCI6MjA5ODM4Nzk0NH0.u_-r9Bc6Cs6hbTKJz9ZGfwYhFGrpCFtFbL7UBuC_Uyo';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pulls live vehicles + trips from Supabase and maps them into the
// shape the rest of app.js already expects (same fields as the old mock data).
async function loadFleetDataFromSupabase() {
  const { data: vehiclesData, error: vErr } = await supabaseClient.from('vehicles').select('*');
  const { data: tripsData, error: tErr } = await supabaseClient.from('trips').select('*');

  if (vErr) console.error('Error loading vehicles:', vErr);
  if (tErr) console.error('Error loading trips:', tErr);

  if (vehiclesData) {
    state.vehicles = vehiclesData.map(v => ({
      id: v.id,
      type: v.type,
      status: v.status,
      speed: Number(v.speed) || 0,
      driver: v.driver,
      phone: v.phone,
      lat: 0,
      lng: 0,
      currentRoute: v.current_route || [],
      routeIdx: v.route_idx || 0,
      routeProgress: Number(v.route_progress) || 0,
      fuelEfficiency: v.fuel_efficiency,
      fuelLevel: Number(v.fuel_level) || 0
    }));
  }

  if (tripsData) {
    state.trips = tripsData.map(t => ({
      tripNo: t.trip_no,
      customer: t.customer,
      driver: t.driver,
      vehicle: t.vehicle,
      origin: t.origin,
      destination: t.destination,
      distance: t.distance,
      status: t.status,
      revenue: Number(t.revenue) || 0,
      progress: Number(t.progress) || 0
    }));
  }
}

// Saves a vehicle's current state back to Supabase (call after changes you want to persist).
async function saveVehicleToSupabase(vehicle) {
  await supabaseClient.from('vehicles').update({
    status: vehicle.status,
    speed: vehicle.speed,
    route_idx: vehicle.routeIdx,
    route_progress: vehicle.routeProgress,
    fuel_level: vehicle.fuelLevel,
    updated_at: new Date().toISOString()
  }).eq('id', vehicle.id);
}

// Saves a trip's current state back to Supabase.
async function saveTripToSupabase(trip) {
  await supabaseClient.from('trips').update({
    status: trip.status,
    progress: trip.progress
  }).eq('trip_no', trip.tripNo);
}

// Saves a fuel log entry to Supabase.
async function saveFuelLogToSupabase(vehicleId, amount, qtyLiters) {
  await supabaseClient.from('fuel_logs').insert({
    vehicle_id: vehicleId,
    amount: amount,
    quantity_liters: qtyLiters
  });
}

// Saves a toll log entry to Supabase.
async function saveTollLogToSupabase(vehicleId, amount, location) {
  await supabaseClient.from('toll_logs').insert({
    vehicle_id: vehicleId,
    amount: amount,
    location: location
  });
}
