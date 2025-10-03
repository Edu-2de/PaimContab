-- CreateTable
CREATE TABLE "ConsultationBooking" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "companyName" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationBooking_consultationDate_key" ON "ConsultationBooking"("consultationDate");

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
