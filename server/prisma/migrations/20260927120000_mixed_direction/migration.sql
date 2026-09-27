-- An ordre de mission may now be spent in both zones.
ALTER TYPE "Direction" ADD VALUE 'MIXTE';

-- Split each count into a Nord and a Sud column.
ALTER TABLE "Decompte"
  ADD COLUMN "repas_pec_nord" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "repas_pec_sud" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "repas_sans_pec_nord" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "repas_sans_pec_sud" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "hebergement_pec_nord" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "hebergement_pec_sud" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "hebergement_sans_pec_nord" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "hebergement_sans_pec_sud" INTEGER NOT NULL DEFAULT 0;

-- Existing décomptes were all spent in their ordre's single Direction.
UPDATE "Decompte" d SET
  "repas_pec_nord"            = d."repas_pec",
  "repas_sans_pec_nord"       = d."repas_sans_pec",
  "hebergement_pec_nord"      = d."hebergement_pec",
  "hebergement_sans_pec_nord" = d."hebergement_sans_pec"
FROM "Mission" m
WHERE d."missionId" = m."n_mission" AND m."direction" = 'NORD';

UPDATE "Decompte" d SET
  "repas_pec_sud"            = d."repas_pec",
  "repas_sans_pec_sud"       = d."repas_sans_pec",
  "hebergement_pec_sud"      = d."hebergement_pec",
  "hebergement_sans_pec_sud" = d."hebergement_sans_pec"
FROM "Mission" m
WHERE d."missionId" = m."n_mission" AND m."direction" = 'SUD';

ALTER TABLE "Decompte"
  DROP COLUMN "repas_pec",
  DROP COLUMN "repas_sans_pec",
  DROP COLUMN "hebergement_pec",
  DROP COLUMN "hebergement_sans_pec";
