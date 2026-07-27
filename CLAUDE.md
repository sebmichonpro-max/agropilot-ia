# CLAUDE.md — AgroPilot.IA

> SaaS de gestion pour PME agroalimentaires. Multi-tenant, freemium, IA embarquée.

---

## Contexte métier

AgroPilot.IA aide les PME agroalimentaires (5-200 salariés) à gérer leur conformité réglementaire et leur production au quotidien. Les utilisateurs sont des responsables qualité, chefs de production, planificateurs et dirigeants de PME. Ils ne sont PAS techniques. L'interface doit être simple, guidée, avec un vocabulaire métier qu'ils connaissent.

### Problèmes que résout AgroPilot.IA
- Traçabilité encore sur papier ou Excel, ingérable lors des rappels produits
- Plans HACCP documentés une fois puis jamais mis à jour
- Étiquetage INCO fait à la main, risque d'erreur sur les allergènes
- Pas de vision temps réel sur les KPI production (TRS, rendement, taux de service)
- Audits IFS/BRC stressants par manque de documentation centralisée
- Pas d'outil adapté PME (les ERP agro coûtent 50-500k€ et prennent des mois à déployer)

### Positionnement concurrentiel

AgroPilot.IA vise le créneau des PME (5-200 salariés) qui n'ont ni le budget ni les ressources IT pour un ERP complet, mais qui doivent être conformes et piloter leur performance.

**Concurrents directs :**
- Hello Harel : SaaS agro, HACCP/IFS/BRC intégré, KPI, le plus proche concurrent. Avantage AgroPilot.IA : IA embarquée, UX plus moderne
- Seekreet : digitalisation des contrôles terrain, plus limité fonctionnellement

**Concurrents indirects (haut du marché, hors budget PME) :**
- ERP agro : VIF, Infologic, Akanea, Copilote, Aptean, Infor (50-500k€, déploiement en mois)
- MES : Mapex, zenon, VIF MES (20-150k€)
- GMAO : Mobility Work, AQ Manager, DimoMaint (5-30k€)

