# Template : Database Notion pour Tâches Récurrentes

## 📋 Instructions de création

### Étape 1 : Créer la Database
1. Ouvrez Notion
2. Cliquez sur "New page" ou créez une nouvelle page dans votre workspace
3. Tapez `/database` et sélectionnez "Database - Inline" ou "Database - Full page"
4. Nommez votre database : **"Tâches Récurrentes"** ou **"Recurring Tasks"**

### Étape 2 : Configuration des Propriétés

Voici les propriétés à créer dans votre database (version simplifiée) :

| Nom de la propriété | Type | Configuration |
|---------------------|------|---------------|
| **Name** | Title | ✅ Créé automatiquement |
| **Frequency** | Text | Nouveau champ texte |
| **Assignée** | Text | Nouveau champ texte |
| **Status** | Text | Nouveau champ texte |
| **Due Date** | Date | Nouveau champ date |
| **Last Completed** | Date | Nouveau champ date |

### Étape 3 : Créer les Propriétés une par une

#### 1. Name (déjà créé automatiquement)
- Type : Title
- ✅ Rien à faire, déjà présent

#### 2. Frequency
1. Cliquez sur "+" pour ajouter une propriété
2. Nommez-la : **Frequency**
3. Sélectionnez le type : **Text**
4. Cliquez en dehors pour valider

#### 3. Assignée
1. Cliquez sur "+" pour ajouter une propriété
2. Nommez-la : **Assignée**
3. Sélectionnez le type : **Text**
4. Cliquez en dehors pour valider

#### 4. Status
1. Cliquez sur "+" pour ajouter une propriété
2. Nommez-la : **Status**
3. Sélectionnez le type : **Text**
4. Cliquez en dehors pour valider

#### 5. Due Date
1. Cliquez sur "+" pour ajouter une propriété
2. Nommez-la : **Due Date**
3. Sélectionnez le type : **Date**
4. Cliquez en dehors pour valider

#### 6. Last Completed
1. Cliquez sur "+" pour ajouter une propriété
2. Nommez-la : **Last Completed**
3. Sélectionnez le type : **Date**
4. Cliquez en dehors pour valider

---

## 🔄 Exemples de Tâches à Ajouter

Voici quelques exemples de tâches récurrentes que vous pouvez ajouter :

### Exemple 1 : Publication quotidienne
- **Name** : Publier un post sur LinkedIn
- **Frequency** : Daily
- **Assignée** : [Votre nom]
- **Status** : To Do
- **Due Date** : [Date du jour]
- **Last Completed** : [Vide pour commencer]

### Exemple 2 : Newsletter hebdomadaire
- **Name** : Envoyer la newsletter hebdomadaire
- **Frequency** : Weekly
- **Assignée** : [Votre nom]
- **Status** : To Do
- **Due Date** : [Prochain lundi]
- **Last Completed** : [Vide pour commencer]

### Exemple 3 : Analyse mensuelle
- **Name** : Analyser les métriques du mois
- **Frequency** : Monthly
- **Assignée** : [Votre nom]
- **Status** : To Do
- **Due Date** : [Premier du mois prochain]
- **Last Completed** : [Vide pour commencer]

### Exemple 4 : Rapport trimestriel
- **Name** : Préparer le rapport trimestriel
- **Frequency** : Quarterly
- **Assignée** : [Votre nom]
- **Status** : To Do
- **Due Date** : [Fin du trimestre]
- **Last Completed** : [Vide pour commencer]

---

## 🎨 Valeurs Recommandées

### Pour le champ "Frequency" (texte libre)
Utilisez ces valeurs exactes pour que l'interface les reconnaisse avec les bons emojis :
- `Daily` (quotidienne) - sera affiché avec 📅
- `Weekly` (hebdomadaire) - sera affiché avec 📆
- `Monthly` (mensuelle) - sera affiché avec 🗓️
- `Quarterly` (trimestrielle) - sera affiché avec 📊
- `Custom` (personnalisée) - sera affiché avec ⚙️

### Pour le champ "Status" (texte libre)
Valeurs recommandées :
- `To Do` (à faire)
- `In Progress` (en cours)
- `Done` (terminé)

---

## 🔗 Connecter la Database à votre Intégration

**⚠️ IMPORTANT** : N'oubliez pas cette étape !

1. Dans votre database Notion, cliquez sur `•••` (trois points) en haut à droite
2. Sélectionnez **"Connections"** ou **"Connect to"**
3. Recherchez et sélectionnez votre intégration MiniVault
4. Cliquez sur **"Confirm"**

---

## 📝 Récupérer l'ID de la Database

1. Ouvrez votre database dans Notion
2. Regardez l'URL dans votre navigateur :
   ```
   https://www.notion.so/workspace/29d58fe731b1812e964bd1817a08e968?v=...
   ```
3. L'ID est la partie entre le nom du workspace et `?v=`
4. Dans cet exemple : `29d58fe731b1812e964bd1817a08e968`

5. Copiez cet ID dans votre fichier `.env.local` :
   ```bash
   NEXT_PUBLIC_NOTION_DB_RECURRING_TASKS=29d58fe731b1812e964bd1817a08e968
   ```

6. Redémarrez le serveur de développement :
   ```bash
   # Arrêtez le serveur (Ctrl+C) puis relancez
   npm run dev
   ```

---

## ✅ Vérification

Une fois la database créée et configurée, vous devriez voir :

1. Dans Notion :
   - Une database avec 6 colonnes (Name, Frequency, Assignée, Status, Due Date, Last Completed)
   - La database connectée à votre intégration MiniVault

2. Dans MiniVault :
   - Une section "🔄 Tâches Récurrentes" dans le dashboard
   - Possibilité de créer de nouvelles tâches depuis l'interface
   - Filtrage par fréquence (Daily, Weekly, Monthly, etc.)

---

## 🆘 Aide Rapide

### Si la section n'apparaît pas dans MiniVault :
1. ✅ Vérifiez que `NEXT_PUBLIC_NOTION_DB_RECURRING_TASKS` est dans `.env.local`
2. ✅ Vérifiez que l'ID de la database est correct (32 caractères)
3. ✅ Vérifiez que la database est connectée à l'intégration
4. ✅ Redémarrez le serveur (`npm run dev`)

### Si les tâches n'apparaissent pas :
1. ✅ Vérifiez que les noms des propriétés sont exacts (Name, Frequency, etc.)
2. ✅ Ajoutez au moins une tâche dans la database Notion
3. ✅ Actualisez la page dans votre navigateur

---

## 🎯 Prochaines Étapes

1. Créez la database en suivant ce guide
2. Ajoutez quelques tâches d'exemple
3. Connectez-la à votre intégration
4. Copiez l'ID dans `.env.local`
5. Redémarrez le serveur
6. Profitez de votre nouveau système de tâches récurrentes ! 🚀
