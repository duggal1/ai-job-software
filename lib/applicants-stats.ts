export function buildApplicantDays(
  applicants: Array<{ createdAt: Date }>,
  days = 14,
): Array<{ day: string; count: number }> {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const buckets: Array<{ day: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    buckets.push({ day: new Date(now - i * DAY).toISOString().slice(0, 10), count: 0 });
  }
  for (const applicant of applicants) {
    const key = new Date(applicant.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.find((d) => d.day === key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}
