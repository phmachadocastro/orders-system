import { z } from 'zod'

export const orderItemSchema = z.object({
  product: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive()
})

export const createOrderSchema = z.object({
  customer_name: z.string(),
  items: z.array(orderItemSchema).min(1)
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled'])
})
