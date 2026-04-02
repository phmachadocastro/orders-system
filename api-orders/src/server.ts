import Fastify from 'fastify'
import dotenv from 'dotenv'
import { ordersRoutes } from './routes/orders.routes'

dotenv.config()

const port = Number(process.env.PORT)

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('Missing or invalid PORT environment variable')
}

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
    await app.listen({ port })
    console.log(`Server running on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
