# Private Chest

Private Chest est un gestionnaire de mots de passe local-first, open source, conçu pour stocker des identifiants, notes confidentielles, cartes bancaires et documents sensibles dans un coffre chiffré sur l'ordinateur de l'utilisateur.

L'objectif du projet est de proposer une application simple à utiliser, transparente dans son fonctionnement, et pensée avec une approche cybersécurité : chiffrement robuste, stockage local, verrouillage automatique et absence de dépendance obligatoire au cloud.
<img width="1920" height="1041" alt="image" src="https://github.com/user-attachments/assets/c152397e-7156-4a01-b312-a74a8c3e4b12" />

> Statut : projet personnel / portfolio en version expérimentale. Private Chest utilise des primitives cryptographiques modernes, mais n'a pas encore fait l'objet d'un audit de sécurité externe.

## Fonctionnalités Clés

- 🔒 Coffre-fort chiffré : stockage sécurisé des identifiants, mots de passe, notes, cartes bancaires et documents.
- 💻 Local-first : les données restent sur la machine de l'utilisateur, sans synchronisation cloud imposée.
- 🔑 Générateur de mots de passe : création de mots de passe forts et configurables.
- 📋 Sécurité du presse-papiers : effacement automatique des secrets copiés après un délai configurable.
- ⏱️ Verrouillage automatique : fermeture de la session après une période d'inactivité.
- 🧾 Notes confidentielles : stockage de textes sensibles en plus des identifiants classiques.
- 💳 Cartes bancaires : espace séparé avec vérification du mot de passe maître.
- 📎 Documents chiffrés : ajout de fichiers sensibles chiffrés, avec limite de taille côté backend.
- 🗑️ Corbeille : suppression réversible avant suppression définitive.
- 🧩 Architecture modulaire : logique séparée en crates Rust pour la crypto, le stockage, la session et le backend.
<img width="1920" height="1041" alt="image" src="https://github.com/user-attachments/assets/4fbf229d-eccb-41b6-802d-ec9b3cff4e0e" />

## Sécurité & Architecture

Private Chest protège principalement les données au repos, c'est-à-dire les données stockées sur le disque lorsque le coffre est fermé.

### Modèle de chiffrement

Le coffre n'est pas stocké en clair. Les données sont sérialisées puis chiffrées dans un conteneur binaire versionné.

- Chiffrement authentifié : `AES-256-GCM`
- Dérivation du mot de passe maître : `Argon2id`
- Séparation de clés : `HKDF-SHA256`
- Génération aléatoire : générateur sécurisé du système d'exploitation
- Format du coffre : conteneur binaire `SPV1`

### Fonctionnement simplifié

1. L'utilisateur choisit un mot de passe maître.
2. Ce mot de passe est transformé avec `Argon2id`, un algorithme volontairement coûteux pour ralentir les attaques par force brute.
3. Une clé aléatoire de coffre chiffre les données avec `AES-256-GCM`.
4. Cette clé de coffre est elle-même protégée par une clé dérivée.
5. Le mot de passe maître n'est jamais sauvegardé en clair.

### Pourquoi AES-256-GCM ?

`AES-256-GCM` apporte deux protections :

- Confidentialité : les données deviennent illisibles sans la bonne clé.
- Intégrité : si le fichier chiffré est modifié ou corrompu, le déchiffrement échoue.

Autrement dit, une personne qui récupère uniquement le fichier `vault.bin` ne peut pas lire son contenu sans le mot de passe maître.

### Approche zéro-connaissance locale

Private Chest ne nécessite pas de compte distant et n'envoie pas le coffre vers un serveur externe. Le modèle est local-first : l'utilisateur garde le contrôle de ses fichiers et de ses secrets.

## Limites du Modèle de Sécurité

Private Chest protège les données stockées sur le disque, mais il dépend de la sécurité du système hôte.

L'application ne peut pas protéger efficacement les secrets dans les cas suivants :

- ordinateur déjà compromis par un malware ;
- keylogger actif qui capture le mot de passe maître ;
- accès administrateur hostile sur la machine ;
- extraction mémoire pendant que le coffre est déverrouillé ;
- suppression volontaire ou accidentelle du coffre sans sauvegarde.

Il est donc recommandé de garder son système à jour, d'utiliser un mot de passe maître fort, et de conserver des sauvegardes sécurisées du coffre.

## Stack Technique

| Partie | Technologie | Rôle |
| --- | --- | --- |
| Application desktop | Tauri | Fenêtre native Windows et communication frontend/backend |
| Backend | Rust | Logique de sécurité, stockage, sessions et commandes |
| Interface | HTML, CSS, JavaScript | UI locale de l'application |
| Chiffrement | AES-256-GCM | Chiffrement authentifié du coffre |
| Dérivation de clé | Argon2id | Protection contre les attaques hors ligne |
| Séparation de clés | HKDF-SHA256 | Dérivation de sous-clés spécialisées |
| Stockage | Format binaire `SPV1` | Conteneur opaque non lisible en clair |
| Tests | Cargo test | Tests unitaires et d'intégration Rust |

## Structure du Projet

```text
PrivateChest/
├── apps/
│   ├── desktop/          # Application Tauri
│   └── extension/        # Extension navigateur / native messaging
├── crates/
│   ├── crypto_core/      # Primitives crypto
│   ├── vault_format/     # Format binaire du coffre
│   ├── vault_store/      # Lecture, écriture, sauvegardes
│   ├── desktop_backend/  # Logique principale de l'application
│   ├── password_generator/
│   ├── session_manager/
│   └── native_protocol/
├── docs/                 # Documentation sécurité et architecture
├── tests/                # Scénarios de test
└── README.md
```

## Démarrage Rapide

### Prérequis

- Windows 10/11
- Rust et Cargo
- Tauri CLI
- WebView2 Runtime, généralement déjà présent sur Windows 11

### Lancer en développement

```powershell
git clone https://github.com/ton-username/private-chest.git
cd private-chest
cd apps/desktop/src-tauri
cargo tauri dev
```

### Lancer les tests

Depuis la racine du projet :

```powershell
cargo test --workspace
```

### Compiler l'installateur Windows

```powershell
cd apps/desktop/src-tauri
cargo tauri build --bundles nsis
```

L'installateur généré se trouve ensuite dans :

```text
apps/desktop/src-tauri/target/release/bundle/nsis/
```

## Documentation

Les documents suivants détaillent les décisions techniques et de sécurité :

- `docs/threat-model.md` : modèle de menace du projet.
- `docs/cryptography.md` : choix cryptographiques.
- `docs/vault-format.md` : format binaire du coffre.
- `docs/tauri-hardening.md` : durcissement de l'application Tauri.
- `docs/ipc-protocol.md` : protocole d'échange interne.
- `docs/extension-security.md` : sécurité de l'extension navigateur.
- `docs/release-hardening.md` : checklist de durcissement release.
- `docs/windows-deployment.md` : notes de déploiement Windows.
- `docs/documents-chiffres.md` : chiffrement des documents joints.

## Roadmap

- Signature de l'exécutable Windows.
- Amélioration du processus de release GitHub.
- Ajout d'une licence open source officielle.
- Version portable sans installateur.
- Audit de sécurité externe.
- Export/import chiffré.
- Amélioration de l'extension navigateur.
- Synchronisation optionnelle chiffrée de bout en bout.

## Open Source & Contribution

Private Chest a vocation à être un projet open source : chacun doit pouvoir lire le code, le compiler, le modifier et proposer des améliorations.

Avant publication publique, il est recommandé d'ajouter :

- un fichier `LICENSE` ;
- un fichier `SECURITY.md` pour le signalement responsable des failles ;
- un fichier `CONTRIBUTING.md` pour expliquer comment contribuer.

Licence conseillée :

- `MIT` si l'objectif est de permettre une réutilisation très libre ;
- `GPL-3.0` si l'objectif est d'obliger les versions modifiées à rester open source.

## Avertissement

Private Chest est un projet expérimental orienté apprentissage, portfolio et cybersécurité locale. Il ne doit pas être présenté comme une solution auditée ou infaillible.

Pour des comptes critiques, il est recommandé de garder des sauvegardes, d'utiliser l'authentification à deux facteurs lorsque c'est possible, et de maintenir son système d'exploitation sécurisé.
