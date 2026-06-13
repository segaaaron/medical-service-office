-- CreateEnum
CREATE TYPE "ReviewInviteStatus" AS ENUM ('pending', 'used', 'expired', 'revoked');

-- AlterTable: reviews — apellido + invitación de origen
ALTER TABLE "reviews"
  ADD COLUMN "patient_lastname" VARCHAR(100),
  ADD COLUMN "invite_id"        UUID;

-- CreateTable: review_invites
CREATE TABLE "review_invites" (
    "id"               UUID               NOT NULL DEFAULT gen_random_uuid(),
    "token"            VARCHAR(64)        NOT NULL,
    "patient_name"     VARCHAR(100)       NOT NULL,
    "patient_lastname" VARCHAR(100)       NOT NULL,
    "email"            VARCHAR(150),
    "phone"            VARCHAR(20),
    "status"           "ReviewInviteStatus" NOT NULL DEFAULT 'pending',
    "review_id"        UUID,
    "created_at"       TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"       TIMESTAMPTZ        NOT NULL,
    "used_at"          TIMESTAMPTZ,

    CONSTRAINT "review_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: review_invites
CREATE UNIQUE INDEX "review_invites_token_key"     ON "review_invites"("token");
CREATE UNIQUE INDEX "review_invites_review_id_key" ON "review_invites"("review_id");
CREATE INDEX        "review_invites_status_idx"     ON "review_invites"("status");
CREATE INDEX        "review_invites_created_at_idx" ON "review_invites"("created_at" DESC);

-- CreateIndex: reviews.invite_id
CREATE INDEX "reviews_invite_id_idx" ON "reviews"("invite_id");

-- AddForeignKey: reviews.invite_id → review_invites.id (origen de la reseña)
ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_invite_id_fkey"
  FOREIGN KEY ("invite_id") REFERENCES "review_invites"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: review_invites.review_id → reviews.id (reseña resultante)
ALTER TABLE "review_invites"
  ADD CONSTRAINT "review_invites_review_id_fkey"
  FOREIGN KEY ("review_id") REFERENCES "reviews"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
