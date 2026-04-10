import { requireFamilyAccessFromSession } from "../lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getContactWithAccessOrThrow(ctx: any, sessionToken: string, contactId: any) {
  const contact = await ctx.db.get(contactId);
  if (!contact) throw new Error("Contacto no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, contact.familyId);
  return contact;
}
