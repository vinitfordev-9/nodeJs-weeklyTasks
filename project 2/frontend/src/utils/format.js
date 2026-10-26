export const labels = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};
export const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
export function timeAgo(value) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value)) / 86400000),
  );
  return days === 0
    ? "Posted today"
    : `${days} day${days === 1 ? "" : "s"} ago`;
}
export function salary(job) {
  const format = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: job.currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  if (job.salaryMin == null && job.salaryMax == null)
    return "Salary not listed";
  if (job.salaryMin == null) return `Up to ${format(job.salaryMax)}`;
  if (job.salaryMax == null) return `From ${format(job.salaryMin)}`;
  return `${format(job.salaryMin)} – ${format(job.salaryMax)}`;
}
