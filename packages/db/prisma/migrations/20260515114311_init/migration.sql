-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_key" ON "user"("account");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
