import { FastifyRequest, FastifyReply } from 'fastify'
import { getOrders, createOrder } from '../services/orders.service'
import { createOrderSchema } from '../schemas/orders.schema'

export async function getOrdersHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { page = 1, limit = 10 } = request.query as any

  const orders = await getOrders(Number(page), Number(limit))

  return reply.send(orders)
}

export async function createOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const parsed = createOrderSchema.safeParse(request.body)

  if (!parsed.success) {
    return reply.status(400).send({
      error: 'Invalid request',
      details: parsed.error.format()
    })
  }

  const order = await createOrder(parsed.data)

  return reply.status(201).send(order)
}
