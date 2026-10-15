import { requireFamilyAccessFromSession } from "../lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPersonWithAccessOrThrow(ctx: any, sessionToken: string, personId: any) {
    const person = await ctx.db.get(personId);
    if (!person) throw new Error("Perfil no encontrado");
    await requireFamilyAccessFromSession(ctx, sessionToken, person.familyId);
    return person;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPlanWithAccessOrThrow(ctx: any, sessionToken: string, planId: any) {
    const plan = await ctx.db.get(planId);
    if (!plan) throw new Error("Plan no encontrado");
    await requireFamilyAccessFromSession(ctx, sessionToken, plan.familyId);
    return plan;
}
