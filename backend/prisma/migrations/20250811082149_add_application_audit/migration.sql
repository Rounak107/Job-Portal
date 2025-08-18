-- CreateTable
CREATE TABLE "public"."ApplicationAudit" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "previousStatus" "public"."Status" NOT NULL,
    "newStatus" "public"."Status" NOT NULL,
    "changedById" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationAudit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ApplicationAudit" ADD CONSTRAINT "ApplicationAudit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationAudit" ADD CONSTRAINT "ApplicationAudit_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
