# Database Schema Documentation

Generated on: 2025-08-30 20:54:55.603184

## Enums

### recordstatus_old
Possible values:
- ACTIVE
- INACTIVE
- DELETED

### userrole
Possible values:
- SUPERADMIN
- OWNER
- EMPLOYEE
- FARMER
- BUYER
- GUEST

### transactionstatus
Possible values:
- PENDING
- CONFIRMED
- CANCELLED

### paymentstatus
Possible values:
- PENDING
- PARTIAL
- COMPLETE

### completionstatus
Possible values:
- PENDING
- PARTIAL
- COMPLETE
- CANCELLED

### stockstatus
Possible values:
- ACTIVE
- CLOSED
- RETURNED
- DISCARDED

### transactiontype
Possible values:
- SALE
- RETURN
- ADJUSTMENT

### creditstatus
Possible values:
- OUTSTANDING
- PARTIAL
- SETTLED

### paymenttype
Possible values:
- PAYMENT
- ADVANCE
- REFUND

### farmerpaymenttype
Possible values:
- SETTLEMENT
- ADVANCE

### commissionruletype
Possible values:
- PERCENTAGE
- FIXED
- TIERED

### auditaction
Possible values:
- INSERT
- UPDATE
- DELETE

### recordstatus
Possible values:
- active
- inactive
- suspended

### billingcycle
Possible values:
- MONTHLY
- QUARTERLY
- YEARLY

### subscriptionstatus
Possible values:
- ACTIVE
- SUSPENDED
- EXPIRED
- CANCELLED

### limittype
Possible values:
- COUNT
- DAYS
- MONTHS
- PERCENTAGE
- count
- months

### resetcycle
Possible values:
- DAILY
- MONTHLY
- YEARLY

### farmerstockmode
Possible values:
- declared
- implicit

### transaction_status
Possible values:
- pending
- completed
- cancelled

### payment_status
Possible values:
- pending
- partial
- completed
- unpaid

### completion_status
Possible values:
- incomplete
- complete
- pending

### record_status
Possible values:
- active
- inactive

### payment_type
Possible values:
- full
- partial
- advance

### farmer_payment_type
Possible values:
- advance
- settlement
- bonus

### credit_status
Possible values:
- pending
- approved
- rejected

### user_role
Possible values:
- superadmin
- owner
- manager
- employee
- farmer
- buyer

### transaction_type
Possible values:
- sale
- purchase
- return

### stock_status
Possible values:
- in_stock
- out_of_stock
- low_stock

### subscription_status
Possible values:
- active
- inactive
- cancelled
- expired

### billing_cycle
Possible values:
- monthly
- quarterly
- yearly

## Tables

