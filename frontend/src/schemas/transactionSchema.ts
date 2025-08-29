
import * as yup from 'yup'
import { TRANSACTION_FORM_VALIDATION } from '@/constants/transaction'

export const transactionItemSchema = yup.object({
  product_id: yup
    .number()
    .required('Product is required')
    .positive('Product must be selected'),
  quantity: yup
    .number()
    .required('Quantity is required')
    .min(TRANSACTION_FORM_VALIDATION.MIN_QUANTITY, `Quantity must be at least ${TRANSACTION_FORM_VALIDATION.MIN_QUANTITY}`),
  price: yup
    .number()
    .required('Price is required')
    .min(TRANSACTION_FORM_VALIDATION.MIN_PRICE, `Price must be at least ${TRANSACTION_FORM_VALIDATION.MIN_PRICE}`)
})

export const transactionFormSchema = yup.object({
  buyer_user_id: yup
    .number()
    .required('Buyer is required')
    .positive('Please select a buyer'),
  type: yup
    .string()
    .required('Transaction type is required')
    .oneOf(['sale', 'purchase', 'return', 'exchange'], 'Invalid transaction type'),
  commission_rate: yup
    .number()
    .required('Commission rate is required')
    .min(TRANSACTION_FORM_VALIDATION.MIN_COMMISSION_RATE, `Commission rate must be at least ${TRANSACTION_FORM_VALIDATION.MIN_COMMISSION_RATE}%`)
    .max(TRANSACTION_FORM_VALIDATION.MAX_COMMISSION_RATE, `Commission rate cannot exceed ${TRANSACTION_FORM_VALIDATION.MAX_COMMISSION_RATE}%`),
  date: yup
    .string()
    .required('Date is required'),
  items: yup
    .array()
    .of(transactionItemSchema)
    .min(1, 'At least one item is required')
    .max(TRANSACTION_FORM_VALIDATION.MAX_ITEMS, `Cannot exceed ${TRANSACTION_FORM_VALIDATION.MAX_ITEMS} items`)
})

export const paymentUpdateSchema = yup.object({
  amount: yup
    .number()
    .required('Payment amount is required')
    .positive('Payment amount must be positive')
})

export const transactionFiltersSchema = yup.object({
  search: yup.string().nullable(),
  type: yup.string().nullable(),
  status: yup.string().nullable(),
  payment_status: yup.string().nullable(),
  date_from: yup.string().nullable(),
  date_to: yup.string().nullable(),
  category_id: yup.string().nullable(),
  user_id: yup.string().nullable(),
  min_amount: yup.number().nullable().positive('Minimum amount must be positive'),
  max_amount: yup.number().nullable().positive('Maximum amount must be positive')
}).test('date-range', 'End date must be after start date', function(value) {
  const { date_from, date_to } = value
  if (date_from && date_to) {
    return new Date(date_to) >= new Date(date_from)
  }
  return true
}).test('amount-range', 'Maximum amount must be greater than minimum amount', function(value) {
  const { min_amount, max_amount } = value
  if (min_amount && max_amount) {
    return max_amount >= min_amount
  }
  return true
})

export const bulkUpdateSchema = yup.object({
  transaction_ids: yup
    .array()
    .of(yup.number().required())
    .min(1, 'At least one transaction must be selected'),
  status: yup
    .string()
    .required('Status is required')
    .oneOf(['pending', 'active', 'completed', 'cancelled'], 'Invalid status'),
  payment_status: yup
    .string()
    .nullable()
    .oneOf(['pending', 'partial', 'paid'], 'Invalid payment status')
})
