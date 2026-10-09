export const proPlans = [
  { id: "monthly", label: "Monthly", amountCents: 800, intervalMonths: 1, price: "$8", cadence: "per month" },
  { id: "quarterly", label: "Three months", amountCents: 1500, intervalMonths: 3, price: "$15", cadence: "every 3 months" },
  { id: "semiannual", label: "Six months", amountCents: 4500, intervalMonths: 6, price: "$45", cadence: "every 6 months" },
  { id: "annual", label: "Annual", amountCents: 9000, intervalMonths: 12, price: "$90", cadence: "per year" },
] as const;

export type ProPlanId = (typeof proPlans)[number]["id"];

export const proFeatures = [
  "Evidence Graph across researchers, publications, institutions and opportunities",
  "Citation-grounded Research Assistant",
  "Purpose-led scientific introductions with recipient controls",
  "Advanced fit analysis across scientific evidence",
] as const;

export const freeFeatures = [
  "Complete individual and institutional profiles",
  "Experience, education, skills, projects, awards, grants and external links",
  "Publications and ORCID identity context",
  "Browse researchers, institutions, laboratories, jobs and grants",
  "Save opportunities and manage privacy and alerts",
] as const;
