-- ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'farmer', 'buyer', 'employee');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN
        CREATE TYPE record_status AS ENUM ('active', 'inactive', 'deleted');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM ('full_payment', 'partial_payment', 'advance');
    END IF;
END$$;

-- USERS table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role user_role NOT NULL,
    shop_id INTEGER,
    password_hash VARCHAR(255),
    contact VARCHAR(50),
    email VARCHAR(255),
    credit_limit NUMERIC(12,2),
    record_status record_status DEFAULT 'active',
    created_by INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- SHOPS table
CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    location VARCHAR(255),
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    record_status record_status DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    price NUMERIC(12,2),
    shop_id INTEGER REFERENCES shops(id),
    record_status record_status DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- SHOP_PRODUCTS
CREATE TABLE shop_products (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id),
    product_id INTEGER REFERENCES products(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- FARMER_STOCK
CREATE TABLE farmer_stock (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES users(id),
    shop_id INTEGER REFERENCES shops(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER,
    record_status record_status DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- TRANSACTIONS
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id),
    buyer_id INTEGER REFERENCES users(id),
    transaction_type VARCHAR(20),
    commission_rate NUMERIC(5,2),
    status transaction_status,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- TRANSACTION_ITEMS
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id),
    product_id INTEGER REFERENCES products(id),
    farmer_stock_id INTEGER REFERENCES farmer_stock(id),
    quantity INTEGER,
    price NUMERIC(12,2)
);

-- PAYMENTS
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id),
    amount NUMERIC(12,2),
    payment_type payment_type,
    status payment_status,
    created_at TIMESTAMP
);

-- CREDITS
CREATE TABLE credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    shop_id INTEGER REFERENCES shops(id),
    amount NUMERIC(12,2),
    status VARCHAR(20),
    created_at TIMESTAMP
);

-- Add deferred foreign keys
ALTER TABLE users ADD CONSTRAINT fk_users_shop_id FOREIGN KEY (shop_id) REFERENCES shops(id);
ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id);
