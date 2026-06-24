# Documents chiffrés — Documentation technique

> État : **implémenté et fonctionnel**  
> Dernière mise à jour : mai 2026

---

## Vue d'ensemble

PrivateChest permet de joindre des fichiers chiffrés (documents, images, PDFs, etc.) à n'importe quelle entrée du coffre. Ces fichiers sont chiffrés individuellement avec AES-256-GCM, stockés comme « sidecars » à côté du coffre, et référencés dans les métadonnées du coffre.

Une vue dédiée **Documents** dans la barre de navigation latérale liste tous les fichiers joints de toutes les entrées.

---

## Architecture

### Modèle de données

```
VaultPayload (CBOR)
├── entries: Vec<VaultEntry>
├── documents: Vec<VaultDocument>   ← métadonnées, PAS le contenu
└── file_root_salt: Vec<u8>         ← sel racine pour dérivation des clés
```

**`VaultDocument`** (`crates/vault_domain/src/lib.rs`) :

| Champ | Type | Description |
|---|---|---|
| `id` | `String` | UUID v4 unique par document |
| `entry_id` | `String` | UUID de l'entrée parente |
| `filename` | `String` | Nom d'origine du fichier |
| `mime_type` | `String` | Type MIME (`image/png`, `application/pdf`, etc.) |
| `size` | `u64` | Taille en octets du fichier **non chiffré** |
| `created_at` | `String` | Horodatage ISO 8601 |

### Fichiers sidecar

Les contenus chiffrés sont stockés dans :
```
{vault_dir}/files/{doc_id}.enc
```

Format binaire du fichier `.enc` :
```
[12 octets nonce aléatoire][ciphertext AES-256-GCM + 16 octets tag]
```

Le répertoire `files/` est créé automatiquement à la première pièce jointe.

---

## Dérivation des clés

Chaque document possède une clé AES-256 unique dérivée par **HKDF-SHA256** :

```
clé_doc = HKDF-SHA256(
    ikm  = master_password (bytes),
    salt = file_root_salt (16 octets, stocké dans VaultPayload),
    info = b"pc:v1:file:" || doc_id (UTF-8)
)
```

- `file_root_salt` est généré aléatoirement lors de la création du coffre (via `OsRng`)
- Les coffres anciens qui n'ont pas de `file_root_salt` le reçoivent automatiquement lors du premier déverrouillage (migration transparente)
- La connaissance du `file_root_salt` seul ne suffit pas : il faut aussi le `master_password`

**Constante AAD** : `b"private-chest:v1:file"` — liée au ciphertext, empêche toute réutilisation inter-contextes.

---

## Couches implémentées

### 1. `crates/crypto_core`

| Symbole | Rôle |
|---|---|
| `FILE_AAD` | Constante AAD pour les fichiers chiffrés |
| `derive_file_key(master_password, file_root_salt, doc_id)` | Dérive une clé AES-256 par HKDF-SHA256 |

Dépendances requises (déjà présentes) : `hkdf = "0.12"`, `sha2 = "0.10"`.

### 2. `crates/vault_domain`

- `VaultDocument` struct (id, entry_id, filename, mime_type, size, created_at)
- `VaultPayload.documents: Vec<VaultDocument>` avec `#[serde(default)]`
- `VaultPayload.file_root_salt: Vec<u8>` avec `#[serde(default)]`

### 3. `crates/desktop_backend`

#### Modèles (`src/models.rs`)

| Struct | Usage |
|---|---|
| `DocumentMeta` | Métadonnées d'un document (miroir de `VaultDocument`) |
| `DocumentWithEntry` | `DocumentMeta` + `entry_title` — pour la vue globale Documents |

#### Backend (`src/backend.rs`)

| Méthode | Signature | Description |
|---|---|---|
| `attach_file` | `(entry_id, filename, mime_type, data: &[u8], now) -> Result<String>` | Valide taille ≤50 Mo, génère UUID, dérive clé, chiffre, écrit sidecar, persiste métadonnées. Rollback si persist échoue. |
| `list_documents` | `(entry_id, now) -> Result<Vec<DocumentMeta>>` | Liste les documents d'une entrée |
| `list_all_documents` | `(now) -> Result<Vec<DocumentWithEntry>>` | Liste **tous** les documents avec le titre de leur entrée parente |
| `get_document_bytes` | `(doc_id, now) -> Result<(DocumentMeta, Vec<u8>)>` | Lit le sidecar, déchiffre, retourne les bytes en clair |
| `delete_document` | `(doc_id, now) -> Result<()>` | Supprime le fichier sidecar + les métadonnées dans le payload |

#### Migrations (`unlock()`)

Si un coffre existant n'a pas de `file_root_salt`, il en reçoit un automatiquement au déverrouillage. La modification est persistée immédiatement.

### 4. `apps/desktop/src-tauri`

#### Commandes Tauri (`src/commands.rs`)

| Commande JS | Paramètres | Retour |
|---|---|---|
| `attach_file` | `entryId, filename, mimeType, dataB64` | `String` (doc UUID) |
| `list_documents` | `entryId` | `Vec<DocumentMeta>` |
| `list_all_documents` | *(aucun)* | `Vec<DocumentWithEntry>` |
| `download_document` | `docId` | `DocumentDownload { filename, mime_type, data_b64 }` |
| `delete_document` | `docId` | `()` |

