# Fichiers de test pour l'import (structures et utilisateurs)

Fichiers valides pour tester à la main les boutons « Importer » des pages **Structures** et
**Utilisateurs** (compte SUPER_ADMIN). Chaque import accepte `.csv` et `.xlsx`.

Un fichier est **accepté en entier ou refusé en entier** : si une seule ligne est invalide,
rien n'est enregistré et une fenêtre liste chaque problème (ligne, colonne, valeur, problème).

Données de test : structures `99…` / `98…` (codes HR fictifs), `TSX*` et `DT-CTE` (sous la racine
`DT` du seed), matricules `9xxx`, emails `*@example.dz`. Elles n'entrent pas en conflit avec le
seed (`DG`, `DRH`, `DT`…, matricules 1001–2005). `structures/structures-hr.csv` est l'extrait RH
réel (Sous Direction Commerciale de Tlemcen, codes `13C…`).

## Ordre

Importez d'abord les **structures**, puis les **utilisateurs** (ils référencent les structures).
Le CSV et l'Excel contiennent des données différentes : on peut importer les quatre fichiers
sur la même base.

| Fichier | Résultat attendu (base issue du seed) |
|---|---|
| `structures/structures-hr.csv` | ✅ 25 créé(s) : extrait RH réel (`;`). Racine `13C0000000` ; 12 structures au 2ᵉ niveau (ACTEL, départements, `13CT000000`) ; 12 au 3ᵉ (P.P sous leur ACTEL, sections ERSTC sous `13CT000000`) |
| `structures/structures-valid.csv` | ✅ 6 créé(s) : racines `99T0000000`, `99O0000000` ; `99TS000000`, `99TS100000` (3ᵉ niveau), `99TA010000`, `99OA010000` |
| `structures/structures-valid.xlsx` | ✅ 4 créé(s), format de l'export (colonne `Parent`) : racine `TSX`, `TSX-PAIE`, `TSX-PAIE-ARCH`, et `DT-CTE` sous la racine existante `DT` |
| `users/users-valid.csv` | ✅ 6 créé(s) : 9001 à 9005 répartis sur les arbres `99T0000000` / `99O0000000`, 9006 sans structure |
| `users/users-valid.xlsx` | ✅ 5 créé(s) : 9101 à 9104 dans l'arbre `TSX` et `DT / Cellule Test Excel`, 9105 dans `DRH` |
| N'importe lequel **une 2ᵉ fois** | ✅ 0 créé(s), N mis à jour (pas de doublon) |

## Format des structures

| Colonne | En-têtes acceptés | Rôle |
|---|---|---|
| Code | `Unité org.`, `Code` | oui : numéro d'unité organisationnelle (`13CA010000`), clé de mise à jour |
| Nom | `Lib long UO`, `Name`, `Nom` | oui : libellé affiché tel quel (`SDC / ACTEL TLEMCEN`) |
| Parent | `Parent`, `Code parent` | non : code de la structure parente |

- Sans `Parent`, la structure parente **se déduit du code** : parmi les codes de même longueur
  (en base ou dans le fichier), celui dont les chiffres sans les zéros finaux sont le plus long
  préfixe. `13CA011000` → `13CA010000` → `13C0000000` ; `13CT100000` → `13CT000000`.
  Les codes « faits main » (`DT`, `NOM-200`…) ne se déduisent pas du code : la structure parente
  se déduit alors du **nom** (segments séparés par ` / `, abréviations reconnues par leurs
  initiales : `SDC` = `Sous Direction Commerciale`, `ERSTC` = `Etablissement Régional Support
  Technique au Commercial`). Un nouveau nom à ` / ` dont le parent est introuvable ou ambigu est
  refusé : indiquez alors `Parent`. Essai : `structures/structures-names.csv` (10 créé(s), 3 niveaux).
- Le libellé n'est pas analysé (« SDC / ERSTC / … » n'a pas besoin de correspondre au parent).
- L'ordre des lignes est libre : les parents sont créés avant leurs enfants. 3 niveaux au maximum.
- CSV séparé par `,`, `;` (Excel français) ou tabulation. L'export (`Code`, `Name`, `Parent`) se
  réimporte tel quel.
- Une structure existante ne peut pas changer de parent par import (utilisez « Déplacer »).
- `?dryRun=true` sur l'API renvoie l'aperçu (créations / mises à jour / erreurs) sans rien écrire.

## Format des utilisateurs

