import { DatabaseConfig } from "./types";

export class ShardingManager {
  private shards: DatabaseConfig[];

  constructor(shards: DatabaseConfig[]) {
    this.shards = shards;
  }

  /**
   * Determine which shard to use based on a key (poll ID, user ID, etc.)
   * Uses simple hash-based sharding
   */
  getShardForKey(key: string): DatabaseConfig {
    if (this.shards.length === 0) {
      throw new Error("No shards configured");
    }

    // Simple hash function
    const hash = this.hashString(key);
    const shardIndex = hash % this.shards.length;

    return this.shards[shardIndex];
  }

  /**
   * Get all shards (for operations that need to query all databases)
   */
  getAllShards(): DatabaseConfig[] {
    return [...this.shards];
  }

  /**
   * Get shard by index
   */
  getShardByIndex(index: number): DatabaseConfig {
    if (index < 0 || index >= this.shards.length) {
      throw new Error(`Invalid shard index: ${index}`);
    }
    return this.shards[index];
  }

  /**
   * Simple hash function for string keys
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get the number of configured shards
   */
  getShardCount(): number {
    return this.shards.length;
  }
}
