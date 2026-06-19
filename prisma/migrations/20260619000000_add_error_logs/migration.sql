-- CreateTable: error_logs
CREATE TABLE "error_logs" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "status_code" SMALLINT     NOT NULL,
    "name"        VARCHAR(100),
    "code"        VARCHAR(50),
    "message"     TEXT,
    "stack"       TEXT,
    "method"      VARCHAR(10)  NOT NULL,
    "path"        TEXT         NOT NULL,
    "route"       VARCHAR(255),
    "body"        JSONB,
    "query"       JSONB,
    "params"      JSONB,
    "ip_hash"     VARCHAR(64),
    "user_id"     VARCHAR(64),
    "request_id"  VARCHAR(64),
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: error_logs
CREATE INDEX "error_logs_created_at_idx" ON "error_logs"("created_at" DESC);
CREATE INDEX "error_logs_status_code_created_at_idx" ON "error_logs"("status_code", "created_at" DESC);