**Différenciateurs AgroPilot.IA :**
- IA embarquée (Claude) qui guide les utilisateurs sur HACCP, étiquetage, analyse de NC
- SaaS accessible (freemium, pas d'investissement initial)
- Déploiement en jours, pas en mois
- UX simple pensée pour des non-techniciens en atelier (mobile-first)
- Tout-en-un léger : qualité + traçabilité + production dans un seul outil

### KPI intégrés au module Production (PREMIUM)

Le dashboard de production doit calculer et afficher ces indicateurs :

**Performance industrielle :**
- **TRS = Disponibilité x Performance x Qualité** (en %). Colonne vertébrale du tableau de bord. Benchmark agro : 60-70% (bon), >80% (excellent)
  - Disponibilité = (Temps de production - Arrêts) / Temps de production
  - Performance = Production réelle / Production théorique
  - Qualité = Produits conformes / Production totale
- **MTBF** (Mean Time Between Failures) : temps moyen entre pannes, en heures
- **MTTR** (Mean Time To Repair) : temps moyen de réparation, en minutes

**Qualité et pertes :**
- **Taux de perte** = (Matières perdues / Matières entrées) x 100. Objectif : <5%
- **Taux de NC** = (Lots non-conformes / Lots produits) x 100
- **Taux de réclamations client** = Réclamations / Commandes livrées

**Logistique :**
- **Taux de service** = Commandes livrées complètes et à temps / Commandes totales. Cible >98%
- **Rotation des stocks** = Coût des marchandises vendues / Stock moyen

**Données de référence (pour benchmarker les résultats) :**
- Une ligne digitalisée affiche en moyenne 15 à 30% de gains de productivité et 10 à 20% de réduction des rebuts
- ROI moyen de la digitalisation : 18 à 24 mois
- Exemple concret : +15% TRS et -4% déchets en 1 an, économie de 370 000€ sur une seule ligne (secteur viande)

**Implémentation dans AgroPilot.IA :**
- Stocker les données en entiers (durées en secondes, quantités en grammes, TRS en centièmes de %)
- Calculs côté serveur, jamais côté client (cohérence des données)
- Granularité : par poste (8h), par jour, par semaine, par mois
- Visualisation : graphiques Recharts, tendances sur 30/90 jours, comparaison entre lignes/équipes

### Cadre réglementaire (Claude doit connaître)

**Paquet Hygiène UE :**
- Reg. CE 178/2002 : traçabilité obligatoire "de la fourche à la fourchette"
- Reg. CE 852/2004 : hygiène des denrées alimentaires, obligation HACCP
- Reg. CE 853/2004 : règles spécifiques pour les produits d'origine animale
- Reg. UE 2021/382 : gestion des allergènes, culture de sécurité alimentaire

**HACCP (7 principes) :**
1. Analyse des dangers (biologiques, chimiques, physiques)
2. Détermination des CCP (Points Critiques pour la Maîtrise)
3. Établissement des limites critiques (ex: cuisson coeur >63°C)
4. Mise en place d'un système de surveillance (ex: relevés de température)
5. Détermination des actions correctives
6. Vérification (audits internes, analyses)
7. Documentation et enregistrement

**Tendance 2025-2026 :** digitalisation obligatoire des enregistrements CCP. Fini les relevés manuscrits. Les DDPP/DGCCRF privilégient les preuves numériques horodatées.

**Règlement INCO (UE 1169/2011) :**
Mentions obligatoires sur étiquettes : dénomination de vente, liste des ingrédients, quantité nette, DLC ou DDM, conditions de conservation, nom et adresse du responsable, pays d'origine (si trompeur), déclaration nutritionnelle, titre alcoométrique (si >1,2% vol), numéro de lot.

**14 allergènes à déclaration obligatoire (ADO) :**
1. Céréales contenant du gluten (blé, seigle, orge, avoine, épeautre, kamut)
2. Crustacés
3. Oeufs
4. Poissons
5. Arachides
6. Soja
7. Lait (y compris lactose)
8. Fruits à coque (amandes, noisettes, noix, noix de cajou, noix de pécan, noix du Brésil, pistaches, noix de macadamia)
9. Céleri
10. Moutarde
11. Sésame
12. Anhydride sulfureux et sulfites (>10 mg/kg ou 10 mg/l en SO2)
13. Lupin
14. Mollusques

Règles d'affichage : mise en évidence dans la liste des ingrédients (gras, souligné ou couleur distincte). Taille minimum 1,2mm (0,9mm pour emballages <80cm2). Mention "peut contenir des traces de..." si contamination croisée possible.

**Sanctions :** amendes jusqu'à 1 500€/infraction (personne physique), 7 500€ (personne morale). Fermeture administrative possible en récidive. En 2025, 21% des restaurants contrôlés par la DGCCRF ont reçu une mise en demeure pour non-conformité allergènes.

### Vocabulaire métier (utiliser dans l'UI et le code)
- **OF :** Ordre de Fabrication
- **Lot :** unité de traçabilité, identifié par un numéro unique
- **DLC :** Date Limite de Consommation (produits périssables)
- **DDM :** Date de Durabilité Minimale (produits secs)
- **CCP :** Critical Control Point (Point Critique pour la Maîtrise)
- **PMS :** Plan de Maîtrise Sanitaire (BPH + HACCP + traçabilité + nettoyage + nuisibles)
- **BPH :** Bonnes Pratiques d'Hygiène
- **NC :** Non-Conformité
- **TRS/OEE :** Taux de Rendement Synthétique (disponibilité x performance x qualité)
- **Rendement matière :** ratio produits finis / matières premières
- **Taux de service :** % commandes livrées complètes et à temps
- **FIFO :** First In First Out (obligatoire pour les matières périssables)
- **Diagramme de fabrication :** schéma des étapes de transformation
- **Séquencement :** ordre de passage des produits sur une ligne
- **Chaîne du froid :** maintien continu des températures réglementaires
- **Contamination croisée :** transfert de danger entre produits/surfaces

**IMPORTANT :** L'app aide à être conforme, elle ne remplace PAS un audit, un conseil juridique ou un conseil médical. Toute réponse IA doit inclure ce disclaimer quand pertinent.

---

## Stack technique

| Couche | Techno | Notes |
|---|---|---|
| Frontend | Next.js 15 App Router, TypeScript strict | Server Components par défaut |
| UI | Tailwind CSS + shadcn/ui | UI en français, code en anglais |
| Backend | Supabase (PostgreSQL + Auth + RLS + Storage) | Pas d'ORM, SDK direct |
| IA | API Anthropic (Claude Sonnet), serveur uniquement | SSE pour le streaming |
| Emails | Resend | Transactionnels uniquement |
| Monitoring | Sentry | Erreurs + performance |
| Hébergement | Vercel | Gratuit en dev, Pro avant prod commerciale |
| Collaboration / PM | Miro (boards + MCP server) | Roadmap, kanban, architecture, wireframes |

---

## Architecture multi-tenant

Chaque table métier a une colonne `organization_id` (uuid, FK vers `organizations`).

**Règles absolues :**
- RLS activée sur TOUTES les tables métier sans exception
- Le `organization_id` vient TOUJOURS de la session Supabase côté serveur, JAMAIS du client
- Une policy RLS par opération (SELECT, INSERT, UPDATE, DELETE), pas de policy fourre-tout
- Toujours ajouter un index sur les colonnes référencées dans les policies RLS (sinon performances catastrophiques)
- Tables globales sans RLS : `plans`, `features`, `app_config`
- Tester les policies depuis le SDK client, PAS depuis le SQL Editor (il bypass RLS)

**Pattern RLS standard avec helper function (optimisé) :**
```sql
-- Helper function SECURITY DEFINER pour éviter les subqueries coûteuses par row
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- Policies utilisant la helper function
CREATE POLICY "tenant_select" ON [table]
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "tenant_insert" ON [table]
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "tenant_update" ON [table]
  FOR UPDATE
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "tenant_delete" ON [table]
  FOR DELETE USING (organization_id = get_user_org_id());

-- Index critique pour les performances RLS
CREATE INDEX idx_[table]_org_id ON [table](organization_id);
```

**Pourquoi SECURITY DEFINER :** la subquery `SELECT organization_id FROM profiles WHERE id = auth.uid()` est exécutée une seule fois par requête, pas par row. Gain de performance énorme sur les tables avec beaucoup de lignes.

**Rôles utilisateur :** owner, admin, member, viewer (stockés dans `profiles.role`).

**Pattern RBAC (pour les modules nécessitant des permissions granulaires) :**
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Exemple : seuls admin et owner peuvent supprimer
CREATE POLICY "admin_delete" ON products
  FOR DELETE USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );
