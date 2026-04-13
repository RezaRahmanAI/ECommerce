-- =============================================
-- Enable Query Store for SheraShopBD
-- =============================================
-- Use this script to enable Query Store on your production database.
-- Query Store automatically captures a history of queries, plans, and runtime statistics.

-- 1. Ensure you are on the correct database
-- USE sherashopbd_db; 

-- 2. Enable Query Store
ALTER DATABASE CURRENT 
SET QUERY_STORE = ON (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    MAX_STORAGE_SIZE_MB = 100,
    INTERVAL_LENGTH_MINUTES = 60,
    SIZE_BASED_CLEANUP_MODE = AUTO,
    QUERY_CAPTURE_MODE = AUTO,
    MAX_PLANS_PER_QUERY = 200,
    WAIT_STATS_CAPTURE_MODE = ON
);

-- 3. Verify status
-- SELECT * FROM sys.database_query_store_options;