Transport : les données binaires transitent encodées en **base64** entre JS et Rust.  
Limite : **50 Mo** par fichier (vérifiée côté backend).

---

## Interface utilisateur

### Section « Fichiers joints » (panneau de détail d'une entrée)

Visible dans le panneau de détail de toute entrée, sous le widget 2FA.

**Fonctionnalités :**
- Bouton **Joindre** → ouvre le sélecteur de fichiers natif (multi-sélection)
- **Drag & drop** sur la section pour glisser des fichiers directement
- Liste des fichiers joints avec icône selon le type, nom, taille
- Bouton **Télécharger** par fichier → génère un Blob URL côté JS et déclenche le téléchargement
- Bouton **Supprimer** par fichier → confirmation puis suppression du sidecar et des métadonnées
- La liste se rafraîchit automatiquement après chaque action

**Fichiers concernés :**
- `apps/desktop/src/index.html` — section `#attachmentsSection`
- `apps/desktop/src/index.js` — fonctions `renderAttachments`, `attachFile`, `downloadDocument`, `deleteAttachment`, `formatFileSize`
- `apps/desktop/src/styles.css` — classes `.attach-*`

### Vue dédiée « Documents » (barre de navigation)

Accessible via l'icône **Documents** dans la sidebar (remplace l'ancienne entrée « Bientôt »).

**Fonctionnalités :**
- Compteur dans le badge nav (mis à jour au déverrouillage et lors de chaque action)
- Liste de **tous les fichiers** de toutes les entrées
- Colonne « entrée parente » sous forme de chip coloré
- Icônes spécialisées selon le type : PDF (rouge), image (bleu), texte (violet), générique
- Barre de **recherche** filtre en temps réel par nom de fichier et titre d'entrée
- Bouton **Télécharger** par ligne
- Bouton **Supprimer** par ligne (avec confirmation)

**Fichiers concernés :**
- `apps/desktop/src/index.html` — section `#documentsView`
- `apps/desktop/src/index.js` — fonctions `loadDocumentsView`, `renderDocsList`, `docMimeIcon`, `updateDocsCount`
- `apps/desktop/src/styles.css` — classes `.docs-*`, `.doc-row-*`

---

## Sécurité

| Propriété | Détail |
|---|---|
| Algorithme | AES-256-GCM (authentifié) |
| Clé | 256 bits, unique par document, dérivée par HKDF-SHA256 |
| Nonce | 96 bits aléatoires (OsRng), stockés en tête de fichier |
| AAD | `b"private-chest:v1:file"` — lie le ciphertext au contexte applicatif |
| Intégrité | Le tag GCM (128 bits) détecte toute altération du fichier |
| Isolation | La compromission d'une clé de document n'expose pas les autres |
| Taille max | 50 Mo par fichier (vérifiée avant chiffrement) |
| Données en transit | Base64 uniquement en mémoire JS/Rust, jamais sur le réseau |

---

## Structure des fichiers modifiés

```
crates/
  crypto_core/src/lib.rs          ← FILE_AAD, derive_file_key
  vault_domain/src/lib.rs         ← VaultDocument, VaultPayload.documents/.file_root_salt
  desktop_backend/src/
    models.rs                     ← DocumentMeta, DocumentWithEntry
    lib.rs                        ← exports DocumentMeta, DocumentWithEntry
    backend.rs                    ← attach_file, list_documents, list_all_documents,
                                     get_document_bytes, delete_document, files_dir,
                                     derive_doc_key, migration file_root_salt
  vault_format/src/lib.rs         ← tests mis à jour (nouveaux champs)
  vault_format/tests/tamper_corruption.rs ← idem
  vault_store/src/lib.rs          ← idem
apps/desktop/
  src-tauri/
    Cargo.toml                    ← base64 = "0.22"
    src/commands.rs               ← CommandService + handlers Tauri pour 5 commandes
    src/main.rs                   ← enregistrement des 5 commandes dans invoke_handler
  src/
    index.html                    ← #attachmentsSection + #documentsView + nav btn
    index.js                      ← logique complète attachements + vue Documents
    styles.css                    ← styles .attach-* + .docs-* + .doc-row-*
```

---

## Ce qui reste à faire (post-V1)

| Item | Priorité | Notes |
|---|---|---|
| Prévisualisation inline (images/PDF) | Basse | Nécessite un composant modal dédié |
| Renommage d'un fichier | Basse | Modification des métadonnées uniquement |
| Déplacement d'un document vers une autre entrée | Basse | Modifier `entry_id` + re-dériver la clé ou conserver HKDF par doc_id |
| Export chiffré d'un document | Moyenne | Inclure dans la sauvegarde du coffre |
| Compteur `document_count` dans `VaultStats` | Basse | Évite le second appel `list_all_documents` dans `renderSecAlerts` |
| Animation de chargement entre vues | Basse | Définie dans la session précédente, toujours en attente |