```

---

## Structure du projet

```
src/
├── app/
│   ├── (auth)/                  # Login, register, reset-password
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Layout authentifié avec sidebar
│   │   └── [orgSlug]/           # Segment dynamique par organisation
│   │       ├── dashboard/       # Vue d'ensemble, KPI
│   │       ├── produits/        # Fiches produits, compositions, allergènes
│   │       ├── tracabilite/     # Lots, réceptions, expéditions, rappels
│   │       ├── haccp/           # Plan HACCP, CCP, relevés, actions correctives
│   │       ├── etiquetage/      # Générateur d'étiquettes INCO conformes
│   │       ├── fournisseurs/    # Fiches fournisseurs, agréments, évaluations
│   │       ├── production/      # OF, suivi temps réel, TRS, rendement
│   │       ├── non-conformites/ # Déclaration, suivi, actions correctives
│   │       ├── audits/          # Checklists, planification, rapports
│   │       └── settings/        # Organisation, utilisateurs, plan, billing
│   ├── api/
│   │   ├── ai/                  # Route handler streaming IA (SSE)
│   │   ├── cron/                # Jobs planifiés (1/jour max sur Vercel gratuit)
│   │   └── webhooks/            # Stripe (futur)
│   └── (marketing)/             # Landing page publique
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # createBrowserClient (navigateur)
│   │   ├── server.ts            # createServerClient (cookies, SSR)
│   │   ├── admin.ts             # service_role (scripts admin uniquement, JAMAIS côté client)
│   │   └── middleware.ts        # Refresh session automatique
│   ├── permissions.ts           # checkAccess(module, plan, role) — vérification serveur
│   ├── ai/
│   │   ├── client.ts            # Appel Anthropic (serveur uniquement)
│   │   ├── prompts/             # System prompts par module
│   │   ├── sanitize.ts          # Nettoyage input utilisateur
│   │   └── rate-limit.ts        # 20 req/user/heure max
│   └── validation/              # Schémas Zod partagés
├── modules/                     # Logique métier réutilisable par module
├── components/
│   ├── ui/                      # shadcn/ui (ne pas modifier les fichiers générés)
│   ├── ai/                      # Chat IA, bouton aide contextuelle
│   └── shared/                  # Layout, sidebar, header, breadcrumbs
├── hooks/                       # Hooks React custom
└── types/
    └── database.ts              # Types auto-générés par Supabase CLI
```

---

## Conventions de code

### Nommage
- **Fichiers/dossiers :** kebab-case (`product-form.tsx`, `use-products.ts`)
- **Composants React :** PascalCase (`ProductForm`, `HaccpChecklist`)
- **Variables/fonctions :** camelCase (`getProducts`, `organizationId`)
- **Tables SQL :** snake_case pluriel (`products`, `haccp_controls`, `audit_logs`)
- **Colonnes SQL :** snake_case (`created_at`, `organization_id`, `deleted_at`)
- **Code :** anglais. **UI (labels, messages, erreurs) :** français
- **Constantes UI :** dans des objets dédiés (prépare i18n future)

### TypeScript
- `strict: true`, pas de `any`, pas de `as` sauf cast nécessaire documenté
- Pas de `console.log` en production (utiliser Sentry)
- Données numériques sensibles en entiers : prix en centimes, poids en grammes
- Toujours typer les retours Supabase : `supabase.from('products').select('*').returns<Product[]>()`

### Next.js 15 App Router — règles mentales
- **Server Components par défaut.** Tout composant dans `app/` est un RSC sauf mention contraire.
- `"use client"` uniquement pour : événements utilisateur (onClick, onChange), hooks React (useState, useEffect...), APIs navigateur (localStorage, navigator)
- **Les données vivent avec le composant qui en a besoin.** Pas de prop drilling depuis un niveau supérieur.
- **Pattern arbre :** la page (Server Component) fetch les données et les passe en props aux composants client qui en ont besoin. Le client est toujours une feuille, jamais la racine.
- `params` et `searchParams` sont des Promises dans Next.js 15 : toujours `const { slug } = await params`
- Chaque formulaire gère 4 états : loading, erreur, succès, vide
- Validation Zod AVANT toute opération DB
- Utiliser `loading.tsx` et `error.tsx` dans chaque route pour le streaming et la résilience

### Pattern de page standard
```tsx
// src/app/(dashboard)/[orgSlug]/produits/page.tsx
// Server Component par défaut — pas de "use client"
import { createServerClient } from '@/lib/supabase/server'
import { ProductList } from './components/product-list'

export default async function ProduitsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  // Next.js 15 : params est une Promise
  const { orgSlug } = await params
  const supabase = await createServerClient()

  // Fetch directement dans le composant serveur — pas d'API route nécessaire
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .is('deleted_at', null) // Soft delete : ne montrer que les actifs
    .order('created_at', { ascending: false })

  if (error) throw error // error.tsx prend le relais

  // Passe les données au composant client (feuille)
  return <ProductList products={products ?? []} orgSlug={orgSlug} />
}
```

### Pattern de Server Action
```tsx
// src/app/(dashboard)/[orgSlug]/produits/actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { productSchema } from '@/lib/validation/product'
import { revalidatePath } from 'next/cache'

export async function createProduct(orgSlug: string, formData: FormData) {
  const supabase = await createServerClient()

  // 1. Valider avec Zod AVANT toute opération DB
  const parsed = productSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Données invalides', details: parsed.error.flatten() }
  }

  // 2. Récupérer l'organization_id depuis la session (JAMAIS du client)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable' }

  // 3. Insérer (RLS vérifie automatiquement le tenant)
  const { error } = await supabase
    .from('products')
    .insert({
      ...parsed.data,
      organization_id: profile.organization_id,
    })

  if (error) return { error: 'Erreur lors de la création' }

  // 4. Revalider le cache pour que la page reflète le changement
  revalidatePath(`/${orgSlug}/produits`)
  return { success: true }
}
```

### Pattern streaming IA (SSE, compatible Vercel serverless)
```tsx
// src/app/api/ai/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ai/rate-limit'
import { sanitizeInput } from '@/lib/ai/sanitize'
import { getSystemPrompt } from '@/lib/ai/prompts'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non autorisé', { status: 401 })

  // Rate limit : 20 req/user/heure
  const allowed = await checkRateLimit(user.id)
  if (!allowed) return new Response('Limite atteinte, réessayez dans quelques minutes.', { status: 429 })

  const { message, module } = await req.json()
  const cleanMessage = sanitizeInput(message)

  const anthropic = new Anthropic()
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    temperature: 0.3,
    system: getSystemPrompt(module),
    // Le system prompt inclut toujours :
    // - Spécialisation agroalimentaire
    // - Langue française
    // - Interdiction de donner un conseil juridique ou médical définitif
    // - Disclaimer "consultez un professionnel pour validation"
    messages: [{ role: 'user', content: cleanMessage }],
  })

  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
