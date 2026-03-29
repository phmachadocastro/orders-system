import { pool } from '../database/db'
import { randomUUID } from 'crypto'

/**
 * Lists orders with pagination.
 * @param page 1-based page number.
 * @param limit Number of records per page.
 * @returns Array of orders with numeric `total`.
 */
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

/**
 * Creates an order and all related items in a single transaction.
 * @param data Customer and items payload.
 * @returns Created order payload with generated `id`, computed `total`, and `pending` status.
 * @throws Re-throws database errors after transaction rollback.
 */
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

/**
 * Finds one order by id and loads all related items.
 * @param id Order UUID.
 * @returns Order with `items` and numeric totals, or `null` when no order exists.
 */
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

type UpdateStatusResult =
  | { type: 'not_found' }
  | { type: 'invalid_transition' }
  | {
      type: 'success'
      order: {
        id: string
        customer_name: string
        status: string
        total: number
        created_at: string
      }
    }

/**
 * Updates an order status enforcing business transition rules.
 * Rule: a `confirmed` order cannot be changed to `cancelled`.
 * @param id Order UUID.
 * @param status Target status.
 * @returns
 * - `{ type: 'not_found' }` when order does not exist
 * - `{ type: 'invalid_transition' }` when transition is forbidden
 * - `{ type: 'success', order }` when update succeeds
 */
export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled'
): Promise<UpdateStatusResult> {
  const current = await pool.query(`SELECT status FROM orders WHERE id = $1`, [id])

  if (current.rows.length === 0) return { type: 'not_found' }

  if (current.rows[0].status === 'confirmed' && status === 'cancelled') {
    return { type: 'invalid_transition' }
  }

  const updated = await pool.query(
    `UPDATE orders
     SET status = $1
     WHERE id = $2
     RETURNING id, customer_name, status, total, created_at`,
    [status, id]
  )

  const row = updated.rows[0]

  return {
    type: 'success',
    order: { ...row, total: Number(row.total) }
  }
}
