-- Sample SQL queries for your database

-- 1. Show all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- 2. View all crops
SELECT * FROM crops ORDER BY category, name;

-- 3. Check table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- 4. Show table row counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins AS "inserts",
    n_tup_upd AS "updates",
    n_tup_del AS "deletes",
    n_live_tup AS "live_tuples"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Sample data from each table
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'crops', COUNT(*) FROM crops
UNION ALL  
SELECT 'listings', COUNT(*) FROM listings
UNION ALL
SELECT 'bids', COUNT(*) FROM bids
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'escrow_accounts', COUNT(*) FROM escrow_accounts
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'financial_records', COUNT(*) FROM financial_records
ORDER BY table_name;
