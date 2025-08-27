#!/usr/bin/env python3
"""
Database Migration Script for Subscription Management

This script adds the subscription management tables to the existing database.
It includes:
- Updated Plan table with pricing tiers
- New Subscription table
- New FeatureControl table  
- New UsageTracking table
- New SubscriptionHistory table

Run this script to upgrade your database schema for subscription management.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.db.connection import config
from src.models import Base
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Run the subscription management migration"""
    
    try:
        # Create engine
        engine = create_engine(config.database_url)
        SessionLocal = sessionmaker(bind=engine)
        
        logger.info("🔄 Starting subscription management migration...")
        
        # Create all tables (this will add new ones, existing ones won't be affected)
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/updated successfully")
        
        # Create a session to run additional migrations
        session = SessionLocal()
        
        try:
            # Add new columns to existing Plan table if they don't exist
            migration_sql = """
            -- Add new pricing columns to Plan table if they don't exist
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='plan' AND column_name='quarterly_price') THEN
                    ALTER TABLE plan ADD COLUMN quarterly_price DECIMAL(10,2);
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='plan' AND column_name='yearly_price') THEN
                    ALTER TABLE plan ADD COLUMN yearly_price DECIMAL(10,2);
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='plan' AND column_name='max_farmers') THEN
                    ALTER TABLE plan ADD COLUMN max_farmers INTEGER DEFAULT 10;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='plan' AND column_name='max_buyers') THEN
                    ALTER TABLE plan ADD COLUMN max_buyers INTEGER DEFAULT 20;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='plan' AND column_name='data_retention_months') THEN
                    ALTER TABLE plan ADD COLUMN data_retention_months INTEGER DEFAULT 6;
                END IF;
                
                -- Rename existing columns if needed
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='plan' AND column_name='price') THEN
                    ALTER TABLE plan RENAME COLUMN price TO monthly_price;
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='plan' AND column_name='max_users') THEN
                    ALTER TABLE plan DROP COLUMN max_users;
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='plan' AND column_name='billing_cycle') THEN
                    ALTER TABLE plan DROP COLUMN billing_cycle;
                END IF;
            END $$;
            """
            
            session.execute(text(migration_sql))
            session.commit()
            logger.info("✅ Plan table migration completed")
            
            # Update existing plans with calculated pricing
            update_pricing_sql = """
            UPDATE plan 
            SET 
                quarterly_price = monthly_price * 3 * 0.95,
                yearly_price = monthly_price * 12 * 0.85
            WHERE quarterly_price IS NULL OR yearly_price IS NULL;
            """
            
            session.execute(text(update_pricing_sql))
            session.commit()
            logger.info("✅ Plan pricing updated")
            
            # Create default feature controls for existing shops
            create_default_controls_sql = """
            INSERT INTO feature_control (shop_id, feature_name, is_enabled, limit_value, limit_type)
            SELECT 
                s.id as shop_id,
                feature_data.feature_name,
                true as is_enabled,
                feature_data.limit_value,
                feature_data.limit_type::varchar
            FROM shop s
            CROSS JOIN (
                VALUES 
                    ('farmer_creation', 10, 'count'),
                    ('buyer_creation', 20, 'count'),
                    ('data_retention', 6, 'months'),
                    ('monthly_transactions', 1000, 'count')
            ) AS feature_data(feature_name, limit_value, limit_type)
            WHERE NOT EXISTS (
                SELECT 1 FROM feature_control fc 
                WHERE fc.shop_id = s.id AND fc.feature_name = feature_data.feature_name
            );
            """
            
            session.execute(text(create_default_controls_sql))
            session.commit()
            logger.info("✅ Default feature controls created for existing shops")
            
        except Exception as e:
            session.rollback()
            logger.error(f"❌ Migration failed: {str(e)}")
            raise
        finally:
            session.close()
        
        logger.info("🎉 Subscription management migration completed successfully!")
        
        # Print summary
        print("\n" + "="*60)
        print("📊 SUBSCRIPTION MANAGEMENT MIGRATION SUMMARY")
        print("="*60)
        print("✅ New tables created:")
        print("   - subscription")
        print("   - feature_control") 
        print("   - usage_tracking")
        print("   - subscription_history")
        print()
        print("✅ Plan table updated:")
        print("   - Added quarterly_price, yearly_price columns")
        print("   - Added max_farmers, max_buyers columns")
        print("   - Added data_retention_months column")
        print("   - Renamed price -> monthly_price")
        print()
        print("✅ Default feature controls created for existing shops")
        print()
        print("🚀 Your system now supports:")
        print("   - Flexible billing cycles (monthly/quarterly/yearly)")
        print("   - Granular feature controls per shop")
        print("   - Usage tracking and analytics")
        print("   - Subscription lifecycle management")
        print()
        print("📡 New API endpoints available at /api/v1/subscriptions")
        print("="*60)
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
