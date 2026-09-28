require("dotenv").config();

const prisma = require("../config/prisma");
const logger = require("../config/logger");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Usage: npm run user:make-admin -- user@example.com");
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  logger.info(
    { userId: user.id, email: user.email, role: user.role },
    "User role updated",
  );
}

main()
  .catch((error) => {
    logger.error({ err: error }, "Unable to update user role");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