```

---

## Anti-patterns (NE PAS FAIRE)

| Interdit | Pourquoi | Faire plutôt |
|---|---|---|
| `organization_id` depuis le client (body, params, headers) | Faille de sécurité tenant, un utilisateur peut accéder aux données d'un autre | Récupérer depuis `profiles` via `auth.uid()` côté serveur |
| `any` dans le code TypeScript | Perd le typage, bugs silencieux, régressions invisibles | Typer explicitement ou utiliser `unknown` + narrowing |
| Modifier une migration existante | Casse les environnements déjà migrés (staging, prod, autres devs) | Créer une nouvelle migration corrective |
| `"use client"` sur une page entière | Perd les avantages SSR (performance, SEO, pas de JS inutile au client) | Extraire seulement la partie interactive en composant client feuille |
| `console.log` en prod | Fuite d'infos potentielle, bruit dans les logs | Sentry pour les erreurs, supprimer les logs de debug |
| Float pour prix/poids | Erreurs d'arrondi IEEE 754 (0.1 + 0.2 !== 0.3) | Entiers : centimes pour les prix, grammes pour les poids |
| Policy RLS `FOR ALL` | Trop permissif, impossible à auditer, comportement ambigu | Une policy par opération CRUD |
| Exposer `service_role` key côté client | N'importe qui peut bypass toute la RLS | Env var serveur `SUPABASE_SERVICE_ROLE_KEY`, uniquement dans `lib/supabase/admin.ts` |
| Exposer la clé API Anthropic côté client | Exposition de la clé, consommation frauduleuse | Env var serveur `ANTHROPIC_API_KEY`, appels serveur uniquement |
| Soft delete sans index sur `deleted_at` | Requêtes lentes, full scan sur toutes les tables filtrées | Index partiel : `CREATE INDEX idx_[table]_active ON [table](id) WHERE deleted_at IS NULL` |
| Subquery dans policy RLS sans SECURITY DEFINER | Exécutée par row, O(n) sur la table profiles à chaque requête | Helper function `get_user_org_id()` en SECURITY DEFINER |
| Oublier `await` sur `params` en Next.js 15 | Bug silencieux, params est une Promise depuis Next.js 15 | Toujours `const { slug } = await params` |
| Fetch séquentiel de données indépendantes | Lenteur, chaque fetch attend le précédent | `Promise.all([fetchA(), fetchB()])` pour paralléliser |
| `<img>` au lieu de `next/image` | Pas d'optimisation (resize, lazy load, format WebP) | Toujours `import Image from 'next/image'` |
| Oublier `not-found.tsx` | L'utilisateur voit une erreur Next.js brute | Créer un `not-found.tsx` avec message et lien retour |
| Pas de toast après une action | L'utilisateur ne sait pas si ça a marché | `toast.success()` / `toast.error()` avec sonner |
| Desktop-first dans le CSS | L'app est inutilisable en atelier sur tablette/mobile | Mobile-first : `p-4 md:p-6 lg:p-8` |
| Fichiers uploadés sans préfixe `organization_id/` | Un tenant peut accéder aux fichiers d'un autre | Toujours `organization_id/entity_id/filename` |

---

## Supabase

### Commandes essentielles
```bash
npx supabase start                              # Lancer Supabase local (Docker)
npx supabase db diff -f [nom_migration]          # Générer une migration depuis les changements
npx supabase db push                             # Appliquer les migrations
npx supabase gen types typescript --local > src/types/database.ts  # Régénérer les types
npx supabase db reset                            # Reset complet local (dev uniquement)
```

### Workflow après chaque changement de schéma
1. Faire les modifications dans Supabase Studio (local)
2. `npx supabase db diff -f descriptif-du-changement` pour générer la migration
3. Vérifier la migration dans `supabase/migrations/` (relire le SQL !)
4. `npx supabase gen types typescript --local > src/types/database.ts`
5. `npm run build` pour vérifier que le code compile avec les nouveaux types
6. Committer migration + types ensemble

### Tables système clés
- `profiles` : liée à `auth.users` via trigger `on_auth_user_created`, contient `organization_id`, `role`, `full_name`
- `organizations` : données du tenant (name, slug, plan, created_at)
- `audit_logs` : who (user_id), what (action, table_name, record_id, changes), when (created_at), organization_id
- `plans` : définition des plans (free, standard, premium) et leurs features

### Bonnes pratiques Supabase
- Toujours ajouter `created_at`, `updated_at`, `deleted_at` à chaque table métier
- Trigger pour `updated_at` automatique : `CREATE TRIGGER set_updated_at BEFORE UPDATE ON [table] FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);`
- Ne jamais committer les credentials prod dans le code
- Environnements séparés : local (Docker) pour le dev, un projet Supabase staging, un prod
- Migrations dans git, appliquées d'abord en staging, testées, puis promues en prod

---

## Modules et plans

```
FREE     : dashboard, produits, calculateur-nutritionnel
STANDARD : + tracabilite, haccp, etiquetage, fournisseurs, ia-basique
PREMIUM  : + production, non-conformites, audits, ia-avancee, exports, api
```

La vérification d'accès se fait via `checkAccess(module, plan, role)` dans `lib/permissions.ts`. Toujours vérifier côté serveur. L'UI masque les modules inaccessibles mais ne sécurise rien.

### Détail fonctionnel par module

**Produits (FREE) :** Fiches produits avec composition, allergènes (14 ADO), valeurs nutritionnelles, photos. Le calculateur nutritionnel calcule automatiquement les valeurs à partir de la composition.

**Traçabilité (STANDARD) :** Réception des matières (fournisseur, lot, DLC, contrôle à réception), suivi des lots en production (lot interne lié aux lots fournisseurs), expéditions (client, lot, quantité). Capacité de remontée instantanée en cas d'alerte rappel.

**HACCP (STANDARD) :** Plan HACCP digital par produit/process. Définition des CCP et limites critiques. Enregistrements de surveillance horodatés (températures, contrôles visuels). Alertes automatiques si dépassement. Actions correctives tracées.

**Étiquetage (STANDARD) :** Générateur d'étiquettes conformes INCO. Liste des ingrédients avec allergènes mis en évidence automatiquement. Déclaration nutritionnelle. DLC/DDM. Calcul automatique à partir de la fiche produit.

**Production (PREMIUM) :** OF, suivi temps réel par ligne, TRS calculé automatiquement (Disponibilité x Performance x Qualité), MTBF/MTTR, rendement matière, taux de perte, arrêts catégorisés (panne, nettoyage, changement format, attente matière), tableau de bord par équipe/poste/ligne avec tendances 30/90 jours. Granularité : poste (8h), jour, semaine, mois. Graphiques Recharts. Benchmarks intégrés.

**Non-conformités (PREMIUM) :** Déclaration NC (interne, fournisseur, client), analyse des causes, actions correctives, suivi des deadlines, indicateurs (taux de NC, délai de traitement).

**Audits (PREMIUM) :** Checklists personnalisables (par type d'audit : interne, client, certification), planification, scoring, rapport PDF auto-généré, suivi des écarts et plans d'action.

---

## IA embarquée

- **Modèle :** Claude Sonnet, appels serveur uniquement via Route Handler
- **Clé API :** `ANTHROPIC_API_KEY` (env var serveur, jamais côté client)
- **System prompts :** un par module dans `src/lib/ai/prompts/[module].ts`
- **Règles des prompts :**
  - Spécialisation agroalimentaire (connaître HACCP, INCO, traçabilité)
  - Langue française obligatoire
  - Interdiction de donner un conseil juridique ou médical définitif
  - Toujours ajouter : "consultez un professionnel qualifié pour validation"
  - Contexte tenant : ne pas mélanger les données entre organisations
- **Sécurité :** sanitize input (XSS, injection), rate limit 20 req/user/heure, max 1500 tokens, température 0.3
- **Streaming :** SSE (Server-Sent Events), compatible Vercel serverless (timeout 10s)
- **Fallback :** message d'indisponibilité si l'API est down

### Exemples d'utilisation IA par module
- **Produits :** "Génère la liste des allergènes pour cette composition"
- **HACCP :** "Quels sont les CCP pour un process de fabrication de pâté ?"
- **Étiquetage :** "Vérifie si cette étiquette est conforme INCO"
- **Non-conformités :** "Aide-moi à analyser la cause racine de cette NC"
- **Production :** "Explique pourquoi mon TRS est bas cette semaine"

---

## Miro — Intégration et gestion de projet

### Boards Miro du projet AgroPilot.IA
| Board | Contenu | Usage |
|---|---|---|
| Roadmap | Vision modules Now / Next / Later / Trash | Priorisation stratégique, communication |
| Kanban Dev | À faire / En cours (max 2) / Fait | Suivi quotidien du développement |
| Architecture | Schéma DB, flux utilisateurs, architecture système | Référence technique, onboarding |
| Wireframes | Maquettes des écrans par module | Validation avant codage |
| User Flows | Parcours utilisateur par persona | Comprendre le besoin avant de coder |
| Retrospectives | Ce qui marche / bloque / à changer | Amélioration continue hebdo |

### MCP Miro + Claude Code
Le serveur MCP Miro permet à Claude Code de lire et interagir avec les boards Miro.

**Configuration :**
```json
{
  "mcpServers": {
    "miro": {
      "url": "https://mcp.miro.com/sse"
    }
  }
}
```
Lancer `/mcp auth` dans Claude Code pour le flow OAuth.

**Usages :**
- Lire un wireframe Miro et générer le code React correspondant
- Créer un diagramme d'architecture sur un board
- Résumer le contenu d'un board pour un point de situation
- Lire la roadmap et identifier les prochaines tâches
- Créer des user stories sous forme de sticky notes
- Résoudre des commentaires et transformer la discussion en actions

**API REST Miro (si besoin d'intégration custom dans AgroPilot.IA) :**
- Base URL : `https://api.miro.com/v2/`
- Auth : OAuth 2.0 ou Personal Access Token
- Endpoints clés : boards, items (sticky notes, shapes, connectors), frames
- Rate limits : vérifier la doc développeur Miro
- La v2 REST API supporte : sticky notes, shapes, connectors (lignes), frames, images, text, cards
- Possibilité future : intégrer un board Miro dans le dashboard AgroPilot.IA pour visualiser la roadmap produit

