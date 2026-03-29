import { FastifyRequest, FastifyReply } from 'fastify'
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrderStatus
} from '../services/orders.service'
import {
  createOrderSchema,
  updateOrderStatusSchema
} from '../schemas/orders.schema'

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

export async function getOrderByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string }

  const order = await getOrderById(id)

  if (!order) {
    return reply.status(404).send({ error: 'Order not found' })
  }

  return reply.send(order)
}

export async function updateOrderStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string }
  const parsed = updateOrderStatusSchema.safeParse(request.body)

  if (!parsed.success) {
    return reply.status(400).send({
      error: 'Invalid request',
      details: parsed.error.format()
    })
  }

  const result = await updateOrderStatus(id, parsed.data.status)

  if (result.type === 'not_found') {
    return reply.status(404).send({ error: 'Order not found' })
  }

  if (result.type === 'invalid_transition') {
    return reply.status(409).send({ error: 'Cannot cancel a confirmed order' })
  }

  return reply.send(result.order)
}
