import { ApiReference } from '@scalar/nextjs-api-reference'
import { scalarConfig } from './config'

export const GET = ApiReference({
  ...scalarConfig,
  url: '/openapi.es.json',
})
