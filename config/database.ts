import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'primary',

  connections: {
    // Base de données principale (données non sensibles)
    primary: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: Number(env.get('DB_PORT')),
        user: env.get('DB_APP_USER'),
        password: env.get('DB_APP_PASSWORD'),
        database: env.get('DB_APP_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations/primary'],
        disableRollbacksInProduction: true,
      },
      // ... reste de la configuration
    },

    // Base de données sécurisée (données sensibles)
    secure: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: Number(env.get('DB_PORT')),
        user: env.get('DB_SECURE_USER'),
        password: env.get('DB_SECURE_PASSWORD'),
        database: env.get('DB_SECURE_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations/secure'],
        disableRollbacksInProduction: true,
      },
      // ... reste de la configuration
    },

    // Base de données d'audit (logs)
    audit: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: Number(env.get('DB_PORT')),
        user: env.get('DB_AUDIT_USER'),
        password: env.get('DB_AUDIT_PASSWORD'),
        database: env.get('DB_AUDIT_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations/audit'],
        disableRollbacksInProduction: true,
      },
      // ... reste de la configuration
    },
  },
})

export default dbConfig
