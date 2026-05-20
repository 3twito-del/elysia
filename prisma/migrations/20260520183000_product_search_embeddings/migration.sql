CREATE TABLE "ProductSearchEmbedding" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "vector" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSearchEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductSearchEmbedding_productId_model_dimension_key" ON "ProductSearchEmbedding"("productId", "model", "dimension");
CREATE INDEX "ProductSearchEmbedding_model_dimension_idx" ON "ProductSearchEmbedding"("model", "dimension");
CREATE INDEX "ProductSearchEmbedding_sourceHash_idx" ON "ProductSearchEmbedding"("sourceHash");

ALTER TABLE "ProductSearchEmbedding"
ADD CONSTRAINT "ProductSearchEmbedding_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
