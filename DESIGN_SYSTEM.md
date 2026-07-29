# AgroPilot.IA — Design System

> Ce fichier definit l'identite visuelle d'AgroPilot.IA.
> Claude Code doit le lire avant de creer tout composant UI.

---

## Palette de couleurs

### Vert AgroPilot (couleur primaire)

| Token              | Hex       | Usage                                    |
|--------------------|-----------|------------------------------------------|
| `--ap-green-900`   | `#1a3a2a` | Sidebar bg, boutons principaux, textes forts |
| `--ap-green-800`   | `#234d38` | Hover boutons, textes sur fond clair     |
| `--ap-green-700`   | `#2d6148` | Bordures actives, focus                  |
| `--ap-green-600`   | `#3a7d5c` | Textes secondaires sur fond vert, icones |
| `--ap-green-500`   | `#4a9a72` | Icone logo, accent moyen                 |
| `--ap-green-400`   | `#6db88f` | Texte sidebar inactif                    |
| `--ap-green-300`   | `#95d1ae` | Texte sidebar items, bordures legeres    |
| `--ap-green-200`   | `#c2e5cf` | Bordures boutons secondaires             |
| `--ap-green-100`   | `#e0f2e7` | Fond badge "excellent", fond KPI vert    |
| `--ap-green-50`    | `#f0f9f3` | Fond bouton secondaire, hover leger      |

### Creme (couleur de fond)

| Token              | Hex       | Usage                                    |
|--------------------|-----------|------------------------------------------|
| `--ap-cream-900`   | `#3d3728` | Textes forts sur fond creme              |
| `--ap-cream-800`   | `#5c5340` | Textes secondaires                       |
| `--ap-cream-700`   | `#7a6f58` | Labels de colonnes, textes tertiaires    |
| `--ap-cream-600`   | `#998b70` | Placeholders                             |
| `--ap-cream-300`   | `#e3dac8` | Bordures de tableaux                     |
| `--ap-cream-200`   | `#f0ebe0` | Bordures legeres, separateurs            |
| `--ap-cream-100`   | `#f7f4ed` | Fond de page alternatif                  |
| `--ap-cream-50`    | `#fdfcf9` | Fond principal de la zone de contenu     |

### Couleurs semantiques (statuts)

| Statut     | Fond      | Texte     | Usage                         |
|------------|-----------|-----------|-------------------------------|
| Excellent  | `#e0f2e7` | `#234d38` | Km < 0.05, statut OK          |
| Bon        | `#95d1ae` | `#1a3a2a` | Km 0.05-0.15, en bonne voie   |
| Alerte     | `#faeeda` | `#854f0b` | Km 0.15-0.30, DLC proche      |
| Critique   | `#fcebeb` | `#a32d2d` | Km > 0.30, action urgente     |
| Info       | `#e6f1fb` | `#0c447c` | Information neutre             |

---

## Tailwind CSS

Les couleurs `ap-green` et `ap-cream` sont definies via CSS custom properties
dans `globals.css` et referenciees dans le theme Tailwind v4.

---

## Composants

### Sidebar

- Fond: bg-ap-green-900 (#1a3a2a)
- Logo/titre: text-ap-green-100, font-weight 500
- Item actif: bg-white/10, text-ap-green-100
- Item inactif: text-ap-green-300 (#95d1ae)
- Item hover: bg-white/5
- Separateurs: border-white/12
- Icones: Lucide React, 18px
- Largeur: 240px (desktop), collapse en mobile

### Zone de contenu

- Fond: bg-ap-cream-50 (#fdfcf9)
- Texte fort: text-ap-green-900 (#1a3a2a)
- Texte moyen: text-ap-cream-800 (#5c5340)
- Texte leger: text-ap-cream-700 (#7a6f58)

### Cartes

- Fond: bg-ap-cream-50 ou bg-white
- Bordure: border border-ap-cream-200
- Radius: rounded-xl (12px)
- Padding: p-5

### Cartes KPI

- Fond vert: bg-ap-green-100
- Fond ambre: bg-amber-50
- Fond rouge: bg-red-50
- Label: text-xs
- Valeur: text-2xl font-medium
- Pas de bordure, radius rounded-lg, p-4

### Boutons

- Principal: bg-ap-green-900 text-ap-green-100, hover:bg-ap-green-800
- Secondaire: bg-ap-green-50 text-ap-green-900, border border-ap-green-200, hover:bg-ap-green-100
- Outline: bg-transparent text-ap-green-600, border border-ap-green-200, hover:bg-ap-green-50
- Danger: bg-red-50 text-red-700, hover:bg-red-100
- Tous: rounded-lg px-4 py-2 font-medium text-sm transition-colors

### Badges de statut

- Excellent: bg-ap-green-100 text-ap-green-800
- Bon: bg-ap-green-300 text-ap-green-900
- Alerte: bg-amber-50 text-amber-800
- Critique: bg-red-50 text-red-800
- Tous: px-2.5 py-0.5 rounded-full text-xs font-medium

### Tableaux

- Header: text-ap-cream-700 font-normal text-sm, border-b border-ap-cream-300
- Lignes: border-b border-ap-cream-200
- Texte fort: text-ap-green-900 font-medium
- Texte moyen: text-ap-cream-800
- Hover ligne: hover:bg-ap-cream-100

### Formulaires

- Fond: bg-white
- Bordure: border border-ap-cream-300
- Focus: ring-2 ring-ap-green-500 border-ap-green-500
- Placeholder: text-ap-cream-600
- Label: text-sm font-medium text-ap-green-900
- Radius: rounded-lg

---

## Typographie

- Police: Inter (via next/font/google) ou system sans-serif
- h1: text-2xl font-semibold text-ap-green-900
- h2: text-xl font-medium text-ap-green-900
- h3: text-lg font-medium text-ap-green-900
- Corps: text-sm text-ap-cream-800
- Labels: text-xs text-ap-cream-700

---

## Responsive

- Mobile (< 768px): sidebar collapse, 1 colonne
- Tablette (768-1024px): sidebar overlay, 2 colonnes KPI
- Desktop (> 1024px): sidebar fixe, 3+ colonnes KPI
- Approche: mobile-first (p-4 md:p-6 lg:p-8)

---

## Regles generales

1. UI en francais, code en anglais
2. Pas de dark mode pour le MVP
3. Toasts: sonner — succes en vert, erreur en rouge
4. Spacing: multiples de 4px
5. Bordures: 1px max
6. Ombres: aucune sauf focus ring
7. Animations: uniquement transition-colors
8. Texte sur fond colore: toujours le stop le plus fonce de la meme famille
