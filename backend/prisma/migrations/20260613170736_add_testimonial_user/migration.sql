-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "eventsCount" TEXT NOT NULL,
    "ticketsSold" TEXT NOT NULL,
    "growth" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Testimonial" ("authorName", "company", "createdAt", "eventsCount", "growth", "id", "image", "isApproved", "quote", "rating", "role", "ticketsSold") SELECT "authorName", "company", "createdAt", "eventsCount", "growth", "id", "image", "isApproved", "quote", "rating", "role", "ticketsSold" FROM "Testimonial";
DROP TABLE "Testimonial";
ALTER TABLE "new_Testimonial" RENAME TO "Testimonial";
CREATE INDEX "Testimonial_isApproved_idx" ON "Testimonial"("isApproved");
CREATE INDEX "Testimonial_userId_idx" ON "Testimonial"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