---

## Déploiement — Vercel

### Architecture des environnements
```
main (GitHub) ──push/merge──→ Production (agropilot-ia.vercel.app)
                                 ↑ domaine custom quand prêt
dev (GitHub)  ──push──→ Preview (agropilot-ia-git-dev-xxx.vercel.app)
feat/* (GitHub) ──PR──→ Preview (URL unique par PR, commentaire auto sur GitHub)
```

Chaque push sur une branche non-production génère automatiquement un déploiement preview avec sa propre URL. Vercel commente la PR GitHub avec le lien preview. Les reviewers peuvent tester l'app en live avant le merge.

### Limites du plan gratuit Vercel
- Serverless function timeout : 10s (streaming IA compatible via SSE)
- Pas de WebSocket, utiliser Server-Sent Events
- Cron : max 1 exécution/jour via `/api/cron/`
- 100 GB bandwidth/mois, 100k function invocations
- Pas de team collaboration (passer Pro avant prod commerciale)

### Variables d'environnement

**Règles critiques :**
- Variables serveur (sans préfixe) : `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`
- Variables client (préfixe `NEXT_PUBLIC_`) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ne JAMAIS mettre de clé sensible avec le préfixe `NEXT_PUBLIC_` (elle serait exposée au navigateur)
- Vercel sépare les env vars en 3 scopes : Production, Preview, Development
- Les variables marquées "Sensitive" sont chiffrées et invisibles après sauvegarde
- **Après ajout d'une variable, il faut redéployer** (Vercel ne les injecte pas à chaud)

