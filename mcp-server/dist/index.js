#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";
// Configuration from environment variables
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASES = {
    tasks: process.env.NOTION_DB_TASKS,
    recurringTasks: process.env.NOTION_DB_RECURRING_TASKS,
    orders: process.env.NOTION_DB_ORDERS,
    essentials: process.env.NOTION_DB_ESSENTIALS,
    metrics: process.env.NOTION_DB_METRICS,
    goals: process.env.NOTION_DB_GOALS,
    documents: process.env.NOTION_DB_DOCUMENTS,
    feedback: process.env.NOTION_DB_FEEDBACK,
    sales: process.env.NOTION_DB_SALES,
    webAnalytics: process.env.NOTION_DB_WEB_ANALYTICS,
};
// Initialize Notion client
const notion = NOTION_TOKEN ? new Client({ auth: NOTION_TOKEN }) : null;
// Helper to extract text from Notion properties
function getTextFromProperty(property) {
    if (!property)
        return "";
    switch (property.type) {
        case "title":
            return property.title?.[0]?.plain_text || "";
        case "rich_text":
            return property.rich_text?.[0]?.plain_text || "";
        case "select":
            return property.select?.name || "";
        case "multi_select":
            return property.multi_select?.map((s) => s.name).join(", ") || "";
        case "number":
            return property.number?.toString() || "";
        case "date":
            return property.date?.start || "";
        case "checkbox":
            return property.checkbox ? "Yes" : "No";
        case "url":
            return property.url || "";
        case "email":
            return property.email || "";
        case "phone_number":
            return property.phone_number || "";
        case "formula":
            if (property.formula.type === "string")
                return property.formula.string || "";
            if (property.formula.type === "number")
                return property.formula.number?.toString() || "";
            return "";
        case "status":
            return property.status?.name || "";
        default:
            return "";
    }
}
// Define ALL tools - Full CRUD for every database
const tools = [
    // ============ TASKS ============
    {
        name: "list_tasks",
        description: "List all tasks from Notion. Can filter by status.",
        inputSchema: {
            type: "object",
            properties: {
                status: { type: "string", description: "Filter: 'To Do', 'In Progress', 'Review', 'Done', or 'all'" },
                limit: { type: "number", description: "Max results (default: 50)" },
            },
        },
    },
    {
        name: "create_task",
        description: "Create a new task in Notion",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Task title (required)" },
                status: { type: "string", description: "Status: 'To Do', 'In Progress', 'Review', 'Done'" },
                priority: { type: "string", description: "Priority: 'Low', 'Medium', 'High', 'Urgent'" },
                dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
                description: { type: "string", description: "Task description" },
                assignee: { type: "string", description: "Assignee name" },
                tags: { type: "string", description: "Comma-separated tags" },
            },
            required: ["title"],
        },
    },
    {
        name: "update_task",
        description: "Update an existing task by ID",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string", description: "Notion page ID (required)" },
                title: { type: "string", description: "New title" },
                status: { type: "string", description: "New status" },
                priority: { type: "string", description: "New priority" },
                dueDate: { type: "string", description: "New due date (YYYY-MM-DD)" },
            },
            required: ["pageId"],
        },
    },
    {
        name: "delete_task",
        description: "Delete (archive) a task by ID",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string", description: "Notion page ID to delete" },
            },
            required: ["pageId"],
        },
    },
    // ============ RECURRING TASKS ============
    {
        name: "list_recurring_tasks",
        description: "List recurring tasks. Can filter by frequency.",
        inputSchema: {
            type: "object",
            properties: {
                frequency: { type: "string", description: "Filter: 'Daily', 'Weekly', 'Monthly', 'Quarterly', or 'all'" },
                limit: { type: "number", description: "Max results (default: 50)" },
            },
        },
    },
    {
        name: "create_recurring_task",
        description: "Create a new recurring task",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Task title (required)" },
                frequency: { type: "string", description: "Frequency: 'Daily', 'Weekly', 'Monthly', 'Quarterly'" },
                status: { type: "string", description: "Status" },
                dueDate: { type: "string", description: "Next due date (YYYY-MM-DD)" },
                assignee: { type: "string", description: "Assignee name" },
            },
            required: ["title"],
        },
    },
    {
        name: "update_recurring_task",
        description: "Update a recurring task",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string", description: "Notion page ID (required)" },
                title: { type: "string" },
                frequency: { type: "string" },
                status: { type: "string" },
                dueDate: { type: "string" },
            },
            required: ["pageId"],
        },
    },
    // ============ ORDERS ============
    {
        name: "list_orders",
        description: "List all orders. Can filter by fulfillment status.",
        inputSchema: {
            type: "object",
            properties: {
                fulfillment: { type: "string", description: "Filter: 'Fulfilled', 'Unfulfilled', or 'all'" },
                payment: { type: "string", description: "Filter: 'Paid', 'Pending', 'Refunded', or 'all'" },
                limit: { type: "number", description: "Max results (default: 50)" },
            },
        },
    },
    {
        name: "update_order",
        description: "Update an order (e.g., mark as fulfilled)",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string", description: "Notion page ID (required)" },
                fulfillment: { type: "string", description: "New fulfillment status" },
                payment: { type: "string", description: "New payment status" },
            },
            required: ["pageId"],
        },
    },
    // ============ ESSENTIALS ============
    {
        name: "list_essentials",
        description: "List essential items (tools, milestones, resources)",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Filter by type: 'Tool', 'Milestone', 'Strategy', 'Resource', 'Partnership', 'Achievement'" },
                limit: { type: "number" },
            },
        },
    },
    {
        name: "create_essential",
        description: "Create a new essential item",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Title (required)" },
                type: { type: "string", description: "Type: 'Tool', 'Milestone', 'Strategy', 'Resource', 'Partnership', 'Achievement'" },
                priority: { type: "string", description: "Priority: 'Critical', 'High', 'Medium'" },
                description: { type: "string" },
                url: { type: "string", description: "Related URL" },
            },
            required: ["title"],
        },
    },
    {
        name: "update_essential",
        description: "Update an essential item",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string", description: "Notion page ID (required)" },
                title: { type: "string" },
                type: { type: "string" },
                priority: { type: "string" },
                description: { type: "string" },
            },
            required: ["pageId"],
        },
    },
    {
        name: "delete_essential",
        description: "Delete an essential item",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string", description: "Notion page ID" },
            },
            required: ["pageId"],
        },
    },
    // ============ DOCUMENTS ============
    {
        name: "list_documents",
        description: "List all document links",
        inputSchema: {
            type: "object",
            properties: {
                category: { type: "string", description: "Filter by category" },
                limit: { type: "number" },
            },
        },
    },
    {
        name: "create_document",
        description: "Add a new document/link",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Title (required)" },
                url: { type: "string", description: "URL (required)" },
                type: { type: "string", description: "Type: 'Notion', 'Google Drive', 'GitHub', etc." },
                category: { type: "string", description: "Category: 'Databases', 'Tools', 'Apps & Websites', 'Social Media', 'Documentation'" },
                description: { type: "string" },
            },
            required: ["title", "url"],
        },
    },
    {
        name: "delete_document",
        description: "Delete a document link",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string" },
            },
            required: ["pageId"],
        },
    },
    // ============ METRICS & GOALS ============
    {
        name: "list_metrics",
        description: "List input metrics (actions taken)",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Filter by metric type" },
                limit: { type: "number" },
            },
        },
    },
    {
        name: "create_metric",
        description: "Add a new metric entry",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Metric type (required)" },
                value: { type: "number", description: "Value (required)" },
                date: { type: "string", description: "Date (YYYY-MM-DD), defaults to today" },
            },
            required: ["type", "value"],
        },
    },
    {
        name: "list_goals",
        description: "List output goals (results achieved)",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Filter by goal type" },
                limit: { type: "number" },
            },
        },
    },
    {
        name: "create_goal",
        description: "Add a new goal entry",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Goal type (required)" },
                value: { type: "number", description: "Value (required)" },
                date: { type: "string", description: "Date (YYYY-MM-DD), defaults to today" },
            },
            required: ["type", "value"],
        },
    },
    // ============ FEEDBACK ============
    {
        name: "list_feedback",
        description: "List user feedback entries",
        inputSchema: {
            type: "object",
            properties: {
                limit: { type: "number" },
            },
        },
    },
    {
        name: "create_feedback",
        description: "Add new feedback",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Feedback title/summary (required)" },
                content: { type: "string", description: "Feedback content" },
                userName: { type: "string", description: "User who gave feedback" },
                type: { type: "string", description: "Type: 'Bug', 'Feature', 'Improvement', 'Other'" },
            },
            required: ["title"],
        },
    },
    // ============ PROJECT STATUS ============
    {
        name: "get_project_status",
        description: "Get a complete overview of the project: tasks, orders, metrics, essentials",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    // ============ RAW NOTION ACCESS ============
    {
        name: "notion_query",
        description: "Execute a raw query on any Notion database. For advanced use.",
        inputSchema: {
            type: "object",
            properties: {
                database: { type: "string", description: "Database name: 'tasks', 'orders', 'essentials', 'documents', 'metrics', 'goals', 'feedback', 'recurringTasks', 'sales', 'webAnalytics'" },
                filter: { type: "object", description: "Notion filter object" },
                sorts: { type: "array", description: "Notion sorts array" },
                limit: { type: "number" },
            },
            required: ["database"],
        },
    },
    {
        name: "notion_update_page",
        description: "Update any Notion page properties directly",
        inputSchema: {
            type: "object",
            properties: {
                pageId: { type: "string", description: "Notion page ID (required)" },
                properties: { type: "object", description: "Properties object in Notion format" },
            },
            required: ["pageId", "properties"],
        },
    },
    {
        name: "notion_create_page",
        description: "Create a page in any Notion database",
        inputSchema: {
            type: "object",
            properties: {
                database: { type: "string", description: "Database name (required)" },
                properties: { type: "object", description: "Properties object in Notion format (required)" },
            },
            required: ["database", "properties"],
        },
    },
];
// ============ TOOL IMPLEMENTATIONS ============
async function listFromDatabase(dbId, filter, limit = 50) {
    if (!notion || !dbId)
        return [];
    const response = await notion.databases.query({
        database_id: dbId,
        filter,
        page_size: Math.min(limit, 100),
    });
    return response.results;
}
async function createInDatabase(dbId, properties, children) {
    if (!notion || !dbId)
        throw new Error("Database not configured");
    return notion.pages.create({
        parent: { database_id: dbId },
        properties,
        children,
    });
}
async function updatePage(pageId, properties) {
    if (!notion)
        throw new Error("Notion not configured");
    return notion.pages.update({
        page_id: pageId,
        properties,
    });
}
async function deletePage(pageId) {
    if (!notion)
        throw new Error("Notion not configured");
    return notion.pages.update({
        page_id: pageId,
        archived: true,
    });
}
function formatTasks(pages) {
    if (pages.length === 0)
        return "No tasks found.";
    return pages.map((page, i) => {
        const p = page.properties;
        return `${i + 1}. ${getTextFromProperty(p.Name || p.Title || p.Task)}
   Status: ${getTextFromProperty(p.Status)} | Priority: ${getTextFromProperty(p.Priority)} | Due: ${getTextFromProperty(p["Due Date"] || p.Due)}
   ID: ${page.id}
   URL: ${page.url}`;
    }).join("\n\n");
}
function formatOrders(pages) {
    if (pages.length === 0)
        return "No orders found.";
    return pages.map((page, i) => {
        const p = page.properties;
        return `${i + 1}. Order #${getTextFromProperty(p.Order || p.Name)} - ${getTextFromProperty(p.Customer)}
   Total: $${getTextFromProperty(p["Total $"] || p.Total)} | Payment: ${getTextFromProperty(p.Payment)} | Fulfillment: ${getTextFromProperty(p.Fulfillment)}
   Date: ${getTextFromProperty(p.Date)}
   ID: ${page.id}`;
    }).join("\n\n");
}
function formatEssentials(pages) {
    if (pages.length === 0)
        return "No essentials found.";
    return pages.map((page, i) => {
        const p = page.properties;
        return `${i + 1}. ${getTextFromProperty(p.Name || p.Title)}
   Type: ${getTextFromProperty(p.Type)} | Priority: ${getTextFromProperty(p.Priority)}
   ID: ${page.id}`;
    }).join("\n\n");
}
function formatDocuments(pages) {
    if (pages.length === 0)
        return "No documents found.";
    return pages.map((page, i) => {
        const p = page.properties;
        return `${i + 1}. ${getTextFromProperty(p.Name || p.Title)}
   Type: ${getTextFromProperty(p.Type)} | Category: ${getTextFromProperty(p.Category || p.Section)}
   URL: ${getTextFromProperty(p.URL)}
   ID: ${page.id}`;
    }).join("\n\n");
}
function formatMetrics(pages) {
    if (pages.length === 0)
        return "No metrics found.";
    return pages.map((page, i) => {
        const p = page.properties;
        return `${i + 1}. ${getTextFromProperty(p.Type || p.Name)}: ${getTextFromProperty(p.Value || p.Number)} (${getTextFromProperty(p.Date)})`;
    }).join("\n");
}
async function getProjectStatus() {
    const results = ["🔐 MINIVAULT PROJECT STATUS\n"];
    // Tasks
    if (DATABASES.tasks) {
        try {
            const pages = await listFromDatabase(DATABASES.tasks, undefined, 100);
            const inProgress = pages.filter(p => getTextFromProperty(p.properties.Status) === "In Progress").length;
            const toDo = pages.filter(p => getTextFromProperty(p.properties.Status) === "To Do").length;
            const done = pages.filter(p => getTextFromProperty(p.properties.Status) === "Done").length;
            results.push(`📋 TASKS: ${pages.length} total | In Progress: ${inProgress} | To Do: ${toDo} | Done: ${done}`);
        }
        catch {
            results.push("📋 TASKS: Could not fetch");
        }
    }
    // Orders
    if (DATABASES.orders) {
        try {
            const pages = await listFromDatabase(DATABASES.orders, undefined, 100);
            const unfulfilled = pages.filter(p => getTextFromProperty(p.properties.Fulfillment) !== "Fulfilled").length;
            const revenue = pages.reduce((sum, p) => sum + (parseFloat(getTextFromProperty(p.properties["Total $"])) || 0), 0);
            results.push(`📦 ORDERS: ${pages.length} total | Unfulfilled: ${unfulfilled} | Revenue: $${revenue.toFixed(2)}`);
        }
        catch {
            results.push("📦 ORDERS: Could not fetch");
        }
    }
    // Essentials
    if (DATABASES.essentials) {
        try {
            const pages = await listFromDatabase(DATABASES.essentials, undefined, 100);
            results.push(`⭐ ESSENTIALS: ${pages.length} items`);
        }
        catch {
            results.push("⭐ ESSENTIALS: Could not fetch");
        }
    }
    // Recurring Tasks
    if (DATABASES.recurringTasks) {
        try {
            const pages = await listFromDatabase(DATABASES.recurringTasks, undefined, 100);
            results.push(`🔄 RECURRING TASKS: ${pages.length} items`);
        }
        catch {
            results.push("🔄 RECURRING TASKS: Could not fetch");
        }
    }
    return results.join("\n");
}
// Create and run server
const server = new Server({ name: "minivault-mcp-server", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        let result;
        switch (name) {
            // TASKS
            case "list_tasks": {
                const filter = args?.status && args.status !== "all"
                    ? { property: "Status", select: { equals: args.status } }
                    : undefined;
                const pages = await listFromDatabase(DATABASES.tasks, filter, args?.limit || 50);
                result = formatTasks(pages);
                break;
            }
            case "create_task": {
                const props = { Name: { title: [{ text: { content: args?.title } }] } };
                if (args?.status)
                    props.Status = { select: { name: args.status } };
                if (args?.priority)
                    props.Priority = { select: { name: args.priority } };
                if (args?.dueDate)
                    props["Due Date"] = { date: { start: args.dueDate } };
                if (args?.assignee)
                    props.Assignee = { rich_text: [{ text: { content: args.assignee } }] };
                if (args?.tags)
                    props.Tags = { multi_select: args.tags.split(",").map(t => ({ name: t.trim() })) };
                const children = args?.description ? [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: args.description } }] } }] : undefined;
                const page = await createInDatabase(DATABASES.tasks, props, children);
                result = `✅ Task created: ${args?.title}\nID: ${page.id}\nURL: ${page.url}`;
                break;
            }
            case "update_task": {
                const props = {};
                if (args?.title)
                    props.Name = { title: [{ text: { content: args.title } }] };
                if (args?.status)
                    props.Status = { select: { name: args.status } };
                if (args?.priority)
                    props.Priority = { select: { name: args.priority } };
                if (args?.dueDate)
                    props["Due Date"] = { date: { start: args.dueDate } };
                await updatePage(args?.pageId, props);
                result = `✅ Task updated: ${args?.pageId}`;
                break;
            }
            case "delete_task": {
                await deletePage(args?.pageId);
                result = `🗑️ Task deleted: ${args?.pageId}`;
                break;
            }
            // RECURRING TASKS
            case "list_recurring_tasks": {
                const filter = args?.frequency && args.frequency !== "all"
                    ? { property: "Frequency", select: { equals: args.frequency } }
                    : undefined;
                const pages = await listFromDatabase(DATABASES.recurringTasks, filter, args?.limit || 50);
                result = formatTasks(pages);
                break;
            }
            case "create_recurring_task": {
                const props = { Name: { title: [{ text: { content: args?.title } }] } };
                if (args?.frequency)
                    props.Frequency = { select: { name: args.frequency } };
                if (args?.status)
                    props.Status = { select: { name: args.status } };
                if (args?.dueDate)
                    props["Due Date"] = { date: { start: args.dueDate } };
                const page = await createInDatabase(DATABASES.recurringTasks, props);
                result = `✅ Recurring task created: ${args?.title}\nID: ${page.id}`;
                break;
            }
            case "update_recurring_task": {
                const props = {};
                if (args?.title)
                    props.Name = { title: [{ text: { content: args.title } }] };
                if (args?.frequency)
                    props.Frequency = { select: { name: args.frequency } };
                if (args?.status)
                    props.Status = { select: { name: args.status } };
                if (args?.dueDate)
                    props["Due Date"] = { date: { start: args.dueDate } };
                await updatePage(args?.pageId, props);
                result = `✅ Recurring task updated: ${args?.pageId}`;
                break;
            }
            // ORDERS
            case "list_orders": {
                let filter = undefined;
                if (args?.fulfillment && args.fulfillment !== "all") {
                    filter = { property: "Fulfillment", select: { equals: args.fulfillment } };
                }
                const pages = await listFromDatabase(DATABASES.orders, filter, args?.limit || 50);
                result = formatOrders(pages);
                break;
            }
            case "update_order": {
                const props = {};
                if (args?.fulfillment)
                    props.Fulfillment = { select: { name: args.fulfillment } };
                if (args?.payment)
                    props.Payment = { select: { name: args.payment } };
                await updatePage(args?.pageId, props);
                result = `✅ Order updated: ${args?.pageId}`;
                break;
            }
            // ESSENTIALS
            case "list_essentials": {
                const filter = args?.type && args.type !== "all"
                    ? { property: "Type", select: { equals: args.type } }
                    : undefined;
                const pages = await listFromDatabase(DATABASES.essentials, filter, args?.limit || 50);
                result = formatEssentials(pages);
                break;
            }
            case "create_essential": {
                const props = { Name: { title: [{ text: { content: args?.title } }] } };
                if (args?.type)
                    props.Type = { select: { name: args.type } };
                if (args?.priority)
                    props.Priority = { select: { name: args.priority } };
                if (args?.description)
                    props.Description = { rich_text: [{ text: { content: args.description } }] };
                if (args?.url)
                    props.URL = { url: args.url };
                const page = await createInDatabase(DATABASES.essentials, props);
                result = `✅ Essential created: ${args?.title}\nID: ${page.id}`;
                break;
            }
            case "update_essential": {
                const props = {};
                if (args?.title)
                    props.Name = { title: [{ text: { content: args.title } }] };
                if (args?.type)
                    props.Type = { select: { name: args.type } };
                if (args?.priority)
                    props.Priority = { select: { name: args.priority } };
                await updatePage(args?.pageId, props);
                result = `✅ Essential updated: ${args?.pageId}`;
                break;
            }
            case "delete_essential": {
                await deletePage(args?.pageId);
                result = `🗑️ Essential deleted: ${args?.pageId}`;
                break;
            }
            // DOCUMENTS
            case "list_documents": {
                const filter = args?.category
                    ? { property: "Section", select: { equals: args.category } }
                    : undefined;
                const pages = await listFromDatabase(DATABASES.documents, filter, args?.limit || 50);
                result = formatDocuments(pages);
                break;
            }
            case "create_document": {
                const props = {
                    Name: { title: [{ text: { content: args?.title } }] },
                    URL: { url: args?.url },
                };
                if (args?.type)
                    props.Type = { select: { name: args.type } };
                if (args?.category)
                    props.Section = { select: { name: args.category } };
                if (args?.description)
                    props.Description = { rich_text: [{ text: { content: args.description } }] };
                const page = await createInDatabase(DATABASES.documents, props);
                result = `✅ Document created: ${args?.title}\nID: ${page.id}`;
                break;
            }
            case "delete_document": {
                await deletePage(args?.pageId);
                result = `🗑️ Document deleted: ${args?.pageId}`;
                break;
            }
            // METRICS & GOALS
            case "list_metrics": {
                const pages = await listFromDatabase(DATABASES.metrics, undefined, args?.limit || 20);
                result = formatMetrics(pages);
                break;
            }
            case "create_metric": {
                const props = {
                    Type: { multi_select: [{ name: args?.type }] },
                    Value: { number: args?.value },
                    Date: { date: { start: args?.date || new Date().toISOString().split("T")[0] } },
                };
                const page = await createInDatabase(DATABASES.metrics, props);
                result = `✅ Metric created: ${args?.type} = ${args?.value}\nID: ${page.id}`;
                break;
            }
            case "list_goals": {
                const pages = await listFromDatabase(DATABASES.goals, undefined, args?.limit || 20);
                result = formatMetrics(pages);
                break;
            }
            case "create_goal": {
                const props = {
                    Type: { multi_select: [{ name: args?.type }] },
                    Value: { number: args?.value },
                    Date: { date: { start: args?.date || new Date().toISOString().split("T")[0] } },
                };
                const page = await createInDatabase(DATABASES.goals, props);
                result = `✅ Goal created: ${args?.type} = ${args?.value}\nID: ${page.id}`;
                break;
            }
            // FEEDBACK
            case "list_feedback": {
                const pages = await listFromDatabase(DATABASES.feedback, undefined, args?.limit || 20);
                result = pages.length === 0 ? "No feedback found." : pages.map((page, i) => {
                    const p = page.properties;
                    return `${i + 1}. ${getTextFromProperty(p.Name || p.Title)}\n   ${getTextFromProperty(p.Content || p.Description)}\n   ID: ${page.id}`;
                }).join("\n\n");
                break;
            }
            case "create_feedback": {
                const props = { Name: { title: [{ text: { content: args?.title } }] } };
                if (args?.content)
                    props.Content = { rich_text: [{ text: { content: args.content } }] };
                if (args?.userName)
                    props["User Name"] = { rich_text: [{ text: { content: args.userName } }] };
                if (args?.type)
                    props.Type = { select: { name: args.type } };
                const page = await createInDatabase(DATABASES.feedback, props);
                result = `✅ Feedback created: ${args?.title}\nID: ${page.id}`;
                break;
            }
            // PROJECT STATUS
            case "get_project_status": {
                result = await getProjectStatus();
                break;
            }
            // RAW NOTION ACCESS
            case "notion_query": {
                const dbId = DATABASES[args?.database];
                if (!dbId)
                    throw new Error(`Unknown database: ${args?.database}`);
                const pages = await listFromDatabase(dbId, args?.filter, args?.limit || 50);
                result = JSON.stringify(pages.map(p => ({ id: p.id, url: p.url, properties: p.properties })), null, 2);
                break;
            }
            case "notion_update_page": {
                await updatePage(args?.pageId, args?.properties);
                result = `✅ Page updated: ${args?.pageId}`;
                break;
            }
            case "notion_create_page": {
                const dbId = DATABASES[args?.database];
                if (!dbId)
                    throw new Error(`Unknown database: ${args?.database}`);
                const page = await createInDatabase(dbId, args?.properties);
                result = `✅ Page created in ${args?.database}\nID: ${page.id}\nURL: ${page.url}`;
                break;
            }
            default:
                result = `Unknown tool: ${name}`;
        }
        return { content: [{ type: "text", text: result }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `❌ Error: ${error.message}` }], isError: true };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MiniVault MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
