# Changelog — PrivateChest Desktop

Format : `[Session YYYY-MM-DD]` → liste des modifications.

---

## [Session 2026-05-22] — Corrections encodage, titlebar, textes

### Corrections critiques
- **Encodage UTF-8 cassé** — Le fichier `index.html` avait été sauvegardé en ANSI par un formateur, produisant des artefacts type `l'entrÃ©e`. Double-décodage Python (cp1252-ext × 2) appliqué pour restaurer les caractères français corrects (é, è, à, ç, …, etc.).
- **Écran noir** — Causé par l'encodage cassé du HTML. Résolu avec la correction UTF-8 ci-dessus.

### Nouvelles fonctionnalités
- **Barre de titre custom** — `decorations: false` ajouté dans `tauri.conf.json`. Barre HTML (`#titlebar`) ajoutée avec zone de drag, titre, et boutons Réduire / Agrandir / Fermer. Couleur = `--bg-app` (`#0b0f1a`) pour correspondre au fond de l'app.
- **Boutons fenêtre JS** — Hooks `tbMinBtn`, `tbMaxBtn`, `tbCloseBtn` via `window.__TAURI__.window.getCurrent()`.

### Corrections textes UI
- **Page de login** — "Mot de passe maître" → "Mot de passe" (label, placeholder, sous-titre). Conservé uniquement dans la section Paramètres (changer le mot de passe maître).
- **Onboarding** — Idem, label et description mis à jour.

### CSS
- `.screen { inset: 32px 0 0 0 }` — Décalage du contenu sous la barre de titre.
- Règles `.tb-btn`, `.tb-close`, `.titlebar-controls` ajoutées.

---

## [Session 2026-05-22] — Session précédente (résumé consolidé)

### Corrections critiques (session précédente)
- `#toastContainer` manquant dans le HTML → `TypeError: Cannot read properties of null (reading 'appendChild')` — CORRIGÉ
- Doublon HTML fantôme (≈280 lignes) après `</html>` — SUPPRIMÉ
- Catégorie "general" affichée comme bouton blanc dans la sidebar — MASQUÉE

### Nouvelles fonctionnalités (session précédente)
- **Icônes services** — 17 services reconnus (Discord, Steam, Spotify, Instagram, YouTube, Amazon, Apple, LinkedIn, Telegram, PlayStation, Xbox, Cloudflare, Deezer, Stripe, TeamSpeak, Unity, Twitter/X) via `getServiceIcon()` + `SERVICE_ICONS` SVG inline.
- **Export CSV** — Bouton "Exporter en CSV" dans Paramètres. Récupère tous les mots de passe via `get_entry_details`, génère un `.csv` avec BOM UTF-8.
- **Slide notification** — Fonction `showSlideNotif()` (slide droite→gauche) pour la sauvegarde de l'indice de déverrouillage.
- **Label force mot de passe** — `#newPwdStrengthLabel` dans les Paramètres, mis à jour dynamiquement.

### Corrections UI (session précédente)
- Panel liste : largeur 260px → 320px
- Icône cadenas login : `left: 14px`, `padding-left: 46px` (plus d'overlap)
- `.entry-avatar` — règle CSS ajoutée (34×34px, border-radius 8px)
- `.fav-star`, `.strength-dot`, `.str-weak/fair/strong` — styles ajoutés
- `.category-item` — style dark theme complet
- `.detail-avatar` — border-radius 10px, overflow:hidden