| Colonne | En-têtes acceptés | Obligatoire |
|---|---|---|
| Matricule | `Matricule` | oui (entier positif, clé de mise à jour) |
| Nom | `Nom` | oui |
| Prénom | `Prenom`, `Prénom` | oui |
| Email | `Email`, `E-mail` | oui (unique, casse ignorée) |
| Catégorie | `Category`, `Catégorie` | oui : `EXECUTION_MAITRISE`, `CADRE`, `CADRE_SUPERIEUR` (casse ignorée) |
| Grade | `Grade` | oui |
| Structure | `ServiceId`, `Code service` | non : **code** de la structure (`99TS000000`) |

- Les colonnes `Role` et `Password` sont **ignorées** : un nouvel utilisateur est créé avec le
  rôle `USER` et un **mot de passe temporaire aléatoire**, affiché une seule fois après l'import,
  qu'il doit changer à la première connexion. Un utilisateur existant garde son mot de passe.
- Les autres colonnes (ex. `Service`, `Status` d'un export) sont ignorées.

## Scénario hiérarchie : droits des administrateurs (`hierarchy/`)

Un arbre de 3 niveaux avec 14 utilisateurs, pour vérifier qu'un administrateur gère sa
structure et tout ce qui est en dessous, mais rien au-dessus ni à côté.

```
98H0000000  Direction Hiérarchie Test        9501 (admin, responsable)   9502
├── 98HN000000  Département Nord            9511 (admin, responsable)   9512 (admin)   9513
│   ├── 98HN100000  Service Réseau          9521 (admin, responsable)   9522   9523
│   └── 98HN200000  Service Clients         9531   9532                  (pas de responsable)
└── 98HS000000  Département Sud             9541 (admin)   9542          (pas de responsable)
    └── 98HS100000  Service Réseau          9551   9552
```

### Mise en place (compte SUPER_ADMIN)

1. Structures → Importer `hierarchy/structures-hierarchy.csv` (6 créé(s)).
2. Utilisateurs → Importer `hierarchy/users-hierarchy.csv` (14 créé(s)). **Notez les mots de
   passe temporaires affichés** : ils ne sont montrés qu'une fois.
3. Utilisateurs → modifier le rôle en **Administrateur** pour 9501, 9511, 9512, 9521 et 9541.
4. Structures → modifier le **Responsable** : `98H0000000` → 9501, `98HN000000` → 9511,
   `98HN100000` → 9521. Laissez `98HS000000` (Département Sud) sans responsable.
5. Connectez-vous avec chaque administrateur (le mot de passe temporaire doit être changé à la
   première connexion).

### Résultats attendus

Page Utilisateurs (les comptes du seed ne doivent jamais apparaître) :

| Connecté en tant que | Voit | Ne voit pas |
|---|---|---|
| 9501 (racine) | les 14 | — |
| 9511 ou 9512 (Nord) | 8 : tout `Département Nord` et ses 2 services | la racine (9501, 9502), tout le Sud |
| 9521 (Nord / Réseau) | 3 : 9521, 9522, 9523 | son chef 9511, le Service Clients voisin, le Sud |
| 9541 (Sud, sans responsable) | 3 : lui-même, 9551, 9552 | 9542, son collègue du même niveau |

Actions :

| Action | Résultat attendu |
|---|---|
| 9511 modifie le grade de 9523 (2 niveaux plus bas) | ✅ |
| 9511 déplace 9513 vers `Service Clients` (dans son arbre) | ✅ |
| 9511 déplace 9513 vers `Département Sud` | ❌ refusé |
| 9511 modifie 9502 (au-dessus) ou 9542 (à côté) | ❌ refusé |
| 9511 change le rôle de 9513 | ❌ refusé (seul le super admin change les rôles) |
| 9512, admin du Nord sans être responsable, gère le Nord | ✅ (la structure a un responsable) |
| 9541 gère 9551 (niveau inférieur) | ✅ |
| 9541 gère 9542 (même niveau, structure sans responsable) | ❌ refusé |
| 9521 crée un lot pour 9522 + 9523 | ✅ 2 ordres |
| 9521 crée un lot pour 9522 + 9511 (son chef) | ❌ tout le lot est refusé, rien n'est créé |
| 9511 crée un lot pour 9513 + 9522 + 9531 (3 niveaux) | ✅ 3 ordres |
| 9541 crée un ordre pour 9542 | ❌ refusé |
| 9521 ouvre la fiche de 9511 / 9541 archive 9522 | ❌ refusé |

## Nettoyage

Les fichiers créent les structures `13C*` (extrait RH), `99*`, `98*`, `TSX*` et `DT-CTE`,
et les utilisateurs `9001`–`9006`, `9101`–`9105` et `9501`–`9552`. Archivez d'abord les utilisateurs, puis les
structures (les plus profondes d'abord), depuis les pages Utilisateurs / Structures.
