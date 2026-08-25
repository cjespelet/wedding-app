-- CreateTable
CREATE TABLE "FloorPlanElement" (
    "id" TEXT NOT NULL,
    "floorPlanId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "xCm" DOUBLE PRECISION NOT NULL,
    "yCm" DOUBLE PRECISION NOT NULL,
    "rotationDeg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanElement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FloorPlanElement" ADD CONSTRAINT "FloorPlanElement_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
