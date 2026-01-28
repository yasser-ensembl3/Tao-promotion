# MiniVault MCP Server

Serveur MCP pour interagir avec MiniVault via Claude Code.

## Outils disponibles

| Outil | Description |
|-------|-------------|
| `list_tasks` | Lister les tâches (filtrable par status) |
| `create_task` | Créer une nouvelle tâche |
| `list_recurring_tasks` | Lister les tâches récurrentes |
| `list_orders` | Lister les commandes |
| `list_essentials` | Lister les essentiels du projet |
| `get_metrics_summary` | Résumé des métriques |
| `get_project_status` | Vue d'ensemble du projet |

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
        "NOTION_DB_GOALS": "your_goals_database_id"
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

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `NOTION_TOKEN` | Token d'intégration Notion |
| `NOTION_DB_TASKS` | ID de la base de données des tâches |
| `NOTION_DB_RECURRING_TASKS` | ID de la base des tâches récurrentes |
| `NOTION_DB_ORDERS` | ID de la base des commandes |
| `NOTION_DB_ESSENTIALS` | ID de la base des essentiels |
| `NOTION_DB_METRICS` | ID de la base des métriques (inputs) |
| `NOTION_DB_GOALS` | ID de la base des goals (outputs) |
