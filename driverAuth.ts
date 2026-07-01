// Maps a Driver ID to the internal email used under the hood for auth.
// Drivers never see this — they only enter their Driver ID + password.
export const DRIVER_EMAIL_DOMAIN = "trips.local";

export function driverIdToEmail(driverId: string): string {
  return `driver-${driverId.trim().toLowerCase()}@${DRIVER_EMAIL_DOMAIN}`;
}

export function isValidDriverId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,32}$/.test(id.trim());
}
