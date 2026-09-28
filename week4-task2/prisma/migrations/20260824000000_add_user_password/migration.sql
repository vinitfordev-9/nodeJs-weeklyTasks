-- Existing users need a temporary value so the new required column can be added.
-- They cannot log in until their password is replaced with a bcrypt hash.
ALTER TABLE "users" ADD COLUMN "password" VARCHAR(255);

UPDATE "users"
SET "password" = 'ACCOUNT_REQUIRES_PASSWORD_RESET'
WHERE "password" IS NULL;

ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;
