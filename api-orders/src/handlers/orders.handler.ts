import { FastifyRequest, FastifyReply } from 'fastify'

export async function getOrdersHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.send([
    { id: 1, customer_name: 'Pedro' }
  ])
}
