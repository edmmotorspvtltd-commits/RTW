/**
 * ============================================================
 * DATABASE CONFIGURATION
 * ============================================================
 * PostgreSQL connection configuration with pooling
 * Handles database connections, queries, and transactions
 * ============================================================
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'rtwe_erp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', () => {
    if (process.env.DEBUG === 'true') {
        console.log('✓ Database connection established');
    }
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

pool.on('remove', () => {
    if (process.env.DEBUG === 'true') {
        console.log('⚠ Database connection removed from pool');
    }
});

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        if (process.env.SQL_LOGGING === 'true') {
            console.log('Executed query', {
                text,
                duration: `${duration}ms`,
                rows: res.rowCount
            });
        }

        return res;
    } catch (error) {
        console.error('Database query error:', {
            query: text,
            error: error.message
        });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Database client
 */
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout to release client
    const timeout = setTimeout(() => {
        console.error('❌ Client has been checked out for more than 5 seconds!');
    }, 5000);

    // Override release to clear timeout
    client.release = () => {
        clearTimeout(timeout);
        client.release = release;
        return release();
    };

    return client;
};

/**
 * Execute queries in a transaction
 * @param {function} callback - Callback function with queries
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as now, current_database() as database');
        console.log('✓ Database connection successful');
        console.log(`  Database: ${result.rows[0].database}`);
        console.log(`  Time: ${result.rows[0].now}`);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
const closePool = async () => {
    try {
        await pool.end();
        console.log('✓ Database pool closed');
    } catch (error) {
        console.error('❌ Error closing database pool:', error);
        throw error;
    }
};

/**
 * Get pool status
 * @returns {object} Pool statistics
 */
const getPoolStatus = () => {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
    };
};

/**
 * Execute a query with automatic retry
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} Query result
 */
const queryWithRetry = async (text, params, maxRetries = 3) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await query(text, params);
        } catch (error) {
            lastError = error;

            // Don't retry on certain errors
            if (error.code === '23505' || // Unique violation
                error.code === '23503' || // Foreign key violation
                error.code === '23502') { // Not null violation
                throw error;
            }

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                console.warn(`Query failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

/**
 * Bulk insert with conflict handling
 * @param {string} table - Table name
 * @param {array} columns - Column names
 * @param {array} values - Array of value arrays
 * @param {string} conflictColumn - Column to check for conflicts
 * @param {string} conflictAction - Action on conflict ('UPDATE' or 'NOTHING')
 * @returns {Promise} Insert result
 */
const bulkInsert = async (table, columns, values, conflictColumn = null, conflictAction = 'NOTHING') => {
    if (!values || values.length === 0) {
        return { rowCount: 0 };
    }

    const placeholders = values.map((_, rowIndex) => {
        const row = columns.map((_, colIndex) => {
            return `$${rowIndex * columns.length + colIndex + 1}`;
        }).join(', ');
        return `(${row})`;
    }).join(', ');

    const flatValues = values.flat();

    let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;

    if (conflictColumn && conflictAction === 'UPDATE') {
        const updateSet = columns
            .filter(col => col !== conflictColumn)
            .map(col => `${col} = EXCLUDED.${col}`)
            .join(', ');
        query += ` ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateSet}`;
    } else if (conflictColumn) {
        query += ` ON CONFLICT (${conflictColumn}) DO NOTHING`;
    }

    query += ' RETURNING *';

    return await queryWithRetry(query, flatValues);
};

/**
 * Helper to build WHERE clause from filters
 * @param {object} filters - Filter object
 * @param {number} startIndex - Starting parameter index
 * @returns {object} WHERE clause and parameters
 */
const buildWhereClause = (filters, startIndex = 1) => {
    const conditions = [];
    const params = [];
    let paramIndex = startIndex;

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
                conditions.push(`${key} = ANY($${paramIndex})`);
                params.push(value);
            } else if (typeof value === 'object' && value.operator) {
                conditions.push(`${key} ${value.operator} $${paramIndex}`);
                params.push(value.value);
            } else {
                conditions.push(`${key} = $${paramIndex}`);
                params.push(value);
            }
            paramIndex++;
        }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { whereClause, params, paramIndex };
};

/**
 * Paginate query results
 * @param {string} baseQuery - Base SQL query
 * @param {array} params - Query parameters
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} orderBy - Order by clause
 * @returns {Promise} Paginated results with metadata
 */
const paginate = async (baseQuery, params = [], page = 1, limit = 10, orderBy = 'id DESC') => {
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    const paginatedQuery = `${baseQuery} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const result = await query(paginatedQuery, [...params, limit, offset]);

    return {
        data: result.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

/**
 * Create Sequelize instance for ORM support (used by rapier-costing)
 */
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'RTwe',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
        pool: {
            max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
            min: 0,
            acquire: 30000,
            idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
        }
    }
);

module.exports = {
    query,
    getClient,
    transaction,
    testConnection,
    closePool,
    getPoolStatus,
    queryWithRetry,
    bulkInsert,
    buildWhereClause,
    paginate,
    pool,
    sequelize, // Sequelize ORM instance for rapier-costing
    Sequelize  // Sequelize class for models
};
