/**
 * Database Initializer
 * Automatically creates the database if it doesn't exist
 * @spec FEAT-001
 */

import { Logger } from '@nestjs/common';
import { Client } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Parse DATABASE_URL to extract connection parameters
 */
function parseDatabaseUrl(url: string): DatabaseConfig {
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${url}`);
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

/**
 * Create database if it doesn't exist
 */
export async function ensureDatabaseExists(): Promise<void> {
  const logger = new Logger('DatabaseInitializer');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.warn('DATABASE_URL not set, skipping database auto-creation');
    return;
  }

  let config: DatabaseConfig;
  try {
    config = parseDatabaseUrl(databaseUrl);
  } catch (error) {
    logger.warn(`Failed to parse DATABASE_URL: ${error}`);
    return;
  }

  const { database, ...connectionConfig } = config;

  // Connect to default 'postgres' database to check/create target database
  const client = new Client({
    ...connectionConfig,
    database: 'postgres',
  });

  try {
    await client.connect();
    logger.log(`Checking if database '${database}' exists...`);

    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );

    if (result.rows.length === 0) {
      logger.log(`Database '${database}' does not exist. Creating...`);

      // Create database (database names cannot be parameterized, but we validate the name)
      const safeDatabaseName = database.replace(/[^a-zA-Z0-9_]/g, '_');
      await client.query(`CREATE DATABASE "${safeDatabaseName}"`);

      logger.log(`Database '${database}' created successfully`);
    } else {
      logger.log(`Database '${database}' already exists`);
    }
  } catch (error) {
    // If we can't connect to postgres database or create, log warning but don't fail
    // The application might still work if database already exists
    logger.warn(`Database initialization warning: ${error}`);
  } finally {
    await client.end();
  }
}
