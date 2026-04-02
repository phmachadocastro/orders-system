import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function parsePort(value: string): number {
  const port = Number(value)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid DB_PORT: ${value}`)
  }

  return port
}

export const pool = new Pool({
  host: getRequiredEnv('DB_HOST'),
  port: parsePort(getRequiredEnv('DB_PORT')),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_NAME')
})
