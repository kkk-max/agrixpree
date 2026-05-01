const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'AgriXpree API', version: '1.0.0', description: 'AgriXpree Agricultural Marketplace API' },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/modules/**/*.swagger.js', './src/modules/**/*.routes.js']
};

module.exports = swaggerJsdoc(options);
