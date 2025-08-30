-- Create enums
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'completion_status') THEN CREATE TYPE completion_status AS ENUM ('incomplete', 'complete'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN CREATE TYPE record_status AS ENUM ('active', 'inactive'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN CREATE TYPE payment_type AS ENUM ('full', 'partial', 'advance'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'farmer_payment_type') THEN CREATE TYPE farmer_payment_type AS ENUM ('advance', 'settlement', 'bonus'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_status') THEN CREATE TYPE credit_status AS ENUM ('pending', 'approved', 'rejected'); END IF; END $$;

-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shop(id),
    buyer_user_id INTEGER NOT NULL REFERENCES users(id),
    parent_transaction_id INTEGER REFERENCES transactions(id),
    type VARCHAR(20) NOT NULL DEFAULT 'sale',
    status transaction_status NOT NULL DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    buyer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
    farmer_paid_amount DECIMAL(12,2) DEFAULT 0.00,
    commission_confirmed BOOLEAN DEFAULT false,
    completion_status completion_status NOT NULL DEFAULT 'incomplete',
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create transaction_items table
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    farmer_stock_id INTEGER REFERENCES farmer_stock(id),
    quantity DECIMAL(10,3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create credits table
CREATE TABLE credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    status credit_status NOT NULL DEFAULT 'pending',
    record_status record_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_methods table
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    credit_id INTEGER REFERENCES credits(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
    type payment_type NOT NULL,
    status record_status DEFAULT 'active',
    date DATE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create farmer_payments table
CREATE TABLE farmer_payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    farmer_stock_id INTEGER REFERENCES farmer_stock(id),
    farmer_user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_type farmer_payment_type NOT NULL,
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
    remarks TEXT,
    date DATE NOT NULL,
    reference_number VARCHAR(100),
    approved_by INTEGER REFERENCES users(id),
    status record_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