**Variables d'environnement AgroPilot.IA :**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co          # Client OK
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                       # Client OK (RLS protège)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                           # SERVEUR UNIQUEMENT

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...                               # SERVEUR UNIQUEMENT

# Resend
RESEND_API_KEY=re_...                                      # SERVEUR UNIQUEMENT

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx           # Client OK
SENTRY_AUTH_TOKEN=sntrys_...                                # Build uniquement

# App
NEXT_PUBLIC_APP_URL=https://agropilot-ia.fr                   # Client OK
```

**Workflow env vars :**
```bash
vercel env pull .env.local      # Récupérer les env vars Vercel en local
vercel env add KEY production   # Ajouter une variable en production
vercel env ls                   # Lister toutes les variables
```

### Vercel CLI — commandes essentielles
```bash
vercel                          # Déployer en preview
vercel --prod                   # Déployer en production
vercel deploy --target=staging  # Déployer vers un environnement custom
vercel logs                     # Voir les logs du dernier déploiement
vercel logs --environment production --level error --since 5m  # Logs d'erreur prod
vercel inspect <url>            # Inspecter un déploiement
vercel promote <url>            # Promouvoir un preview en production
vercel rollback <url>           # Rollback vers un déploiement précédent
vercel env pull .env.local      # Sync les env vars en local
```

### Checklist avant déploiement production
1. `npm run build && npm run lint` passent sans erreur
2. Toutes les env vars sont configurées dans Vercel Dashboard (scope Production)
3. Les migrations Supabase sont appliquées sur la base de prod
4. Les types sont régénérés et à jour
5. Le preview deployment fonctionne correctement
6. Merge la PR dans `main`, Vercel déploie automatiquement

---

## GitHub

### Configuration du repository

**Branches :**
- `main` = production (merge par PR uniquement, jamais de push direct)
- `dev` = intégration (optionnel pour le solo dev, utile quand l'équipe grandit)
- `feat/[module]-[desc]` = nouvelles fonctionnalités (ex: `feat/haccp-checklist`)
- `fix/[desc]` = corrections de bugs (ex: `fix/rls-products-policy`)
- `refactor/[desc]` = refactoring sans changement fonctionnel

**Branch protection rules (à configurer sur GitHub) :**
- `main` : require PR, require status checks (build + lint), no force push
- Quand l'équipe grandit : require review approval

**Commits conventionnels :**
```
feat: ajout du formulaire de création produit
fix: correction de la policy RLS sur products
refactor: extraction du composant ProductForm en client component
docs: mise à jour du CLAUDE.md avec les env vars Vercel
test: ajout des tests pour createProduct action
chore: mise à jour des dépendances shadcn/ui
```

### Intégration GitHub + Vercel
L'intégration Vercel for GitHub est installée sur le repo. Comportement automatique :
- Push sur `main` → déploiement Production
- Push sur toute autre branche → déploiement Preview
- PR ouverte → Vercel commente avec l'URL preview
- PR mergée dans `main` → déploiement Production
- Revert d'un commit sur `main` → rollback automatique instantané
- Build annulé si un nouveau push arrive sur la même branche (seul le dernier commit compte)

### GitHub Actions CI/CD
```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  check:
    name: Lint, type-check and build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npx tsc --noEmit
      - name: Lint
        run: npm run lint
      - name: Build
        run: npm run build
```

Ce workflow vérifie que le code compile et passe le lint à chaque PR et push sur main. Vercel gère le déploiement, GitHub Actions gère la qualité du code.

### `.gitignore` essentiel
```
node_modules/
.next/
.env
.env.local
.env.*.local
.vercel/
*.tsbuildinfo
```

### Workflow quotidien
```
1. git checkout -b feat/haccp-checklist     # Nouvelle branche
2. [coder, tester localement]
3. git add . && git commit -m "feat: ..."   # Commit conventionnel
4. git push origin feat/haccp-checklist      # Push → preview Vercel auto
5. [Vérifier le preview deployment]
6. Ouvrir une PR vers main sur GitHub
7. [CI passe : lint + type-check + build]
8. Merge la PR → production Vercel auto
9. git checkout main && git pull             # Sync local
10. [Mettre à jour le Kanban Miro]
```

---

## Commandes dev

```bash
# Next.js
npm run dev                     # Serveur local (http://localhost:3000)
npm run build                   # Build production (vérifier avant PR)
npm run lint                    # ESLint
npx tsc --noEmit                # Type-check sans build

# Supabase
npx supabase start              # Lancer Supabase local (Docker)
npx supabase db diff -f [nom]   # Générer une migration
npx supabase db push            # Appliquer les migrations
npx supabase db reset           # Reset complet local
npx supabase gen types typescript --local > src/types/database.ts

