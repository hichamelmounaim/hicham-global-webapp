-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "openaiKey" TEXT,
    "openRouterKey" TEXT,
    "aiModel" TEXT NOT NULL DEFAULT 'openai/gpt-4o',
    "goapiKey" TEXT,
    "ttapiKey" TEXT,
    "imageProvider" TEXT NOT NULL DEFAULT 'goapi',
    "prompts" TEXT,
    "wpUrl" TEXT,
    "wpUser" TEXT,
    "wpAppPass" TEXT,
    "authorBio" TEXT,
    "expertPersona" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wpUrl" TEXT NOT NULL,
    "wpUser" TEXT NOT NULL,
    "wpAppPass" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "step" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT,
    "featuredImageUrl" TEXT,
    "ingredientsImageUrl" TEXT,
    "finalDishImageUrl" TEXT,
    "recipeData" TEXT,
    "rankMathData" TEXT,
    "socialContent" TEXT,
    "expertContent" TEXT,
    "personalContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
