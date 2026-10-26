-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('candidate', 'company');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('onsite', 'hybrid', 'remote');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('submitted', 'reviewing', 'shortlisted', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "companyName" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "location" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "tags" TEXT[],
    "type" "JobType" NOT NULL DEFAULT 'full_time',
    "workMode" "WorkMode" NOT NULL DEFAULT 'hybrid',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "JobStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "coverLetter" VARCHAR(3000),
    "resumeName" VARCHAR(200) NOT NULL,
    "resumeBytes" BYTEA NOT NULL,
    "resumeSize" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "jobs_companyId_createdAt_idx" ON "jobs"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "jobs_status_createdAt_idx" ON "jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "jobs_tags_idx" ON "jobs" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "applications_candidateId_createdAt_idx" ON "applications"("candidateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "applications_jobId_candidateId_key" ON "applications"("jobId", "candidateId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Case-insensitive substring searches use trigram indexes as the board grows.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "jobs_title_search_idx" ON "jobs" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "jobs_location_search_idx" ON "jobs" USING GIN ("location" gin_trgm_ops);
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_range" CHECK (("salaryMin" IS NULL OR "salaryMin" >= 0) AND ("salaryMax" IS NULL OR "salaryMax" >= 0) AND ("salaryMin" IS NULL OR "salaryMax" IS NULL OR "salaryMin" <= "salaryMax"));
