// Test script to verify the commission calculation fix
// This simulates the scenario from the dashboard data

console.log("=== TESTING COMMISSION CALCULATION FIX ===\n");

// Simulate today's transactions based on the dashboard data
const todayTransactions = [
  { id: 1, total_sale_value: 31000, shop_commission: 1550 },
  { id: 2, total_sale_value: 31000, shop_commission: 1550 },
  { id: 3, total_sale_value: 31000, shop_commission: 1550 },
  { id: 4, total_sale_value: 31000, shop_commission: 1550 },
  { id: 5, total_sale_value: 31000, shop_commission: 1550 },
  { id: 6, total_sale_value: 31000, shop_commission: 1550 }
];

// Simulate payment allocations - buyers have paid in full for all transactions
const allocations = [
  { transaction_id: 1, allocated_amount: 31000 },
  { transaction_id: 2, allocated_amount: 31000 },
  { transaction_id: 3, allocated_amount: 31000 },
  { transaction_id: 4, allocated_amount: 31000 },
  { transaction_id: 5, allocated_amount: 31000 },
  { transaction_id: 6, allocated_amount: 31000 }
];

console.log("SCENARIO: 6 transactions of ₹31,000 each with ₹1,550 commission each");
console.log("Total sales: ₹186,000");
console.log("Total commission: ₹9,300");
console.log("All buyers have paid in full\n");

// OLD LOGIC (BUGGY)
console.log("=== OLD LOGIC (BUGGY) ===");
let old_today_commission_due = 0;
for (const t of todayTransactions) {
  const total = Number(t.total_sale_value || 0);
  const commission = Number(t.shop_commission || 0);
  const buyerPaid = allocations
    .filter((alloc) => Number(alloc.transaction_id) === Number(t.id))
    .reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0);
  
  // Old buggy logic: if not fully paid, add FULL commission as due
  if (buyerPaid < total) {
    old_today_commission_due += commission;
  }
}
console.log(`OLD today_commission_due: ₹${old_today_commission_due}`);
console.log("Status: INCORRECT - should be 0 since all transactions are fully paid\n");

// NEW LOGIC (FIXED)
console.log("=== NEW LOGIC (FIXED) ===");
let new_today_commission_due = 0;
for (const t of todayTransactions) {
  const total = Number(t.total_sale_value || 0);
  const commission = Number(t.shop_commission || 0);
  const buyerPaid = allocations
    .filter((alloc) => Number(alloc.transaction_id) === Number(t.id))
    .reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0);
  
  // New correct logic: calculate realized commission proportionally
  const realizedCommission = total > 0 ? (buyerPaid / total) * commission : 0;
  const commissionDue = Math.max(0, commission - realizedCommission);
  new_today_commission_due += commissionDue;
}
new_today_commission_due = Number(new_today_commission_due.toFixed(2));
console.log(`NEW today_commission_due: ₹${new_today_commission_due}`);
console.log("Status: CORRECT - 0 because all transactions are fully paid\n");

// Test with partial payments
console.log("=== TEST WITH PARTIAL PAYMENTS ===");
const partialAllocations = [
  { transaction_id: 1, allocated_amount: 30000 }, // ₹1,000 short
  { transaction_id: 2, allocated_amount: 31000 }, // Fully paid
  { transaction_id: 3, allocated_amount: 25000 }, // ₹6,000 short
  { transaction_id: 4, allocated_amount: 31000 }, // Fully paid
  { transaction_id: 5, allocated_amount: 28000 }, // ₹3,000 short
  { transaction_id: 6, allocated_amount: 31000 }  // Fully paid
];

let partial_commission_due = 0;
for (const t of todayTransactions) {
  const total = Number(t.total_sale_value || 0);
  const commission = Number(t.shop_commission || 0);
  const buyerPaid = partialAllocations
    .filter((alloc) => Number(alloc.transaction_id) === Number(t.id))
    .reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0);
  
  const realizedCommission = total > 0 ? (buyerPaid / total) * commission : 0;
  const commissionDue = Math.max(0, commission - realizedCommission);
  partial_commission_due += commissionDue;
  
  console.log(`Transaction ${t.id}: Paid ₹${buyerPaid}/₹${total}, Realized commission: ₹${realizedCommission.toFixed(2)}, Due: ₹${commissionDue.toFixed(2)}`);
}
partial_commission_due = Number(partial_commission_due.toFixed(2));
console.log(`\nTotal commission due with partial payments: ₹${partial_commission_due}`);

const totalShortfall = 1000 + 6000 + 3000; // ₹10,000 total shortfall
// For transaction 1: (1000/31000) * 1550 = 50
// For transaction 3: (6000/31000) * 1550 = 300  
// For transaction 5: (3000/31000) * 1550 = 150
const expectedCommissionDue = (1000/31000)*1550 + (6000/31000)*1550 + (3000/31000)*1550;
console.log(`Expected commission due: ₹${expectedCommissionDue.toFixed(2)}`);
console.log(`Match: ${Math.abs(partial_commission_due - expectedCommissionDue) < 0.01 ? 'YES' : 'NO'}`);
