-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "accessCode" TEXT,
ADD COLUMN     "adultsCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "canSharePhotos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "checkedIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkedInTime" TIMESTAMP(3),
ADD COLUMN     "minorsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "photoSharesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qrCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "uploadedByGuestId" TEXT;

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "allowPhotoSharing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxSharesPerGuest" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "DjMessage" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DjMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_likes" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_notifications" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "photoId" TEXT,
    "commentId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuStep" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "photo_likes_photoId_idx" ON "photo_likes"("photoId");

-- CreateIndex
CREATE INDEX "photo_likes_guestId_idx" ON "photo_likes"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_likes_photoId_guestId_key" ON "photo_likes"("photoId", "guestId");

-- CreateIndex
CREATE INDEX "comments_photoId_createdAt_idx" ON "comments"("photoId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "guest_notifications_guestId_createdAt_idx" ON "guest_notifications"("guestId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "guest_notifications_guestId_readAt_idx" ON "guest_notifications"("guestId", "readAt");

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_guestId_key" ON "comment_likes"("commentId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_username_key" ON "Guest"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_qrCode_key" ON "Guest"("qrCode");

-- CreateIndex
CREATE INDEX "Photo_weddingId_createdAt_idx" ON "Photo"("weddingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Photo_uploadedByGuestId_idx" ON "Photo"("uploadedByGuestId");

-- AddForeignKey
ALTER TABLE "DjMessage" ADD CONSTRAINT "DjMessage_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploadedByGuestId_fkey" FOREIGN KEY ("uploadedByGuestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notifications" ADD CONSTRAINT "guest_notifications_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notifications" ADD CONSTRAINT "guest_notifications_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notifications" ADD CONSTRAINT "guest_notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notifications" ADD CONSTRAINT "guest_notifications_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notifications" ADD CONSTRAINT "guest_notifications_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuStep" ADD CONSTRAINT "MenuStep_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