# Vercel
vercel                          # Deploy preview
vercel --prod                   # Deploy production
vercel env pull .env.local      # Sync env vars
vercel logs                     # Voir les logs

# Git
git checkout -b feat/[module]-[desc]  # Nouvelle feature
git add . && git commit -m "feat: [desc]"
git push origin feat/[module]-[desc]
```

---

## Middleware Next.js

Le middleware gère la protection des routes et le refresh de session Supabase. Il s'exécute à chaque requête AVANT le rendu de la page.

```tsx
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh la session (IMPORTANT : ne pas retirer cet appel)
  const { data: { user } } = await supabase.auth.getUser()

  // Routes publiques : ne pas rediriger
  const publicPaths = ['/', '/login', '/register', '/reset-password']
  const isPublic = publicPaths.some(p => request.nextUrl.pathname === p)
    || request.nextUrl.pathname.startsWith('/api/webhooks')

  // Rediriger vers /login si pas authentifié sur une route protégée
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Exclure les fichiers statiques et les assets Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Supabase Storage (images et documents)

Les produits, audits et documents ont besoin de fichiers uploadés (photos produits, rapports d'audit, certificats fournisseurs).

**Buckets à créer :**
- `product-images` : photos produits (public, optimisées)
- `documents` : certificats, rapports, PMS (privé, RLS)
- `avatars` : photos de profil (public)

**Pattern upload :**
```tsx
// Côté client (composant "use client")
const handleUpload = async (file: File) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${organizationId}/${productId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)

  return publicUrl
}
```

**RLS sur les buckets privés :**
```sql
-- Policy pour le bucket 'documents' (privé)
CREATE POLICY "tenant_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM profiles WHERE id = auth.uid()
    )
  );
```

**Règle de nommage des fichiers :** toujours préfixer par `organization_id/` pour l'isolation tenant dans le storage.

---

## Emails transactionnels (Resend)

**Emails à envoyer :**
- Bienvenue après inscription
- Invitation d'un membre dans l'organisation
- Réinitialisation de mot de passe (géré par Supabase Auth)
- Alerte CCP dépassé (HACCP)
- Rappel d'audit planifié
- Résumé hebdomadaire des NC ouvertes (futur, via Vercel Cron)

**Pattern Server Action :**
```tsx
// src/lib/email/send.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, orgName: string) {
  const { error } = await resend.emails.send({
    from: 'AgroPilot.IA <noreply@agropilot-ia.fr>',
    to,
    subject: `Bienvenue sur AgroPilot.IA, ${orgName}`,
    html: `<p>Votre espace est prêt. Connectez-vous pour commencer.</p>`,
  })
  if (error) throw error
}
```

---

## SEO et Metadata

**Pattern `generateMetadata` pour les pages marketing :**
```tsx
// src/app/(marketing)/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AgroPilot.IA — Gestion qualité et production pour PME agroalimentaires',
  description: 'Simplifiez votre conformité HACCP, traçabilité et étiquetage INCO. SaaS pensé pour les PME agroalimentaires.',
  openGraph: {
    title: 'AgroPilot.IA',
    description: 'Gestion qualité et production pour PME agroalimentaires',
    url: 'https://agropilot-ia.fr',
    siteName: 'AgroPilot.IA',
    locale: 'fr_FR',
    type: 'website',
  },
}
```

**Pattern pour les pages dynamiques (dashboard) :**
```tsx
// src/app/(dashboard)/[orgSlug]/produits/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', id)
    .single()

  return {
    title: `${product?.name ?? 'Produit'} — AgroPilot.IA`,
  }
}
```

**Pages spéciales à créer dans chaque route :**
- `loading.tsx` : skeleton UI pendant le chargement
- `error.tsx` : page d'erreur avec bouton "Réessayer" (`"use client"` obligatoire)
- `not-found.tsx` : page 404 personnalisée

---

## Images et optimisation

**Utiliser `next/image` systématiquement :**
```tsx
import Image from 'next/image'

// Pour les images produits (uploadées dans Supabase Storage)
<Image
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={300}
  className="rounded-lg object-cover"
/>

// Pour les images statiques (logo, illustrations)
<Image
  src="/logo.svg"
  alt="AgroPilot.IA"
  width={180}
  height={40}
  priority  // Pour les images above-the-fold
/>
```

**Configurer les domaines distants dans `next.config.ts` :**
```ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

---

## UI / UX

### Toasts et notifications
Utiliser le composant `sonner` (intégré avec shadcn/ui) pour les retours utilisateur :
```tsx
import { toast } from 'sonner'

// Après une Server Action
const result = await createProduct(orgSlug, formData)
if (result.error) {
  toast.error(result.error)
} else {
  toast.success('Produit créé avec succès')
}
```

### Responsive / mobile
Les utilisateurs terrain (chefs de prod, techniciens qualité) utilisent souvent une tablette ou un téléphone en atelier. L'interface DOIT être utilisable sur mobile :
- Sidebar collapsible sur mobile (hamburger menu)
- Formulaires empilés verticalement sur petit écran
- Boutons d'action suffisamment grands pour le tactile (min 44x44px)
- Tableaux de données : utiliser des cartes empilées sur mobile plutôt que des tableaux horizontaux
- Tailwind : toujours coder mobile-first (`p-4 md:p-6 lg:p-8`)

### Accessibilité (a11y)
- Labels sur tous les champs de formulaire (`<Label htmlFor="...">`)
- Focus visible au clavier (Tailwind `focus-visible:ring-2`)
- Contraste suffisant (WCAG AA minimum, ratio 4.5:1 pour le texte)
- Attributs `aria-label` sur les boutons icônes
- Messages d'erreur liés aux champs via `aria-describedby`
- Pas de contenu accessible uniquement au survol (tooltip) sans alternative

---

## Tests

### Stratégie
Pour un solo dev, prioriser les tests qui protègent le plus :
1. **Type-check TypeScript** (`tsc --noEmit`) — gratuit, attrape beaucoup de bugs
2. **Tests des Server Actions** (Jest) — la logique métier critique
3. **Tests e2e des parcours critiques** (Playwright) — inscription, création produit, HACCP
4. Les tests de composants UI sont secondaires pour l'instant

### Configuration Jest
```bash
npm install -D jest @jest/globals ts-jest @testing-library/react @testing-library/jest-dom
```

```ts
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
}
export default config
```

### Pattern de test Server Action
```ts
// src/app/(dashboard)/[orgSlug]/produits/__tests__/actions.test.ts
import { createProduct } from '../actions'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: jest.fn(() => ({ data: { user: { id: 'user-1' } } })) },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => ({ data: { organization_id: 'org-1' } })),
      insert: jest.fn(() => ({ error: null })),
    })),
  })),
}))

