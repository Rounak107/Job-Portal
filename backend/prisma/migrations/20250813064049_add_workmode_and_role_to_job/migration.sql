-- CreateEnum
CREATE TYPE "public"."WorkMode" AS ENUM ('OFFICE', 'HOME', 'REMOTE', 'HYBRID');

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "role" TEXT,
ADD COLUMN     "workMode" "public"."WorkMode" NOT NULL DEFAULT 'REMOTE';
