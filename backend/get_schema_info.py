#!/usr/bin/env python3
"""
Get complete schema information from the database
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import json
from datetime import datetime

import os
# Load DB config from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'sslmode': os.getenv('DB_SSLMODE', 'require')
}

def get_schema_info():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    schema_info = {}
    
    try:
        # Get all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)
        tables = cursor.fetchall()
        
        # Get enum types
        cursor.execute("""
            SELECT t.typname, e.enumlabel
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
        """)
        enums = cursor.fetchall()
        schema_info['enums'] = {}
        for enum_type, enum_value in enums:
            if enum_type not in schema_info['enums']:
                schema_info['enums'][enum_type] = []
            schema_info['enums'][enum_type].append(enum_value)
        
        # Get detailed table information
        schema_info['tables'] = {}
        for (table_name,) in tables:
            # Get columns
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default,
                       character_maximum_length, numeric_precision, numeric_scale
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = %s 
                ORDER BY ordinal_position
            """, (table_name,))
            columns = cursor.fetchall()
            
            # Get foreign keys
            cursor.execute("""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_schema = 'public'
                AND tc.table_name = %s
            """, (table_name,))
            foreign_keys = cursor.fetchall()
            
            # Get primary key
            cursor.execute("""
                SELECT c.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
                JOIN information_schema.columns AS c 
                    ON c.table_schema = tc.constraint_schema
                    AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
                WHERE constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = %s
            """, (table_name,))
            primary_keys = cursor.fetchall()
            
            # Get unique constraints
            cursor.execute("""
                SELECT ccu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
                WHERE tc.constraint_type = 'UNIQUE'
                AND tc.table_schema = 'public'
                AND tc.table_name = %s
            """, (table_name,))
            unique_constraints = cursor.fetchall()
            
            schema_info['tables'][table_name] = {
                'columns': [
                    {
                        'name': col[0],
                        'type': col[1],
                        'nullable': col[2] == 'YES',
                        'default': col[3],
                        'max_length': col[4],
                        'numeric_precision': col[5],
                        'numeric_scale': col[6]
                    } for col in columns
                ],
                'foreign_keys': [
                    {
                        'column': fk[0],
                        'references_table': fk[1],
                        'references_column': fk[2]
                    } for fk in foreign_keys
                ],
                'primary_keys': [pk[0] for pk in primary_keys],
                'unique_constraints': [uc[0] for uc in unique_constraints]
            }
        
        # Write to file
        with open('schema_info.json', 'w') as f:
            json.dump(schema_info, f, indent=2)
            
        # Generate markdown documentation
        with open('SCHEMA.md', 'w') as f:
            f.write('# Database Schema Documentation\n\n')
            f.write(f'Generated on: {datetime.now()}\n\n')
            
            # Document enums
            f.write('## Enums\n\n')
            for enum_name, values in schema_info['enums'].items():
                f.write(f'### {enum_name}\n')
                f.write('Possible values:\n')
                for value in values:
                    f.write(f'- {value}\n')
                f.write('\n')
            
            # Document tables
            f.write('## Tables\n\n')
            for table_name, table_info in schema_info['tables'].items():
                f.write(f'### {table_name}\n\n')
                
                # Columns
                f.write('#### Columns\n\n')
                f.write('| Name | Type | Nullable | Default | Constraints |\n')
                f.write('|------|------|----------|----------|-------------|\n')
                for col in table_info['columns']:
                    constraints = []
                    if col['name'] in table_info['primary_keys']:
                        constraints.append('PRIMARY KEY')
                    if col['name'] in table_info['unique_constraints']:
                        constraints.append('UNIQUE')
                    for fk in table_info['foreign_keys']:
                        if fk['column'] == col['name']:
                            constraints.append(f"REFERENCES {fk['references_table']}({fk['references_column']})")
                    
                    f.write(f"| {col['name']} | {col['type']} | {'YES' if col['nullable'] else 'NO'} | {col['default'] or 'NULL'} | {', '.join(constraints) or 'None'} |\n")
                f.write('\n')
                
        print("✅ Schema information has been saved to schema_info.json and SCHEMA.md")
        
    except Exception as e:
        print(f"❌ Error getting schema info: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    get_schema_info()
