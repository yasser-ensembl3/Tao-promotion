# Configuration des Tâches dans MiniVault

## Vue d'ensemble

MiniVault sépare désormais les tâches en deux catégories distinctes :

1. **Tâches Ponctuelles** (✅) - Tâches uniques avec un statut (To Do, In Progress, Done)
2. **Tâches Récurrentes** (🔄) - Tâches qui se répètent selon une fréquence définie

Chaque type de tâche a sa propre database Notion et sa propre section dans le dashboard.

---

## 1. Tâches Ponctuelles

### Configuration de la Database Notion

Créez une database Notion avec les propriétés suivantes :

| Propriété | Type | Description | Obligatoire |
|-----------|------|-------------|-------------|
| **Name** ou **Title** | Title | Nom de la tâche | ✅ Oui |
| **Assignée** ou **Assignee** | Rich Text | Personne assignée à la tâche | ❌ Non |
| **Status** | Select ou Rich Text | Statut actuel (To Do, In Progress, Review, Done, Completed) | ❌ Non |
| **Due Date** | Date | Date d'échéance | ❌ Non |
| **Priority** | Select ou Rich Text | Priorité (Low, Medium, High, Urgent) | ❌ Non |
| **Tags** | Multi-select ou Rich Text | Tags pour catégoriser | ❌ Non |

### Variable d'Environnement

```bash
NEXT_PUBLIC_NOTION_DB_TASKS=your-database-id-here
```

### Fonctionnalités

- Kanban board organisé par statut (To Do, In Progress, Review, Done, Completed)
- Filtres par statut
- Création de nouvelles tâches depuis le dashboard
- Badge de priorité avec code couleur
- Vue compacte montrant les tâches en cours

---

## 2. Tâches Récurrentes

### Configuration de la Database Notion

Créez une database Notion avec les propriétés suivantes :

| Propriété | Type | Description | Obligatoire |
|-----------|------|-------------|-------------|
| **Name** ou **Title** | Title | Nom de la tâche récurrente | ✅ Oui |
| **Frequency** ou **Fréquence** | Select ou Rich Text | Fréquence de répétition | ✅ Recommandé |
| **Assignée** ou **Assignee** | Rich Text | Personne assignée | ❌ Non |
| **Status** | Select ou Rich Text | Statut actuel (To Do, In Progress, Done) | ❌ Non |
| **Due Date** | Date | Prochaine date d'exécution | ❌ Non |
| **Last Completed** | Date | Dernière date de complétion | ❌ Non |
| **Priority** | Select ou Rich Text | Priorité (Low, Medium, High, Urgent) | ❌ Non |
| **Tags** | Multi-select ou Rich Text | Tags pour catégoriser | ❌ Non |

### Valeurs Recommandées pour Frequency

Si vous utilisez un champ Select pour **Frequency**, créez les options suivantes :

- `Daily` (Quotidienne) - 📅
- `Weekly` (Hebdomadaire) - 📆
- `Monthly` (Mensuelle) - 🗓️
- `Quarterly` (Trimestrielle) - 📊
- `Custom` (Personnalisée) - ⚙️

### Variable d'Environnement

```bash
NEXT_PUBLIC_NOTION_DB_RECURRING_TASKS=your-database-id-here
```

### Fonctionnalités

- Groupement par fréquence (quotidienne, hebdomadaire, mensuelle, etc.)
- Filtres par fréquence
- Affichage de la prochaine date d'exécution et dernière complétion
- Création de nouvelles tâches récurrentes depuis le dashboard
- Badge de priorité avec code couleur
- Vue compacte montrant les tâches actives

---

## Comment Obtenir l'ID d'une Database Notion

1. Ouvrez votre database dans Notion
2. Regardez l'URL dans votre navigateur :
   ```
   https://www.notion.so/[workspace]/[DATABASE_ID]?v=...
   ```
3. Le **DATABASE_ID** est la partie entre le nom du workspace et le `?v=`
4. Copiez cet ID dans votre fichier `.env.local`

**Exemple :**
```
https://www.notion.so/myworkspace/29d58fe731b1812e964bd1817a08e968?v=...
                                  └─────────── Ceci est votre ID ──────────┘
```

---

## Connecter les Databases à votre Intégration Notion

⚠️ **Important** : N'oubliez pas de connecter chaque database à votre intégration Notion !

1. Ouvrez la database dans Notion
2. Cliquez sur `•••` (trois points) en haut à droite
3. Sélectionnez "Connect to" → Votre intégration MiniVault
4. Confirmez la connexion

---

## Ordre des Sections dans le Dashboard

Les sections apparaissent dans l'ordre suivant :

1. 🎯 **Goals** - Métriques de résultats
2. 💪 **Metrics** - Métriques d'actions
3. 📚 **Guides & Docs** - Documentation
4. 📋 **Overview** - Vue d'ensemble du projet
5. 🔄 **Tâches Récurrentes** - Tâches répétitives
6. ✅ **Tâches Ponctuelles** - Tâches uniques
7. 📊 **Weekly Reports** - Rapports hebdomadaires
8. 💬 **User Feedback** - Retours utilisateurs

---

## API Endpoints

### Tâches Ponctuelles
- **GET** `/api/notion/tasks?databaseId={id}` - Récupérer toutes les tâches
- **POST** `/api/notion/tasks` - Créer une nouvelle tâche

### Tâches Récurrentes
- **GET** `/api/notion/recurring-tasks?databaseId={id}` - Récupérer toutes les tâches récurrentes
- **POST** `/api/notion/recurring-tasks` - Créer une nouvelle tâche récurrente

---

## Exemples de Tâches

### Tâches Ponctuelles (exemples)
- "Créer le wireframe de la page d'accueil"
- "Corriger le bug #123 dans le module de paiement"
- "Rédiger le contenu de la landing page"
- "Préparer la présentation pour l'investisseur"

### Tâches Récurrentes (exemples)
- "Publier un post LinkedIn" (Quotidienne)
- "Envoyer la newsletter" (Hebdomadaire)
- "Analyser les métriques de croissance" (Hebdomadaire)
- "Réviser le budget du projet" (Mensuelle)
- "Rapport trimestriel aux parties prenantes" (Trimestrielle)

---

## Troubleshooting

### La section des tâches récurrentes n'apparaît pas
✅ Vérifiez que `NEXT_PUBLIC_NOTION_DB_RECURRING_TASKS` est défini dans `.env.local`
✅ Vérifiez que la database est connectée à votre intégration Notion
✅ Redémarrez le serveur de développement (`npm run dev`)

### Les tâches n'apparaissent pas dans la section
✅ Vérifiez que l'ID de la database est correct
✅ Vérifiez que la database contient des entrées
✅ Vérifiez que les propriétés de la database correspondent aux noms attendus
✅ Consultez les logs du serveur pour les erreurs API Notion

### Erreur "NOTION_TOKEN not configured"
✅ Vérifiez que `NOTION_TOKEN` est défini dans `.env.local`
✅ Vérifiez que le token d'intégration Notion est valide
✅ Redémarrez le serveur après modification du fichier `.env.local`

---

## Migration depuis l'ancienne version

Si vous aviez déjà une section "Projects & Tasks", elle a été renommée en "Tâches Ponctuelles".

Vous pouvez :
1. Continuer à utiliser votre database existante pour les tâches ponctuelles
2. Créer une nouvelle database pour les tâches récurrentes
3. Ou migrer certaines tâches récurrentes vers la nouvelle database dédiée

**Aucune migration de données n'est nécessaire** - les deux databases sont indépendantes et peuvent coexister.
