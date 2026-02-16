

# Refonte de l'autocompletion des variables dans les formules

## Probleme actuel

Quand on tape `$nb_eol` puis un operateur comme `*3`, le systeme pense que `$nb_eol*3` est un seul nom de variable. L'autocompletion et le filtrage se basent sur l'ensemble du texte saisi, pas sur le "token" variable en cours de frappe.

De meme, quand on selectionne une variable dans le dropdown, tout le contenu de l'input est remplace par le nom de la variable, ce qui empeche de construire une formule avec plusieurs variables.

## Solution

Rendre l'autocompletion "contextuelle" : elle doit detecter le token variable en cours de saisie (le `$mot` sous le curseur), et inserer la variable selectionnee a cet emplacement sans effacer le reste de la formule.

## Comportement cible

```text
Frappe utilisateur          | Dropdown | Filtre sur
----------------------------|----------|------------
"3*"                        | ferme    | -
"3*$"                       | ouvert   | toutes les variables
"3*$nb"                     | ouvert   | variables contenant "nb"
"3*$nb_eol"                 | ouvert   | variables contenant "nb_eol"
[clic sur $nb_eol]          | ferme    | - (input = "3*$nb_eol")
"3*$nb_eol+"                | ferme    | -
"3*$nb_eol+$"               | ouvert   | toutes les variables
"3*$nb_eol+$su"             | ouvert   | variables contenant "su"
[clic sur $surf_PF]         | ferme    | - (input = "3*$nb_eol+$surf_PF")
```

## Details techniques

### Fichier modifie : `src/components/QuantityFormulaInput.tsx`

#### 1. Fonction utilitaire : extraire le token variable sous le curseur

```text
getCurrentVariableToken(inputValue, cursorPosition):
  - Chercher en arriere depuis le curseur le dernier "$"
  - Verifier qu'entre ce "$" et le curseur il n'y a que des caracteres valides [a-zA-Z0-9_]
  - Si oui, retourner { token: "$nb", startIndex: 5, endIndex: 8 }
  - Sinon retourner null
```

#### 2. Modifier `handleInputChange`

Ouvrir le dropdown uniquement quand un token variable est en cours de frappe (detecte via `getCurrentVariableToken`). Fermer le dropdown des qu'un operateur est tape apres une variable complete.

#### 3. Modifier `getFilteredVariables`

Filtrer les variables en fonction du token variable courant (pas du texte entier). Si le token est `$nb`, filtrer sur "nb".

#### 4. Modifier `handleSelect`

Au lieu de remplacer tout l'input par le nom de la variable :
- Remplacer uniquement le token en cours (de `startIndex` a `endIndex`) par le nom complet de la variable
- Garder le reste de la formule intact
- Ne PAS faire blur, ne PAS sauvegarder immediatement (l'utilisateur peut vouloir continuer a taper)
- Fermer le dropdown

Exemple : input = `3*$nb`, curseur a la fin, selection de `$nb_eol` -> input devient `3*$nb_eol`, curseur apres `l`.

#### 5. Ne plus faire onUpdate + blur dans handleSelect

Actuellement `handleSelect` appelle `onUpdate` et fait `blur()`. Dans le nouveau comportement, la selection d'une variable insere juste le texte. La sauvegarde se fait uniquement au `blur` (quand l'utilisateur quitte la cellule), comme pour les formules.

