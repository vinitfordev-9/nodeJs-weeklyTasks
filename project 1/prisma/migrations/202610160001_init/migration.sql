CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "Status" AS ENUM ('todo', 'in-progress', 'done');
CREATE TABLE "tasks" (
  "id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(5000),
  "dueDate" TIMESTAMPTZ(3),
  "priority" "Priority" NOT NULL DEFAULT 'medium',
  "status" "Status" NOT NULL DEFAULT 'todo',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tasks_status_priority_idx" ON "tasks"("status", "priority");
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");
