

# Migration des lineaires chemins vers surface chemin

## Probleme

La modification precedente a supprime le champ `longueur` du type `AccessSegment` et introduit `surface` a la place. Mais les donnees existantes en base ont les valeurs dans `longueur` avec `surface: 0`. Il faut copier `longueur` dans `surface` pour ne pas perdre ces informations.

## Donnees impactees

10+ enregistrements `quote_settings` avec des `access_segments` contenant des valeurs `longueur > 0` et `surface = 0`.

## Solution

Executer une requete SQL de migration sur le champ JSONB `calculator_data` de la table `quote_settings` :

Pour chaque element du tableau `access_segments`, si `longueur` existe et est > 0 et que `surface` vaut 0, copier la valeur de `longueur` dans `surface`.

## Details techniques

La migration utilisera une fonction PL/pgSQL temporaire qui :

1. Parcourt tous les `quote_settings` ayant des `access_segments`
2. Pour chaque segment, si `longueur > 0` et `surface = 0`, met `surface = longueur`
3. Met a jour le JSONB en base

Aucun fichier code n'est modifie, uniquement une migration de donnees en base.

### Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Copier `longueur` vers `surface` dans le JSONB `calculator_data` |

