INSERT INTO users (
    username,
    password_hash,
    role,
    email,
    contact,
    credit_limit,
    record_status,
    created_at,
    updated_at
) VALUES (
    'superadmin',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- SHA256 for 'admin123'
    'superadmin',
    'admin@kisaancenter.com',
    '+91-9876543210',
    0.00,
    'active',
    NOW(),
    NOW()
);