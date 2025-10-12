export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface ShardingConfig {
  shards: DatabaseConfig[];
  shardingStrategy: "hash" | "range";
}

export interface DatabaseConnection {
  id: string;
  config: DatabaseConfig;
  isHealthy: boolean;
  lastHealthCheck: Date;
}

export interface QueryRequest {
  query: string;
  params?: any[];
  shardKey?: string;
}

export interface QueryResponse {
  success: boolean;
  data?: any;
  error?: string;
  shardId?: string;
}
