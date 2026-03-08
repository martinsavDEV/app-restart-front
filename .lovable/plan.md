

# Sync nb_eol, catalogue d'eoliennes, suppression "Versions de chiffrage"

## 3 chantiers

### 1. Sync bidirectionnelle nb_eol ↔ lignes turbines

**Fichier** : `src/components/CalculatorDialog.tsx`

Quand l'utilisateur modifie `nb_eol` dans les paramètres globaux :
- Si nb_eol > turbines.length : ajouter des turbines vides (E04, E05...) en conservant les existantes
- Si nb_eol < turbines.length : supprimer les dernières turbines (avec confirmation si elles contiennent des données)
- Le code existant met déjà à jour nb_eol quand on ajoute/supprime manuellement une turbine — rien à changer de ce côté

Modification du `onChange` du champ nb_eol (lignes 341-346) pour appeler une fonction `syncTurbinesToCount(newCount)`.

### 2. Catalogue d'éoliennes (nouveau écran)

**Nouvelle table** `turbine_catalog` :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| manufacturer | text | "Vestas", "Nordex" |
| model | text | "V90", "V150", "N163"... |
| created_at | timestamptz | |

**Nouvelle table** `foundation_history` :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| turbine_id | uuid FK → turbine_catalog | |
| hub_height | numeric | HH en mètres |
| diametre_fondation | numeric | Diamètre fondation (m) |
| marge_securite | numeric | |
| pente_talus | text | "1:1", "3:2"... |
| hauteur_cage | numeric | |
| project_name | text | Nom du projet de référence (optionnel) |
| notes | text | Commentaire libre |
| created_at | timestamptz | |

RLS : lecture/écriture pour les utilisateurs authentifiés.

**Nouveaux fichiers** :
- `src/components/TurbineCatalogView.tsx` — écran CRUD avec liste des modèles, et pour chaque modèle, tableau des designs historiques par HH
- `src/hooks/useTurbineCatalog.ts` — hooks pour les requêtes

**Intégration dans le Calculator** : dans les paramètres globaux, le champ "Type plateforme" devient un Select qui puise dans le catalogue. Quand un modèle + HH sont sélectionnés, on propose de pré-remplir les paramètres de fondation depuis l'historique.

### 3. Remplacement sidebar "Versions de chiffrage" → "Catalogue éoliennes"

**Fichier** : `src/components/Sidebar.tsx`
- Remplacer `{ id: "quotes", label: "Versions de chiffrage", icon: FileStack }` par `{ id: "turbine-catalog", label: "Catalogue éoliennes", icon: Wind }` (ou `Zap`)
- Supprimer la logique `quotesEnabled` qui n'a plus lieu d'être

**Fichier** : `src/pages/Index.tsx`
- Remplacer le case `"quotes"` par `"turbine-catalog"` → rendre `<TurbineCatalogView />`
- Supprimer les props/state liés à `quotesEnabled`

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer `turbine_catalog` + `foundation_history` avec RLS |
| `src/components/TurbineCatalogView.tsx` | Nouvel écran catalogue |
| `src/hooks/useTurbineCatalog.ts` | Hooks CRUD |
| `src/components/CalculatorDialog.tsx` | Sync nb_eol + sélecteur modèle éolienne |
| `src/components/Sidebar.tsx` | Remplacer "Versions de chiffrage" par "Catalogue éoliennes" |
| `src/pages/Index.tsx` | Router vers TurbineCatalogView, supprimer quotesEnabled |

