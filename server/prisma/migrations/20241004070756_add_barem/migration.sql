-- CreateTable
CREATE TABLE "Barem" (
    "id" SERIAL NOT NULL,
    "libell" "Category" NOT NULL,
    "repas_nord" DOUBLE PRECISION NOT NULL,
    "hebergement_nord" DOUBLE PRECISION NOT NULL,
    "repas_sud" DOUBLE PRECISION NOT NULL,
    "hebergement_sud" DOUBLE PRECISION NOT NULL,
    "montant_km" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Barem_pkey" PRIMARY KEY ("id")
);
