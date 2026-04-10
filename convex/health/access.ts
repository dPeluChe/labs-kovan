import { requireFamilyAccessFromSession } from "../lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPersonWithAccessOrThrow(ctx: any, sessionToken: string, personId: any) {
  const person = await ctx.db.get(personId);
  if (!person) throw new Error("Perfil no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, person.familyId);
  return person;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecordWithAccessOrThrow(ctx: any, sessionToken: string, recordId: any) {
  const record = await ctx.db.get(recordId);
  if (!record) throw new Error("Registro no encontrado");
  await getPersonWithAccessOrThrow(ctx, sessionToken, record.personId);
  return record;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMedicationWithAccessOrThrow(ctx: any, sessionToken: string, medicationId: any) {
  const medication = await ctx.db.get(medicationId);
  if (!medication) throw new Error("Medicamento no encontrado");
  await getPersonWithAccessOrThrow(ctx, sessionToken, medication.personId);
  return medication;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getStudyWithAccessOrThrow(ctx: any, sessionToken: string, studyId: any) {
  const study = await ctx.db.get(studyId);
  if (!study) throw new Error("Estudio no encontrado");
  await getPersonWithAccessOrThrow(ctx, sessionToken, study.personId);
  return study;
}

export {
  getPersonWithAccessOrThrow,
  getRecordWithAccessOrThrow,
  getMedicationWithAccessOrThrow,
  getStudyWithAccessOrThrow,
};