describe('createProduct', () => {
  it('refuse les données invalides', async () => {
    const formData = new FormData()
    // Pas de nom → invalide
    const result = await createProduct('test-org', formData)
    expect(result.error).toBe('Données invalides')
  })
})
```

### Script package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  }
}
```

### Mise à jour du CI GitHub Actions
```yaml
# Ajouter dans .github/workflows/ci.yml, job check
      - name: Type check
        run: npx tsc --noEmit
      - name: Tests
        run: npm test -- --passWithNoTests
```

---

## Monitoring (Sentry)

**Setup :**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Ce qu'il faut tracer :**
- Erreurs serveur (Server Actions, Route Handlers)
- Erreurs client (composants React)
- Performances (temps de chargement des pages, durée des Server Actions)
- Erreurs Supabase (requêtes échouées)
- Erreurs API Anthropic (timeout, rate limit)

**Pattern dans les Server Actions :**
```tsx
import * as Sentry from '@sentry/nextjs'

export async function createProduct(orgSlug: string, formData: FormData) {
  try {
    // ... logique métier
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'produits', action: 'create' },
      extra: { orgSlug },
    })
    return { error: 'Une erreur inattendue est survenue' }
  }
}
```

**Ne PAS logger dans Sentry :** les données personnelles (noms, emails, contenus des messages IA).

---

## Sécurité et RGPD

- Auth Supabase : bcrypt, JWT, refresh tokens automatiques via `@supabase/ssr`
- RLS = isolation stricte des données par tenant
- `audit_logs` : traçabilité complète (who, what, when, organization_id)
- Endpoint suppression données RGPD prévu (droit à l'effacement art. 17)
- Consentement cookies avant tout tracking
- Réponses IA non stockées avec données personnelles identifiables
- Clés API dans env vars exclusivement (jamais dans le code, jamais côté client)
- Soft delete par défaut (`deleted_at` timestamp nullable), les données ne sont pas effacées définitivement sans action explicite

---

## État du projet

<!-- METTRE À JOUR CETTE SECTION RÉGULIÈREMENT -->
<!-- Synchroniser avec le board Kanban Miro -->

| Module | Statut | Priorité |
|---|---|---|
| Auth + onboarding | ? | Critique |
| Dashboard | ? | Haute |
| Produits + calculateur nutritionnel | ? | Haute |
| Traçabilité | ? | Moyenne |
| HACCP | ? | Moyenne |
| Étiquetage INCO | ? | Moyenne |
| IA embarquée | ? | Haute |
| Landing page | ? | Moyenne |
| Fournisseurs | ? | Basse |
| Production (TRS, OF) | ? | Basse |
| Non-conformités | ? | Basse |
| Audits | ? | Basse |
| Billing (Stripe) | ? | Basse (plus tard) |

**Légende :** Pas commencé | En cours | MVP OK | Terminé

---

## Checklist avant de coder un nouveau module

1. **Définir le problème utilisateur** en 1 phrase (ex: "Les responsables qualité passent 2h/jour à remplir des fiches HACCP papier")
2. **Lister Must / Should / Could** sur le board Miro du module
3. **Wireframe sur Miro** des écrans principaux (liste, formulaire, détail) en mobile-first
4. **Créer les tables SQL** avec `organization_id`, `created_at`, `updated_at`, `deleted_at`
5. **Ajouter les policies RLS** (SELECT, INSERT, UPDATE, DELETE) avec `get_user_org_id()`
6. **Ajouter les index** sur `organization_id` et `deleted_at`
7. **Créer le bucket Storage** si le module a des fichiers (images, documents)
8. **Régénérer les types** : `npx supabase gen types typescript --local > src/types/database.ts`
9. **Créer le schéma Zod** de validation dans `lib/validation/[module].ts`
10. **Créer la page** Server Component dans `app/(dashboard)/[orgSlug]/[module]/`
11. **Ajouter `generateMetadata`** pour le titre de la page
12. **Créer les Server Actions** dans `actions.ts` avec try/catch et Sentry
13. **Extraire les composants interactifs** en `"use client"` seulement si nécessaire (feuilles)
14. **Ajouter les toasts** (sonner) pour les retours utilisateur sur les actions
15. **Ajouter le module** dans `checkAccess` avec le plan requis
16. **Ajouter `loading.tsx`, `error.tsx` et `not-found.tsx`** dans le dossier de la route
17. **Vérifier le responsive** : tester sur mobile (Chrome DevTools, 375px)
18. **Vérifier l'accessibilité** : labels, focus, contraste, aria
19. **Écrire les tests** des Server Actions critiques (Jest)
20. **Tester** : CRUD complet, isolation tenant (2 orgs ne voient pas les données de l'autre), permissions par rôle
21. **Mettre à jour** le board Kanban Miro et l'état du projet dans ce fichier
