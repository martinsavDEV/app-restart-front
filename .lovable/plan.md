

## Session Expiry — Standard industrie SaaS

### Pratiques courantes

| Type d'app | Durée session | Refresh token |
|------------|--------------|---------------|
| SaaS B2B (Notion, Figma) | 30 jours | Oui, renouvelé à chaque utilisation |
| Bancaire / Fintech | 15-30 min d'inactivité | Non |
| Apps collaboratives | 7-14 jours | Oui |
| Google / Microsoft | 90 jours | Oui |

**Recommandation pour ton cas** : session de **7 jours** avec refresh automatique tant que l'utilisateur est actif. C'est le sweet spot entre sécurité et confort.

### Implémentation

Le JWT expiry se configure côté backend. Actuellement la config par défaut est 3600s (1h) pour le JWT, mais le refresh token renouvelle la session indéfiniment.

**Approche** : configurer le refresh token lifetime à 7 jours (604800 secondes) dans `supabase/config.toml` section `[auth]`. Ainsi, après 7 jours sans activité, l'utilisateur devra se reconnecter.

| Fichier | Modification |
|---------|-------------|
| `supabase/config.toml` | Ajouter `refresh_token_rotation_enabled = true` et `refresh_token_reuse_interval = 0` + modifier la durée de vie du refresh token |

> **Note** : le fichier `config.toml` est auto-géré, mais la section `[auth]` permet de configurer ces paramètres. Si la modification directe n'est pas possible, une alternative serait d'ajouter une vérification côté client dans `AuthContext` qui compare la date de dernière connexion (stockée en localStorage) et force un sign-out après 7 jours.

