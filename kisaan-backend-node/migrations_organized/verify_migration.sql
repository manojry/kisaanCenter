-- Verify migration completed successfully
SELECT 'Migration verification' as check_type;

-- Check new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'kisaan_transactions' 
AND column_name IN ('type', 'payment_method', 'notes');

-- Verify constraints
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transactions%';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'kisaan_transactions' 
AND indexname LIKE 'idx_transactions%';

-- Verify data integrity
SELECT status, COUNT(*) as count 
FROM kisaan_transactions 
GROUP BY status;