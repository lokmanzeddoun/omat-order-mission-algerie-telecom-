# Fichiers de test pour l'import (utilisateurs et services)

Fichiers CSV pour tester à la main les boutons « Importer » des pages **Services** et
**Utilisateurs** (compte SUPER_ADMIN). Les imports acceptent `.xlsx` et `.csv`.

Chaque fichier est **accepté en entier ou refusé en entier** : si une seule ligne est
invalide, rien n'est enregistré et une fenêtre liste chaque problème (ligne Excel,
colonne, valeur, problème).

Données de test : services `TST*` et `012`, matricules `9xxx`, emails `*@example.dz`.
Elles n'entrent pas en conflit avec le seed (`DG`, `DRH`…, matricules 1001–2005).

## Ordre conseillé

Importez d'abord les **services** (les utilisateurs référencent `TST1` et `TST2`),
dans l'ordre des numéros. Résultats attendus sur une base issue du seed :

### services/

| Fichier | Résultat attendu |
|---|---|
| `01-valid.csv` | ✅ 3 créé(s), 0 mis à jour (`TST1`, `TST2`, `012` — le zéro initial et les accents sont conservés) |
| `01-valid.csv` **une 2ᵉ fois** | ✅ 0 créé(s), 3 mis à jour — pas de doublon (voir plus bas) |
| `02-reimport-rename-and-add.csv` | ✅ 1 créé(s), 3 mis à jour (`TST1` renommé, `TST3` ajouté) |
| `03-errors.csv` | ❌ 4 erreurs : ligne 2 code vide, ligne 3 nom vide, ligne 5 `tst5` doublon de la ligne 4, ligne 7 `TST6` doublon de la ligne 6 |
| `04-missing-header.csv` | ❌ Colonne « Name » manquante (l'en-tête est `Libelle`) |
| `05-excel-fr-semicolon.csv` | ✅ 1 créé(s) — CSV Excel français (`;`, BOM, en-tête `Nom`, colonne en trop ignorée) |
| `06-header-only.csv` | ❌ Toast « Le fichier ne contient aucune ligne. » |

### users/

| Fichier | Résultat attendu |
|---|---|
| `01-valid.csv` | ✅ 3 créé(s) : 9001 (service `TST1`), 9002 (`DRH`), 9003 (sans service). Rôle/catégorie en minuscules acceptés. Mot de passe : `secret123` |
| `02-reimport-without-password.csv` | ✅ 0 créé(s), 3 mis à jour. Colonne Password vide → **le mot de passe est conservé** (9001 se connecte toujours avec `secret123`) |
| `03-errors.csv` | ❌ 11 erreurs (détail ci-dessous) |
| `04-missing-columns.csv` | ❌ Colonnes « Email » et « Grade » manquantes |
| `05-excel-fr-semicolon-reordered.csv` | ✅ 1 créé(s) (9301) — `;`, colonnes dans un autre ordre, en-têtes français (`Prénom`, `E-mail`, `Rôle`, `Catégorie`, `Mot de passe`, `Code service`), colonne `Statut` ignorée |
| `06-export-format-no-password.csv` | ✅ 0 créé(s), 1 mis à jour — même format que l'export (pas de colonne Password, colonnes `Service`/`Status`/`User Since` ignorées) |
| `01-valid.csv` **une 2ᵉ fois** | ✅ 0 créé(s), 3 mis à jour |

Détail de `users/03-errors.csv` :

| Ligne | Colonne | Problème attendu |
|---|---|---|
| 2 | Matricule | `abc` → doit être un nombre entier |
| 3 | Nom | Champ obligatoire |
| 4 | Email | `pas-un-email` → Adresse email invalide |
| 5 | Role | `BOSS` → Rôle invalide |
| 6 | Category | `STAGIAIRE` → Catégorie invalide |
| 7 | Password | `abc` → au moins 6 caractères (la valeur n'est jamais affichée) |
| 8 | Password | Obligatoire pour un nouvel utilisateur |
| 9 | ServiceId | `ZZZ` → Service inexistant ou archivé |
| 11 | Matricule | 9108 → Doublon de la ligne 10 |
| 13 | Email | `MEME.email@…` → Doublon de la ligne 12 (casse ignorée) |
| 14 | Email | `amine.test@…` déjà utilisé par le matricule 9001 *(seulement si `01-valid.csv` a été importé avant)* |

## Et si j'importe le même fichier plusieurs fois ?

Ce n'est **pas** signalé comme un doublon : l'import est une **mise à jour par clé**
(`Matricule` pour les utilisateurs, `Code` pour les services). Réimporter le même
fichier ne crée rien de nouveau ; le message indique alors « 0 créé(s), N mis à jour ».
C'est ce qui permet d'exporter, corriger dans Excel, puis réimporter.

Ce qui **est** signalé comme doublon :
- la même clé (matricule, code) ou le même email deux fois **dans un même fichier** ;
- un email déjà utilisé en base par **un autre** matricule.

## Nettoyage

Les fichiers valides créent les services `TST1`, `TST2`, `TST3`, `TST8` et `012`, et les
utilisateurs `9001`, `9002`, `9003` et `9301`. Archivez-les depuis les pages Services / Utilisateurs.
