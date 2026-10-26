import { prisma } from "../src/config/database.js";
import { hashPassword } from "../src/auth/auth.service.js";
const passwordHash = await hashPassword("DemoPass123!");
const companies = [
  "Folklore",
  "Forma",
  "Orbit",
  "Lumen",
  "Evergreen",
  "Gather",
];
const roles = [
  [
    "Senior Product Designer",
    "Bengaluru, India",
    "hybrid",
    "full_time",
    ["design", "figma", "research"],
    1800000,
    2800000,
  ],
  [
    "Frontend Engineer",
    "Remote, India",
    "remote",
    "full_time",
    ["react", "typescript", "frontend"],
    1600000,
    2600000,
  ],
  [
    "Brand & Visual Designer",
    "Mumbai, India",
    "onsite",
    "full_time",
    ["design", "branding", "figma"],
    1200000,
    1800000,
  ],
  [
    "Product Marketing Manager",
    "Delhi, India",
    "hybrid",
    "full_time",
    ["marketing", "strategy", "growth"],
    1500000,
    2400000,
  ],
  [
    "Backend Engineer",
    "Pune, India",
    "remote",
    "full_time",
    ["node.js", "postgresql", "api"],
    1800000,
    3000000,
  ],
  [
    "Community & Culture Lead",
    "Bengaluru, India",
    "hybrid",
    "full_time",
    ["community", "people", "operations"],
    1000000,
    1600000,
  ],
  [
    "Design Research Intern",
    "Bengaluru, India",
    "hybrid",
    "internship",
    ["research", "design"],
    300000,
    480000,
  ],
  [
    "Content Strategist",
    "Remote, India",
    "remote",
    "contract",
    ["content", "strategy"],
    800000,
    1400000,
  ],
  [
    "Part-time UX Writer",
    "Mumbai, India",
    "remote",
    "part_time",
    ["writing", "design"],
    600000,
    1000000,
  ],
];
try {
  const owners = [];
  for (const companyName of companies) {
    const email = `hello@${companyName.toLowerCase()}.demo`;
    owners.push(
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: `${companyName} Team`,
          email,
          passwordHash,
          role: "company",
          companyName,
        },
      }),
    );
  }
  await prisma.user.upsert({
    where: { email: "alex@candidate.demo" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "alex@candidate.demo",
      passwordHash,
      role: "candidate",
    },
  });
  for (const [index, role] of roles.entries()) {
    const [title, location, workMode, type, tags, salaryMin, salaryMax] = role;
    const owner = owners[index % owners.length];
    const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    await prisma.job.upsert({
      where: { id },
      update: {},
      create: {
        id,
        companyId: owner.id,
        title,
        location,
        workMode,
        type,
        tags,
        salaryMin,
        salaryMax,
        description: `At ${owner.companyName}, we believe the best work happens when curious people have room to do something meaningful. We are looking for a ${title.toLowerCase()} to help shape what comes next.\n\nYou will work with a small, thoughtful team, take ownership of real projects, and collaborate across disciplines. Expect clear goals, honest feedback, and space to bring your own perspective.\n\nWe offer flexible working hours, a learning budget, and a culture built around trust. These are fictional demo opportunities for exploring the job board.`,
        requirements: `A strong foundation in ${tags.join(", ")}.\nClear communication and a collaborative approach to problem-solving.\nExamples of your work and a willingness to keep learning.\nAn interest in building useful, thoughtful experiences for people.`,
        createdAt: new Date(Date.now() - index * 86400000),
      },
    });
  }
  console.log(
    "Seeded 9 fictional jobs, 6 companies, and 1 candidate. Demo password: DemoPass123!",
  );
  console.log("Candidate: alex@candidate.demo | Company: hello@folklore.demo");
} finally {
  await prisma.$disconnect();
}
