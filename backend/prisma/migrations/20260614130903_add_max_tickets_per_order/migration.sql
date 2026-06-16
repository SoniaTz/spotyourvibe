-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "image" TEXT,
    "importantInfo" TEXT,
    "lineup" TEXT,
    "seatingType" TEXT NOT NULL DEFAULT 'general',
    "maxTicketsPerOrder" INTEGER NOT NULL DEFAULT 10,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "organizerId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("availableSeats", "categoryId", "createdAt", "endDate", "fullDescription", "id", "image", "maxCapacity", "organizerId", "shortDescription", "startDate", "status", "title", "updatedAt", "venueId") SELECT "availableSeats", "categoryId", "createdAt", "endDate", "fullDescription", "id", "image", "maxCapacity", "organizerId", "shortDescription", "startDate", "status", "title", "updatedAt", "venueId" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
CREATE INDEX "Event_categoryId_idx" ON "Event"("categoryId");
CREATE INDEX "Event_venueId_idx" ON "Event"("venueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
