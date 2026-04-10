import { requireFamilyAccessFromSession } from "../lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getVehicleWithAccessOrThrow(ctx: any, sessionToken: string, vehicleId: any) {
  const vehicle = await ctx.db.get(vehicleId);
  if (!vehicle) throw new Error("Vehículo no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, vehicle.familyId);
  return vehicle;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getVehicleEventWithAccessOrThrow(ctx: any, sessionToken: string, eventId: any) {
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Evento no encontrado");
  const vehicle = await getVehicleWithAccessOrThrow(ctx, sessionToken, event.vehicleId);
  return { event, vehicle };
}

export { getVehicleWithAccessOrThrow, getVehicleEventWithAccessOrThrow };
