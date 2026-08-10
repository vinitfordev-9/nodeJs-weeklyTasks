import "reflect-metadata";
import "dotenv/config";
import { app } from "./app";
import { AppDataSource } from "./data-source";

const port = Number(process.env.PORT ?? 3000);

export async function startServer(): Promise<void> {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

if (require.main === module) {
  startServer().catch((error: unknown) => {
    console.error("Unable to start API:", error);
    process.exitCode = 1;
  });
}
