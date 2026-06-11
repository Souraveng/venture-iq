// lib/graph/vectorstore/collections.ts
import { VectorStoreClient } from "./client";
import { VectorMetadata, RetrievedKnowledge, CollectionName } from "./types";
import { VectorDocumentSchema, VectorMetadataSchema } from "./schema";
import { MetadataManager } from "./metadata";

export class CollectionManager {
  private client: VectorStoreClient;
  
  // List of valid collections
  public static readonly COLLECTIONS: CollectionName[] = [
    "market_intelligence",
    "competition_intelligence",
    "customer_intelligence",
    "financial_intelligence",
    "regulatory_intelligence",
    "technology_intelligence",
    "venture_analysis"
  ];

  constructor(client: VectorStoreClient) {
    this.client = client;
  }

  /**
   * Validates if a collection name is standard and supported.
   */
  public isValidCollection(name: string): name is CollectionName {
    return CollectionManager.COLLECTIONS.includes(name as CollectionName);
  }

  /**
   * Inserts or updates a document into a collection after validating metadata and document structure.
   */
  public async upsert(
    collectionName: CollectionName,
    id: string,
    content: string,
    rawMetadata: Partial<VectorMetadata>,
    embedding: number[]
  ): Promise<void> {
    if (!this.isValidCollection(collectionName)) {
      throw new Error(`Invalid collection name: ${collectionName}. Supported collections: ${CollectionManager.COLLECTIONS.join(", ")}`);
    }

    // Enrich and normalize metadata
    const metadata = MetadataManager.enrich(rawMetadata);

    // Validate using Zod
    const validationResult = VectorDocumentSchema.safeParse({ id, content, metadata });
    if (!validationResult.success) {
      throw new Error(`Vector Document validation failed: ${validationResult.error.message}`);
    }

    await this.client.upsert(collectionName, id, content, metadata, embedding);
  }

  /**
   * Updates an existing document in a collection. Employs the same underlying upsert operation,
   * but confirms validation first.
   */
  public async update(
    collectionName: CollectionName,
    id: string,
    content: string,
    rawMetadata: Partial<VectorMetadata>,
    embedding: number[]
  ): Promise<void> {
    // Just delegates to upsert, since upsert handles both inserts and updates safely
    await this.upsert(collectionName, id, content, rawMetadata, embedding);
  }

  /**
   * Deletes a document by ID from a specific collection.
   */
  public async delete(collectionName: CollectionName, id: string): Promise<void> {
    if (!this.isValidCollection(collectionName)) {
      throw new Error(`Invalid collection name: ${collectionName}`);
    }
    await this.client.delete(collectionName, id);
  }

  /**
   * Searches a collection using query embeddings and metadata filters.
   */
  public async search(
    collectionName: CollectionName,
    queryEmbedding: number[],
    limit: number = 3,
    filters?: Partial<VectorMetadata>
  ): Promise<RetrievedKnowledge[]> {
    if (!this.isValidCollection(collectionName)) {
      throw new Error(`Invalid collection name: ${collectionName}`);
    }

    // Validate metadata filters if provided
    if (filters) {
      const filterValidation = VectorMetadataSchema.partial().safeParse(filters);
      if (!filterValidation.success) {
        console.warn("Filters validation failed, proceeding with raw filters:", filterValidation.error.message);
      }
    }

    return await this.client.query(collectionName, queryEmbedding, limit, filters);
  }

  /**
   * Wipes a collection entirely
   */
  public async clearCollection(collectionName: CollectionName): Promise<void> {
    if (!this.isValidCollection(collectionName)) {
      throw new Error(`Invalid collection name: ${collectionName}`);
    }
    await this.client.dropCollection(collectionName);
  }
}
