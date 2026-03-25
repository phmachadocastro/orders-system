import { FastifyInstance } from 'fastify'
import { getOrdersHandler } from '../handlers/orders.handler'

export async function ordersRoutes(app: FastifyInstance) {
  app.get('/orders', getOrdersHandler)
}
