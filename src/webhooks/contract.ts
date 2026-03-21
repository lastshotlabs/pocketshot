export const webhooksContract = {
  listEndpoints: {
    method: 'GET' as const,
    path: '/webhooks/endpoints',
  },
  getEndpoint: {
    method: 'GET' as const,
    path: '/webhooks/endpoints/:endpointId',
  },
  createEndpoint: {
    method: 'POST' as const,
    path: '/webhooks/endpoints',
  },
  updateEndpoint: {
    method: 'PATCH' as const,
    path: '/webhooks/endpoints/:endpointId',
  },
  deleteEndpoint: {
    method: 'DELETE' as const,
    path: '/webhooks/endpoints/:endpointId',
  },
  listDeliveries: {
    method: 'GET' as const,
    path: '/webhooks/endpoints/:endpointId/deliveries',
  },
  getDelivery: {
    method: 'GET' as const,
    path: '/webhooks/deliveries/:deliveryId',
  },
  testEndpoint: {
    method: 'POST' as const,
    path: '/webhooks/endpoints/:endpointId/test',
  },
} as const
