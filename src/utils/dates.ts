export function calculateAge(birthDate: number) {
  const now = new Date();
  const birth = new Date(birthDate);
  const diff = now.getTime() - birth.getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

  if (years > 0) return `${years} años${months > 0 ? ` ${months} meses` : ""}`;
  return `${months} meses`;
}
