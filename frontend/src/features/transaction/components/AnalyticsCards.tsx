
import React from 'react'
import { TransactionAnalytics } from '@/types/transaction'

interface AnalyticsCardsProps {
  analytics: TransactionAnalytics | null
  loading: boolean
}

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ analytics, loading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  const cards = [
    {
      title: 'Total Transactions',
      value: analytics.total_transactions,
      format: 'number',
      color: 'blue',
      icon: '📊'
    },
    {
      title: 'Total Amount',
      value: analytics.total_amount,
      format: 'currency',
      color: 'green',
      icon: '💰'
    },
    {
      title: 'Pending Payments',
      value: analytics.pending_payments,
      format: 'currency',
      color: 'yellow',
      icon: '⏳'
    },
    {
      title: 'Commission Earned',
      value: analytics.commission_earned,
      format: 'currency',
      color: 'purple',
      icon: '💼'
    },
    {
      title: 'Today Transactions',
      value: analytics.today_transactions,
      format: 'number',
      color: 'indigo',
      icon: '📈'
    },
    {
      title: 'Today Amount',
      value: analytics.today_amount,
      format: 'currency',
      color: 'pink',
      icon: '🎯'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      pink: 'bg-pink-50 text-pink-600 border-pink-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${getColorClasses(card.color)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">{card.title}</p>
              <p className="text-2xl font-bold">
                {card.format === 'currency' 
                  ? formatCurrency(card.value) 
                  : card.value.toLocaleString()
                }
              </p>
            </div>
            <div className="text-3xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AnalyticsCards
