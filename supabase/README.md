# Configuration Supabase pour AfroPlan

## 1. Creer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et creez un compte
2. Creez un nouveau projet
3. Notez votre **URL du projet** et votre **cle anon** (dans Settings > API)

## 2. Configurer la base de donnees

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez le contenu du fichier `schema.sql`
3. Executez le script SQL

Cela va creer:
- Toutes les tables necessaires (profiles, salons, services, bookings, reviews, favorites, etc.)
- Les politiques de securite RLS
- Les triggers automatiques
- Les donnees initiales des categories

## 3. Configurer l'authentification

1. Allez dans **Authentication > Providers**
2. Activez **Email** (deja actif par defaut)
3. Optionnel: Activez Google et Apple pour le login social

### Parametres recommandes:
- **Confirm email**: Active (pour la verification des emails)
- **Secure email change**: Active
- **Secure password change**: Active

## 4. Configurer le Storage

Creez les buckets suivants dans **Storage**:

### Bucket: `avatars`
- Public: Oui
- Allowed MIME types: `image/*`

Politique RLS pour avatars:
```sql
-- SELECT (public)
true

-- INSERT
auth.uid()::text = (storage.foldername(name))[1]

-- UPDATE
auth.uid()::text = (storage.foldername(name))[1]

-- DELETE
auth.uid()::text = (storage.foldername(name))[1]
```

### Bucket: `salons`
- Public: Oui
- Allowed MIME types: `image/*`

### Bucket: `gallery`
- Public: Oui
- Allowed MIME types: `image/*`

## 5. Configurer l'application

1. Copiez `.env.example` vers `.env`:
```bash
cp .env.example .env
```

2. Ajoutez vos credentials Supabase dans `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

## 6. Lancer l'application

```bash
# Installer les dependances
npm install

# Lancer le serveur de developpement
npm start
```

## Structure de la base de donnees

```
profiles          - Utilisateurs (clients et coiffeurs)
categories        - Categories de services (Tresses, Locks, etc.)
salons            - Salons de coiffure
salon_categories  - Relation salons <-> categories
services          - Services proposes par les salons
bookings          - Reservations
reviews           - Avis clients
favorites         - Salons favoris
gallery_images    - Galerie photos des salons
```

## Securite

- Toutes les tables utilisent RLS (Row Level Security)
- Les utilisateurs ne peuvent modifier que leurs propres donnees
- Les proprietaires de salons ont acces aux donnees de leur salon
- Les donnees publiques (salons, categories, avis) sont lisibles par tous

## Support

Pour toute question, consultez la documentation Supabase:
https://supabase.com/docs
