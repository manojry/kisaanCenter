-- Create plans table
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    quarterly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2),
    max_farmers INTEGER NOT NULL,
    max_buyers INTEGER NOT NULL,
    max_transactions INTEGER NOT NULL,
    data_retention_months INTEGER NOT NULL,
    features JSONB,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create shop table
CREATE TABLE shop (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    contact VARCHAR(15),
    commission_rate DECIMAL(5,2) NOT NULL,
    owner_id INTEGER,
    plan_id INTEGER NOT NULL,
    plan_start_date DATE,
    plan_end_date DATE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    contact VARCHAR(15),
    shop_id INTEGER,
    credit_limit DECIMAL(12,2),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES shop(id)
);

ALTER TABLE shop
    ADD CONSTRAINT fk_shop_owner_id FOREIGN KEY (owner_id) REFERENCES users(id);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER,
    price DECIMAL(10,2),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create transaction_items table
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    farmer_stock_id INTEGER,
    quantity DECIMAL(10,3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (farmer_stock_id) REFERENCES farmer_stock(id)
);
