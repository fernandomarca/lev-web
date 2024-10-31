-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Call" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendant_name" TEXT NOT NULL,
    "attendant_peer_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_peer_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Call" ("attendant_name", "attendant_peer_id", "client_name", "client_peer_id", "created_at", "id") SELECT "attendant_name", "attendant_peer_id", "client_name", "client_peer_id", "created_at", "id" FROM "Call";
DROP TABLE "Call";
ALTER TABLE "new_Call" RENAME TO "Call";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
