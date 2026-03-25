import Fastify from 'fastify'
import { ordersRoutes } from './routes/orders.routes'

const app = Fastify({
  logger: true
})

app.register(ordersRoutes)

app.get('/', async () => {
  return { message: 'API rodando 🚀' }
})

// start server
const start = async () => {
  try {
    await app.listen({ port: 3000 })
    console.log('Server running on http://localhost:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
