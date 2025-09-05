from src.database import get_db
from sqlalchemy import text

# Get database session
db = next(get_db())

# Check current state
print('Current users with role=owner:')
result = db.execute(text("SELECT id, username, role, shop_id FROM users WHERE role = 'owner'"))
owners = result.fetchall()
for owner in owners:
    print(f'  ID: {owner.id}, Username: {owner.username}, Shop ID: {owner.shop_id}')

print('\nCurrent shops:')
result = db.execute(text("SELECT id, name, owner_id FROM shops"))
shops = result.fetchall()
for shop in shops:
    print(f'  ID: {shop.id}, Name: {shop.name}, Owner User ID: {shop.owner_id}')

# If owner exists but has no shop, create one
if owners and owners[0].shop_id is None:
    owner = owners[0]
    print(f'\nCreating shop for owner {owner.username} (ID: {owner.id})...')
    
    # Create shop for this owner
    result = db.execute(text('''
        INSERT INTO shops (name, location, commission_rate, owner_id, record_status, created_at)
        VALUES (:name, :location, :commission_rate, :owner_id, 'active', CURRENT_TIMESTAMP)
        RETURNING id
    '''), {
        'name': f'{owner.username} Shop',
        'location': 'Main Location',
        'commission_rate': 5.0,
        'owner_id': owner.id
    })
    shop = result.fetchone()
    shop_id = shop.id
    
    # Update owner's shop_id
    db.execute(text('UPDATE users SET shop_id = :shop_id WHERE id = :owner_id'), {
        'shop_id': shop_id,
        'owner_id': owner.id
    })
    
    db.commit()
    print(f'Shop created with ID: {shop_id}')
    print(f'Owner {owner.username} updated with shop_id: {shop_id}')
else:
    print('\nNo unlinked owners found or already linked.')

db.close()
print('Done!')
