-- CreateIndex
CREATE INDEX "ApplicationAudit_applicationId_idx" ON "public"."ApplicationAudit"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationAudit_changedById_idx" ON "public"."ApplicationAudit"("changedById");