### subscription

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('subscription_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| plan_id | integer | NO | NULL | REFERENCES plan(id) |
| billing_cycle | USER-DEFINED | YES | NULL | None |
| start_date | date | NO | NULL | None |
| end_date | date | NO | NULL | None |
| auto_renew | boolean | YES | NULL | None |
| status | USER-DEFINED | YES | NULL | None |
| payment_status | USER-DEFINED | YES | NULL | None |
| amount | numeric | NO | NULL | None |
| discount_amount | numeric | YES | NULL | None |
| created_at | timestamp without time zone | YES | NULL | None |
| updated_at | timestamp without time zone | YES | NULL | None |

### category

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('category_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | None |
| description | text | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### transaction

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('transaction_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| buyer_user_id | integer | NO | NULL | None |
| parent_transaction_id | integer | YES | NULL | REFERENCES transaction(id) |
| type | character varying | YES | 'sale'::character varying | None |
| status | character varying | YES | 'active'::character varying | None |
| commission_rate | numeric | YES | 0.00 | None |
| commission_amount | numeric | YES | 0.00 | None |
| payment_status | character varying | YES | 'pending'::character varying | None |
| buyer_paid_amount | numeric | YES | 0.00 | None |
| farmer_paid_amount | numeric | YES | 0.00 | None |
| commission_confirmed | boolean | YES | false | None |
| completion_status | character varying | YES | 'pending'::character varying | None |
| date | date | NO | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### transaction_item

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('transaction_item_id_seq'::regclass) | PRIMARY KEY |
| transaction_id | integer | NO | NULL | REFERENCES transaction(id) |
| product_id | integer | NO | NULL | REFERENCES product(id) |
| farmer_stock_id | integer | YES | NULL | REFERENCES farmer_stocks(id) |
| quantity | numeric | NO | NULL | None |
| price | numeric | NO | NULL | None |
| status | character varying | YES | 'active'::character varying | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### credit_detail

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('credit_detail_id_seq'::regclass) | PRIMARY KEY |
| credit_id | integer | NO | NULL | None |
| farmer_user_id | integer | NO | NULL | None |
| product_id | integer | NO | NULL | REFERENCES product(id) |
| quantity | numeric | NO | NULL | None |
| price | numeric | NO | NULL | None |
| date | date | NO | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### superadmin

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('superadmin_id_seq'::regclass) | PRIMARY KEY |
| username | character varying | NO | NULL | UNIQUE |
| password_hash | character varying | NO | NULL | None |
| email | character varying | NO | NULL | UNIQUE |
| contact | character varying | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| status | USER-DEFINED | YES | 'active'::recordstatus | None |

### product

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('product_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| name | character varying | NO | NULL | None |
| category_id | integer | YES | NULL | REFERENCES category(id) |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| status | USER-DEFINED | YES | 'active'::recordstatus | None |

### feature_control

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('feature_control_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| feature_name | character varying | NO | NULL | None |
| is_enabled | boolean | YES | NULL | None |
| limit_value | integer | YES | NULL | None |
| limit_type | USER-DEFINED | YES | NULL | None |
| controlled_by | integer | YES | NULL | REFERENCES superadmin(id) |
| reason | text | YES | NULL | None |
| effective_from | timestamp without time zone | YES | NULL | None |
| expires_at | timestamp without time zone | YES | NULL | None |
| created_at | timestamp without time zone | YES | NULL | None |
| updated_at | timestamp without time zone | YES | NULL | None |

### usage_tracking

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('usage_tracking_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| feature_name | character varying | NO | NULL | None |
| usage_count | integer | YES | NULL | None |
| usage_date | date | NO | NULL | None |
| reset_cycle | USER-DEFINED | YES | NULL | None |
| created_at | timestamp without time zone | YES | NULL | None |
| updated_at | timestamp without time zone | YES | NULL | None |

### subscription_history

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('subscription_history_id_seq'::regclass) | PRIMARY KEY |
| subscription_id | integer | NO | NULL | REFERENCES subscription(id) |
| shop_id | integer | NO | NULL | None |
| previous_plan_id | integer | YES | NULL | REFERENCES plan(id) |
| new_plan_id | integer | NO | NULL | REFERENCES plan(id) |
| change_reason | text | YES | NULL | None |
| changed_by | integer | YES | NULL | REFERENCES superadmin(id) |
| effective_date | date | NO | NULL | None |
| created_at | timestamp without time zone | YES | NULL | None |

### order

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('order_id_seq'::regclass) | PRIMARY KEY |
| product_id | integer | NO | NULL | REFERENCES product(id) |
| shop_id | integer | NO | NULL | None |
| buyer_id | integer | NO | NULL | None |
| quantity | integer | NO | NULL | None |
| total_price | numeric | NO | NULL | None |
| status | character varying | YES | NULL | None |
| created_at | timestamp without time zone | YES | NULL | None |
| updated_at | timestamp without time zone | YES | NULL | None |

### inventory

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('inventory_id_seq'::regclass) | PRIMARY KEY |
| product_id | integer | NO | NULL | REFERENCES product(id) |
| shop_id | integer | NO | NULL | None |
| quantity | integer | NO | NULL | None |
| status | character varying | YES | NULL | None |
| updated_at | timestamp without time zone | YES | NULL | None |

### user_activity

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('user_activity_id_seq'::regclass) | PRIMARY KEY |
| user_id | integer | NO | NULL | None |
| activity | character varying | NO | NULL | None |
| details | text | YES | NULL | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### farmer_stock

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('farmer_stock_id_seq1'::regclass) | PRIMARY KEY |
| farmer_user_id | integer | NO | NULL | None |
| product_id | integer | NO | NULL | None |
| quantity | numeric | NO | 0.000 | None |
| price | numeric | NO | NULL | None |
| status | USER-DEFINED | NO | 'in_stock'::stock_status | None |
| record_status | USER-DEFINED | NO | 'active'::record_status | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### shops

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('shops_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | None |
| address | text | YES | NULL | None |
| location | character varying | YES | NULL | None |
| contact | character varying | YES | NULL | None |
| commission_rate | numeric | NO | 0.00 | None |
| owner_user_id | integer | YES | NULL | REFERENCES users(id) |
| plan_id | integer | YES | NULL | REFERENCES plans(id) |
| plan_start_date | date | YES | NULL | None |
| plan_end_date | date | YES | NULL | None |
| status | USER-DEFINED | NO | 'active'::record_status | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### users

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('users_id_seq'::regclass) | PRIMARY KEY |
| username | character varying | NO | NULL | UNIQUE |
| password_hash | character varying | NO | NULL | None |
| role | USER-DEFINED | NO | NULL | None |
| contact | character varying | YES | NULL | None |
| shop_id | integer | YES | NULL | REFERENCES shops(id) |
| credit_limit | numeric | YES | 0.00 | None |
| status | USER-DEFINED | NO | 'active'::record_status | None |
| created_by | integer | YES | NULL | REFERENCES users(id) |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### products

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('products_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | None |
| description | text | YES | NULL | None |
| category_id | integer | NO | NULL | REFERENCES categories(id) |
| price | numeric | YES | NULL | None |
| status | USER-DEFINED | NO | 'active'::record_status | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### alembic_version

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| version_num | character varying | NO | NULL | PRIMARY KEY |

### commission_rule

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('commission_rule_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| product_id | integer | YES | NULL | REFERENCES product(id) |
| rule_type | character varying | NO | NULL | None |
| rate | numeric | NO | NULL | None |
| min_qty | numeric | YES | NULL | None |
| max_qty | numeric | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### expense

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('expense_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| category_id | integer | YES | NULL | REFERENCES expense_category(id) |
| amount | numeric | NO | NULL | None |
| description | text | YES | NULL | None |
| date | date | NO | NULL | None |
| created_by | integer | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### expense_category

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('expense_category_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | None |
| description | text | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### stock_adjustment

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('stock_adjustment_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| farmer_stock_id | integer | NO | NULL | REFERENCES farmer_stocks(id) |
| adjustment_type | character varying | NO | NULL | None |
| quantity | numeric | NO | NULL | None |
| reason | text | YES | NULL | None |
| created_by | integer | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### product_price_history

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('product_price_history_id_seq'::regclass) | PRIMARY KEY |
| product_id | integer | NO | NULL | REFERENCES product(id) |
| price | numeric | NO | NULL | None |
| effective_date | date | NO | NULL | None |
| created_by | integer | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### plan_feature

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('plan_feature_id_seq'::regclass) | PRIMARY KEY |
| plan_id | integer | NO | NULL | REFERENCES plan(id) |
| feature_name | character varying | NO | NULL | None |
| feature_value | character varying | YES | NULL | None |
| is_enabled | boolean | YES | true | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### plans

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('plans_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | None |
| description | text | YES | NULL | None |
| monthly_price | numeric | NO | NULL | None |
| quarterly_price | numeric | YES | NULL | None |
| yearly_price | numeric | YES | NULL | None |
| max_farmers | integer | NO | NULL | None |
| max_buyers | integer | NO | NULL | None |
| max_transactions | integer | NO | NULL | None |
| data_retention_months | integer | NO | NULL | None |
| features | jsonb | YES | NULL | None |
| status | USER-DEFINED | NO | 'active'::record_status | None |
| created_at | timestamp without time zone | NO | NULL | None |
| updated_at | timestamp without time zone | NO | NULL | None |

### audit_log

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('audit_log_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | YES | NULL | None |
| entity_type | character varying | NO | NULL | None |
| entity_id | integer | NO | NULL | None |
| user_id | integer | YES | NULL | None |
| old_data | jsonb | YES | NULL | None |
| new_data | jsonb | YES | NULL | None |
| action | character varying | NO | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### farmer_stocks

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('farmer_stock_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | None |
| farmer_user_id | integer | NO | NULL | None |
| product_id | integer | NO | NULL | REFERENCES product(id) |
| quantity | numeric | NO | NULL | None |
| status | character varying | YES | 'active'::character varying | None |
| date | date | NO | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| unit_price | numeric | YES | NULL | None |
| carry_forward | boolean | NO | false | None |
| carried_from_date | date | YES | NULL | None |
| mode | USER-DEFINED | NO | 'implicit'::farmerstockmode | None |
| declared_at | timestamp without time zone | YES | NULL | None |
| declared_by_id | integer | YES | NULL | None |
| notes | text | YES | NULL | None |
| declared_qty | numeric | YES | NULL | None |
| sold_qty | numeric | YES | NULL | None |

### plan

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('plan_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | None |
| description | text | YES | NULL | None |
| monthly_price | numeric | NO | NULL | None |
| max_transactions | integer | YES | 1000 | None |
| features | jsonb | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| status | USER-DEFINED | YES | 'active'::recordstatus | None |
| quarterly_price | numeric | YES | NULL | None |
| yearly_price | numeric | YES | NULL | None |
| max_farmers | integer | YES | 10 | None |
| max_buyers | integer | YES | 20 | None |
| data_retention_months | integer | YES | 6 | None |

### user

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('user_id_seq'::regclass) | PRIMARY KEY |
| username | character varying | NO | NULL | UNIQUE |
| password_hash | character varying | NO | NULL | None |
| role | USER-DEFINED | NO | NULL | None |
| shop_id | integer | YES | NULL | None |
| created_by | integer | YES | NULL | REFERENCES user(id) |
| name | character varying | NO | NULL | None |
| contact | character varying | YES | NULL | None |
| credit_limit | numeric | YES | NULL | None |
| created_at | timestamp without time zone | YES | NULL | None |
| updated_at | timestamp without time zone | YES | NULL | None |
| status | USER-DEFINED | YES | 'active'::recordstatus | None |

### categories

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('categories_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | UNIQUE |
| description | text | YES | NULL | None |
| status | USER-DEFINED | NO | 'active'::record_status | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### transactions

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('transactions_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | REFERENCES shops(id) |
| buyer_id | integer | NO | NULL | REFERENCES users(id) |
| parent_transaction_id | integer | YES | NULL | REFERENCES transactions(id) |
| type | USER-DEFINED | NO | 'sale'::transaction_type | None |
| status | USER-DEFINED | NO | 'pending'::transaction_status | None |
| commission_rate | numeric | YES | 0.00 | None |
| commission_amount | numeric | YES | 0.00 | None |
| payment_status | USER-DEFINED | NO | 'unpaid'::payment_status | None |
| buyer_paid_amount | numeric | YES | 0.00 | None |
| farmer_paid_amount | numeric | YES | 0.00 | None |
| commission_confirmed | boolean | YES | false | None |
| completion_status | USER-DEFINED | NO | 'pending'::completion_status | None |
| date | date | NO | NULL | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### transaction_items

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('transaction_items_id_seq'::regclass) | PRIMARY KEY |
| transaction_id | integer | NO | NULL | REFERENCES transactions(id) |
| product_id | integer | NO | NULL | REFERENCES products(id) |
| farmer_id | integer | NO | NULL | REFERENCES users(id) |
| farmer_stock_id | integer | YES | NULL | REFERENCES farmer_stock(id) |
| quantity | numeric | NO | NULL | None |
| price | numeric | NO | NULL | None |
| status | USER-DEFINED | NO | 'active'::record_status | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### credits

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('credits_id_seq'::regclass) | PRIMARY KEY |
| user_id | integer | NO | NULL | REFERENCES users(id) |
| amount | numeric | NO | NULL | None |
| status | USER-DEFINED | NO | 'pending'::credit_status | None |
| record_status | USER-DEFINED | NO | 'active'::record_status | None |
| address | text | YES | NULL | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

### payments

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('payments_id_seq'::regclass) | PRIMARY KEY |
| transaction_id | integer | NO | NULL | REFERENCES transactions(id) |
| credit_id | integer | YES | NULL | REFERENCES credits(id) |
| amount | numeric | NO | NULL | None |
| payment_method_id | integer | NO | NULL | REFERENCES payment_methods(id) |
| type | USER-DEFINED | NO | NULL | None |
| status | USER-DEFINED | YES | 'active'::record_status | None |
| date | date | NO | NULL | None |
| reference_number | character varying | YES | NULL | None |
| notes | text | YES | NULL | None |
| processed_by | integer | YES | NULL | REFERENCES users(id) |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### payment_methods

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('payment_methods_id_seq'::regclass) | PRIMARY KEY |
| name | character varying | NO | NULL | UNIQUE |
| description | text | YES | NULL | None |
| is_active | boolean | YES | true | None |
| status | USER-DEFINED | NO | 'active'::record_status | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### farmer_payments

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('farmer_payments_id_seq'::regclass) | PRIMARY KEY |
| transaction_id | integer | NO | NULL | REFERENCES transactions(id) |
| farmer_stock_id | integer | YES | NULL | REFERENCES farmer_stock(id) |
| farmer_user_id | integer | NO | NULL | REFERENCES users(id) |
| amount | numeric | NO | NULL | None |
| payment_type | USER-DEFINED | NO | NULL | None |
| payment_method_id | integer | NO | NULL | REFERENCES payment_methods(id) |
| remarks | text | YES | NULL | None |
| date | date | NO | NULL | None |
| reference_number | character varying | YES | NULL | None |
| approved_by | integer | YES | NULL | REFERENCES users(id) |
| status | USER-DEFINED | YES | 'active'::record_status | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### subscriptions

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('subscriptions_id_seq'::regclass) | PRIMARY KEY |
| shop_id | integer | NO | NULL | REFERENCES shops(id) |
| plan_id | integer | NO | NULL | REFERENCES plans(id) |
| billing_cycle | USER-DEFINED | NO | 'monthly'::billing_cycle | None |
| auto_renew | boolean | YES | true | None |
| start_date | date | YES | NULL | None |
| end_date | date | YES | NULL | None |
| status | USER-DEFINED | NO | 'active'::subscription_status | None |
| payment_status | USER-DEFINED | NO | 'unpaid'::payment_status | None |
| amount | numeric | YES | NULL | None |
| discount_amount | numeric | YES | NULL | None |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |
| updated_at | timestamp without time zone | YES | CURRENT_TIMESTAMP | None |

### farmer_stock_audit

#### Columns

| Name | Type | Nullable | Default | Constraints |
|------|------|----------|----------|-------------|
| id | integer | NO | nextval('farmer_stock_audit_id_seq'::regclass) | PRIMARY KEY |
| farmer_stock_id | integer | NO | NULL | REFERENCES farmer_stock(id) |
| performed_by_id | integer | NO | NULL | REFERENCES users(id) |
| action_type | character varying | NO | NULL | None |
| old_values | jsonb | YES | NULL | None |
| new_values | jsonb | YES | NULL | None |
| transaction_id | integer | YES | NULL | REFERENCES transactions(id) |
| notes | text | YES | NULL | None |
| created_at | timestamp without time zone | NO | CURRENT_TIMESTAMP | None |

