import { pool } from '../database/db'
import { randomUUID } from 'crypto'

export async function getOrders(page: number, limit: number) {
  const offset = (page - 1) * limit

  const result = await pool.query(
    `SELECT * FROM orders
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )

  return result.rows.map((order: any) => ({
    ...order,
    total: Number(order.total)
  }))
}

export async function createOrder(data: any) {
  const total = data.items.reduce((acc: number, item: any) => {
    return acc + item.quantity * item.unit_price
  }, 0)

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const orderId = randomUUID()

    await client.query(
      `INSERT INTO orders (id, customer_name, status, total)
       VALUES ($1, $2, $3, $4)`,
      [orderId, data.customer_name, 'pending', total]
    )

    for (const item of data.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product, item.quantity, item.unit_price]
      )
    }

    await client.query('COMMIT')

    return {
      id: orderId,
      ...data,
      total,
      status: 'pending'
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getOrderById(id: string) {
  const orderResult = await pool.query(
    `SELECT id, customer_name, status, total, created_at
     FROM orders
     WHERE id = $1`,
    [id]
  )

  if (orderResult.rows.length === 0) {
    return null
  }

  const itemsResult = await pool.query(
    `SELECT product, quantity, unit_price
     FROM order_items
     WHERE order_id = $1
     ORDER BY id ASC`,
    [id]
  )

  const order = orderResult.rows[0]

  return {
    ...order,
    total: Number(order.total),
    items: itemsResult.rows.map((item: any) => ({
      ...item,
      unit_price: Number(item.unit_price)
    }))
  }
}
