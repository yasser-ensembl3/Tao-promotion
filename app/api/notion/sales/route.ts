import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "NOTION_TOKEN not configured" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const databaseId = searchParams.get("databaseId")

    if (!databaseId) {
      return NextResponse.json(
        { error: "Missing databaseId parameter" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Query Notion database
    const response = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 100,
        }),
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Notion API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Parse and format the results
    const sales = data.results.map((page: any) => {
      const properties = page.properties

      // Get product name
      const nameProp = properties.Product || properties.Name || properties.Title || properties.product || properties.name
      const product = nameProp?.title?.[0]?.plain_text ||
                     nameProp?.rich_text?.[0]?.plain_text ||
                     "Untitled"

      // Get amount
      const amountProp = properties.Amount || properties.Price || properties.amount || properties.price
      const amount = amountProp?.number ||
                    (amountProp?.rich_text?.[0]?.plain_text ? parseFloat(amountProp.rich_text[0].plain_text) : null) ||
                    null

      // Get date
      const dateProp = properties.Date || properties.date || properties["Sale Date"]
      const date = dateProp?.date?.start || null

      // Get customer
      const customerProp = properties.Customer || properties.customer || properties.Client
      const customer = customerProp?.rich_text?.[0]?.plain_text || null

      // Get status
      const statusProp = properties.Status || properties.status
      const status = statusProp?.status?.name ||
                    statusProp?.select?.name ||
                    statusProp?.rich_text?.[0]?.plain_text ||
                    "Pending"

      return {
        id: page.id,
        product,
        amount,
        date,
        customer,
        status,
        url: page.url,
      }
    })

    return NextResponse.json({ sales })
  } catch (error: any) {
    console.error("[Notion Sales API] Error fetching sales:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales from Notion" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const notionToken = process.env.NOTION_TOKEN

    if (!notionToken) {
      return NextResponse.json(
        { error: "Notion integration token not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { databaseId, product, amount, date, customer, status } = body

    console.log("[Notion Sales API] POST request received:", {
      product,
      amount,
      date,
      customer,
      status
    })

    if (!databaseId || !product) {
      return NextResponse.json(
        { error: "Missing required fields: databaseId and product" },
        { status: 400 }
      )
    }

    const cleanDatabaseId = databaseId.replace(/-/g, "")

    // Get database schema to know which properties exist
    const schemaResponse = await fetch(
      `https://api.notion.com/v1/databases/${cleanDatabaseId}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    )

    let hasAmountProperty = false
    let hasDateProperty = false
    let hasCustomerProperty = false
    let hasStatusProperty = false
    let productPropertyName = "Product"
    let amountPropertyName = "Amount"
    let datePropertyName = "Date"
    let customerPropertyName = "Customer"
    let statusPropertyName = "Status"

    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json()
      const properties = schemaData.properties || {}

      console.log("[Notion Sales API] Database schema properties:", Object.keys(properties))

      // Find the product property
      if (properties["Product"]) productPropertyName = "Product"
      else if (properties["Name"]) productPropertyName = "Name"
      else if (properties["Title"]) productPropertyName = "Title"
      else if (properties["product"]) productPropertyName = "product"

      // Find amount property
      if (properties["Amount"]) {
        amountPropertyName = "Amount"
        hasAmountProperty = true
      } else if (properties["Price"]) {
        amountPropertyName = "Price"
        hasAmountProperty = true
      } else if (properties["amount"]) {
        amountPropertyName = "amount"
        hasAmountProperty = true
      }

      // Find date property
      if (properties["Date"]) {
        datePropertyName = "Date"
        hasDateProperty = true
      } else if (properties["Sale Date"]) {
        datePropertyName = "Sale Date"
        hasDateProperty = true
      } else if (properties["date"]) {
        datePropertyName = "date"
        hasDateProperty = true
      }

      // Find customer property
      if (properties["Customer"]) {
        customerPropertyName = "Customer"
        hasCustomerProperty = true
      } else if (properties["Client"]) {
        customerPropertyName = "Client"
        hasCustomerProperty = true
      } else if (properties["customer"]) {
        customerPropertyName = "customer"
        hasCustomerProperty = true
      }

      // Find status property
      if (properties["Status"]) {
        statusPropertyName = "Status"
        hasStatusProperty = true
      } else if (properties["status"]) {
        statusPropertyName = "status"
        hasStatusProperty = true
      }

      console.log("[Notion Sales API] Property checks:", {
        hasAmountProperty,
        hasDateProperty,
        hasCustomerProperty,
        hasStatusProperty
      })
    }

    // Build properties object
    const properties: any = {
      [productPropertyName]: {
        title: [
          {
            text: {
              content: product,
            },
          },
        ],
      },
    }

    if (amount && hasAmountProperty) {
      properties[amountPropertyName] = {
        number: amount,
      }
    }

    if (date && hasDateProperty) {
      properties[datePropertyName] = {
        date: {
          start: date,
        },
      }
    }

    if (customer && hasCustomerProperty) {
      properties[customerPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: customer,
            },
          },
        ],
      }
    }

    if (status && hasStatusProperty) {
      properties[statusPropertyName] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: status,
            },
          },
        ],
      }
    }

    // Create new sale page
    const createResponse = await fetch(
      `https://api.notion.com/v1/pages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: {
            type: "database_id",
            database_id: cleanDatabaseId,
          },
          properties,
        }),
      }
    )

    if (!createResponse.ok) {
      const error = await createResponse.json()
      console.error("[Notion Sales API] Create error:", error)
      console.error("[Notion Sales API] Properties sent:", JSON.stringify(properties, null, 2))
      return NextResponse.json(
        {
          error: error.message || "Failed to create sale",
          details: error,
        },
        { status: createResponse.status }
      )
    }

    const newSale = await createResponse.json()

    return NextResponse.json({
      success: true,
      sale: {
        id: newSale.id,
        url: newSale.url,
      },
    })
  } catch (error) {
    console.error("[Notion Sales API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
