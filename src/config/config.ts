export enum InternalServiceSlug {
  DATA_MASKING_SERVICE = "data-masking-service",
  EMBEDDING_SERVICE = "embedding-service",
  API_SERVICE = "api-service",
}

export const INTERNAL_SERVICE_KEYS: Record<InternalServiceSlug, string | undefined> = {
  [InternalServiceSlug.DATA_MASKING_SERVICE]: process.env.DATA_MASKING_SERVICE_KEY,
  [InternalServiceSlug.EMBEDDING_SERVICE]: process.env.EMBEDDING_SERVICE_KEY,
  [InternalServiceSlug.API_SERVICE]: undefined,
};
