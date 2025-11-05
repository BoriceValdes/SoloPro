// lib/openapi.ts
import swaggerJsdoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SoloPro API',
      version: '0.3.0',
      description: 'API REST SoloPro (MVP, pg + JWT + PDF)'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  // 👇 très important : ça inclut TOUTES les routes TS sous app/api
  apis: ['app/api/**/*.ts']
})
