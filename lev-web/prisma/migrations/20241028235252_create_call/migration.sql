-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendant_name" TEXT NOT NULL,
    "attendant_peer_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_peer_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
