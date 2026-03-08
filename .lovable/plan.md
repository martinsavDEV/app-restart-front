

# Bug : la source de prix ne persiste pas lors du chargement de template

## Cause identifiée

Dans `PricingView.tsx` ligne 268, lors de la **création d'une nouvelle ligne** (ajout depuis template ou manuellement), le `priceSource` est écrit dans le champ `comment` au lieu de `price_source` :

```typescript
// ACTUEL (bug) — ligne 268
const newLine: any = {
  designation: line.designation,
  quantity: line.quantity,
  unit: line.unit,
  unit_price: line.unitPrice,
  comment: line.priceSource || "",  // ← priceSource écrit dans comment !
  order_index: nextOrderIndex,
};
```

Le champ `price_source` n'est jamais renseigné à la création. Du coup, quand on recharge le chiffrage, `price_source` est `null` en base et la source n'apparaît pas.

## Correction

**Fichier** : `src/components/PricingView.tsx`

Ajouter `price_source` et corriger `comment` :

```typescript
const newLine: any = {
  designation: line.designation,
  quantity: line.quantity,
  unit: line.unit,
  unit_price: line.unitPrice,
  comment: line.comment || "",          // ← le vrai commentaire
  price_source: line.priceSource || "", // ← la source de prix
  order_index: nextOrderIndex,
};
```

C'est un fix d'une seule ligne. Après ça, toute ligne créée (template ou manuelle) avec une source de prix la conservera en base et l'affichera au rechargement.

