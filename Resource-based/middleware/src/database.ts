import mysql from "mysql2/promise";
import { DatabaseConfig, QueryRequest, QueryResponse } from "./types";

export class DatabaseManager {
  private connections: Map<string, mysql.Connection> = new Map();

  /**
   * Initialize connection to a database shard
   */
  async initializeConnection(config: DatabaseConfig): Promise<void> {
    const connectionId = this.getConnectionId(config);

    try {
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
      });

      this.connections.set(connectionId, connection);
      console.log(`✅ Connected to database shard: ${connectionId}`);
    } catch (error) {
      console.error(
        `❌ Failed to connect to database shard: ${connectionId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Execute a query on a specific database shard
   */
  async executeQuery(
    config: DatabaseConfig,
    request: QueryRequest
  ): Promise<QueryResponse> {
    const connectionId = this.getConnectionId(config);
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return {
        success: false,
        error: `No connection found for shard: ${connectionId}`,
        shardId: connectionId,
      };
    }

    try {
      const [rows] = await connection.execute(
        request.query,
        request.params || []
      );

      return {
        success: true,
        data: rows,
        shardId: connectionId,
      };
    } catch (error) {
      console.error(`Query failed on shard ${connectionId}:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown database error",
        shardId: connectionId,
      };
    }
  }

  /**
   * Execute a query across all connected shards (for aggregation queries)
   */
  async executeQueryOnAllShards(
    configs: DatabaseConfig[],
    request: QueryRequest
  ): Promise<QueryResponse[]> {
    const promises = configs.map((config) =>
      this.executeQuery(config, request)
    );
    return Promise.all(promises);
  }

  /**
   * Check health of a database connection
   */
  async checkHealth(config: DatabaseConfig): Promise<boolean> {
    const connectionId = this.getConnectionId(config);
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return false;
    }

    try {
      await connection.execute("SELECT 1");
      return true;
    } catch (error) {
      console.error(`Health check failed for shard ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Close all database connections
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(
      (connection) =>
        connection
          .end()
          .catch((error) => console.error("Error closing connection:", error))
    );

    await Promise.all(closePromises);
    this.connections.clear();
    console.log("🔌 All database connections closed");
  }

  /**
   * Generate a unique connection ID for a database config
   */
  private getConnectionId(config: DatabaseConfig): string {
    return `${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Get all active connection IDs
   */
  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }
}
