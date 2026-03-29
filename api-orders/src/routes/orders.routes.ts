import { FastifyInstance } from 'fastify'
import {
  getOrdersHandler,
  createOrderHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler
} from '../handlers/orders.handler'

export async function ordersRoutes(app: FastifyInstance) {
  app.get('/orders', getOrdersHandler)
  app.post('/orders', createOrderHandler)
  app.get('/orders/:id', getOrderByIdHandler)
  app.patch('/orders/:id/status', updateOrderStatusHandler)
}
