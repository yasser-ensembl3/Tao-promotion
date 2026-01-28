# MiniVault MCP Server

Serveur MCP (Model Context Protocol) pour interagir avec les données Notion de MiniVault via Claude Code.

## Outils disponibles

### Tasks (Tâches)

| Outil | Description |
|-------|-------------|
| `list_tasks` | Lister les tâches (filtrable par status: To Do, In Progress, Review, Done) |
| `create_task` | Créer une nouvelle tâche |
| `update_task` | Mettre à jour une tâche existante |
| `delete_task` | Supprimer (archiver) une tâche |

### Recurring Tasks (Tâches récurrentes)

| Outil | Description |
|-------|-------------|
| `list_recurring_tasks` | Lister les tâches récurrentes (filtrable par fréquence) |
| `create_recurring_task` | Créer une tâche récurrente |
| `update_recurring_task` | Mettre à jour une tâche récurrente |

### Orders (Commandes)

| Outil | Description |
|-------|-------------|
| `list_orders` | Lister les commandes (filtrable par fulfillment/payment) |
| `update_order` | Mettre à jour une commande |

### Essentials (Essentiels)

| Outil | Description |
|-------|-------------|
| `list_essentials` | Lister les essentiels (Tool, Milestone, Strategy, etc.) |
| `create_essential` | Créer un nouvel essentiel |
| `update_essential` | Mettre à jour un essentiel |
| `delete_essential` | Supprimer un essentiel |

### Documents

| Outil | Description |
|-------|-------------|
| `list_documents` | Lister les documents/liens |
| `create_document` | Ajouter un nouveau document/lien |
| `delete_document` | Supprimer un document |

### Metrics & Goals (Métriques)

| Outil | Description |
|-------|-------------|
| `list_metrics` | Lister les métriques d'input (actions) |
| `create_metric` | Créer une entrée de métrique |
| `list_goals` | Lister les goals/outputs (résultats) |
| `create_goal` | Créer une entrée de goal |

### Sales Tracking (Suivi des ventes)

| Outil | Description |
|-------|-------------|
| `list_sales` | Lister les entrées de ventes par période |
| `create_sale` | Créer une entrée de ventes mensuelle |
| `update_sale` | Mettre à jour une entrée de ventes |

**Propriétés disponibles:** Period, Gross Sales, Discounts, Returns, Net Sales, Shipping, Taxes, Total Sales, Paid Orders, Orders Fulfilled, Average Order Value, Returning Customer Rate

### Web Analytics (Analytics web)

| Outil | Description |
|-------|-------------|
| `list_web_analytics` | Lister les entrées d'analytics web |
| `create_web_analytics` | Créer une entrée d'analytics mensuelle |
| `update_web_analytics` | Mettre à jour une entrée d'analytics |

**Propriétés disponibles:** Period, Sessions, Desktop, Mobile, Direct, LinkedIn, Twitter, Facebook, Google, Other, Add to Cart Rate, Checkout Rate, Checkout Reached Rate, Conversion Rate, Top Page

### Feedback

| Outil | Description |
|-------|-------------|
| `list_feedback` | Lister les feedbacks utilisateurs |
| `create_feedback` | Créer un nouveau feedback |

### Project Status

| Outil | Description |
|-------|-------------|
| `get_project_status` | Vue d'ensemble complète du projet |

### Raw Notion Access (Accès brut)

| Outil | Description |
|-------|-------------|
| `notion_query` | Requête brute sur n'importe quelle database |
| `notion_update_page` | Mise à jour directe d'une page Notion |
| `notion_create_page` | Création directe dans une database |

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration Claude Code

Ajoute cette configuration dans `~/.claude/settings.json` :

```json
{
  "mcpServers": {
    "minivault": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "NOTION_TOKEN": "your_notion_token",
        "NOTION_DB_TASKS": "your_tasks_database_id",
        "NOTION_DB_RECURRING_TASKS": "your_recurring_tasks_database_id",
        "NOTION_DB_ORDERS": "your_orders_database_id",
        "NOTION_DB_ESSENTIALS": "your_essentials_database_id",
        "NOTION_DB_METRICS": "your_metrics_database_id",
        "NOTION_DB_GOALS": "your_goals_database_id",
        "NOTION_DB_DOCUMENTS": "your_documents_database_id",
        "NOTION_DB_FEEDBACK": "your_feedback_database_id",
        "NOTION_DB_SALES": "your_sales_database_id",
        "NOTION_DB_WEB_ANALYTICS": "your_web_analytics_database_id"
      }
    }
  }
}
```

## Utilisation dans Claude Code

Une fois configuré, tu peux demander à Claude Code :

- "Montre-moi les tâches en cours"
- "Crée une tâche pour faire X"
- "Quelles sont les commandes non livrées ?"
- "Donne-moi le status du projet"
- "Ajoute les données de ventes de janvier"
- "Montre-moi les analytics web du dernier mois"

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `NOTION_TOKEN` | Token d'intégration Notion |
| `NOTION_DB_TASKS` | ID de la base des tâches |
| `NOTION_DB_RECURRING_TASKS` | ID de la base des tâches récurrentes |
| `NOTION_DB_ORDERS` | ID de la base des commandes |
| `NOTION_DB_ESSENTIALS` | ID de la base des essentiels |
| `NOTION_DB_METRICS` | ID de la base des métriques (inputs) |
| `NOTION_DB_GOALS` | ID de la base des goals (outputs) |
| `NOTION_DB_DOCUMENTS` | ID de la base des documents |
| `NOTION_DB_FEEDBACK` | ID de la base des feedbacks |
| `NOTION_DB_SALES` | ID de la base du suivi des ventes |
| `NOTION_DB_WEB_ANALYTICS` | ID de la base des analytics web |

## Intégration avec Shopify

Le MCP MiniVault peut être utilisé en combinaison avec le MCP Shopify pour synchroniser les données:

1. **Commandes**: Comparer `list_orders` (Notion) avec les commandes Shopify
2. **Ventes**: Utiliser les données Shopify Analytics pour alimenter `create_sale`
3. **Analytics**: Les données de sessions/trafic doivent être extraites manuellement du dashboard Shopify (pas disponible via API Admin)

### Données Shopify disponibles via API

| Donnée | Disponible | Notes |
|--------|------------|-------|
| Orders, Revenue | ✅ | Via Shopify MCP |
| Paid/Fulfilled counts | ✅ | Calculable depuis orders |
| Sessions, Traffic sources | ❌ | Dashboard uniquement |
| Conversion rates | ❌ | Dashboard uniquement |

## Changelog

### v1.1.0 (2026-01-28)
- Ajout des outils Sales Tracking (`list_sales`, `create_sale`, `update_sale`)
- Ajout des outils Web Analytics (`list_web_analytics`, `create_web_analytics`, `update_web_analytics`)
- Documentation des intégrations Shopify

### v1.0.0
- Version initiale avec Tasks, Orders, Essentials, Metrics, Goals, Documents, Feedback
