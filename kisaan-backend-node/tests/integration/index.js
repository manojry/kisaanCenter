/**
 * KisaanCenter Integration Tests Index
 * 
 * This file provides programmatic access to test organization and metadata.
 * Use this when you need to integrate test running into other tools or scripts.
 */

const path = require('path');

const TEST_SUITES = {
  // Primary recommended test suites
  RECOMMENDED: {
    'business-journey': {
      file: 'business-journey.integration.test.ts',
      description: 'Complete end-to-end business workflow',
      tests: 26,
      status: 'PASSING',
      priority: 'HIGH',
      coverage: 'Complete workflow from superadmin to daily operations'
    },
    'missing-features': {
      file: 'missing-features.integration.test.ts',
      description: 'Additional endpoint coverage',
      tests: 8,
      status: 'PASSING',
      priority: 'HIGH',
      coverage: 'Plans, categories, products, balance, commissions'
    }
  },

  // Development and debugging tests
  DEVELOPMENT: {
    'complete-workflow': {
      file: 'complete-workflow.integration.test.ts',
      description: 'Basic transaction workflow with debugging',
      tests: 15,
      status: 'PARTIAL',
      priority: 'MEDIUM',
      coverage: 'Basic transaction flow with detailed logging'
    }
  },

  // Individual feature tests
  FEATURES: {
    'balance': {
      file: 'balance.integration.test.ts',
      description: 'Balance operations testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'categories': {
      file: 'categories.integration.test.ts',
      description: 'Category management testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'commission': {
      file: 'commission.integration.test.ts',
      description: 'Commission calculation testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'credits': {
      file: 'credits.integration.test.ts',
      description: 'Credit system testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'owner': {
      file: 'owner.integration.test.ts',
      description: 'Owner operations testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'payments': {
      file: 'payments.integration.test.ts',
      description: 'Payment processing testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'plans': {
      file: 'plans.integration.test.ts',
      description: 'Plan management testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'products': {
      file: 'products.integration.test.ts',
      description: 'Product management testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'reports': {
      file: 'reports.integration.test.ts',
      description: 'Reporting system testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'settlement': {
      file: 'settlement.integration.test.ts',
      description: 'Settlement operations testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'shop': {
      file: 'shop.integration.test.ts',
      description: 'Shop management testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'transactions': {
      file: 'transactions.integration.test.ts',
      description: 'Transaction operations testing',
      status: 'MIXED',
      priority: 'LOW'
    },
    'user-management': {
      file: 'user-management.test.ts',
      description: 'User management testing',
      status: 'MIXED',
      priority: 'LOW'
    }
  },

  // Utility and cleanup tests
  UTILITIES: {
    'clean-transactions': {
      file: 'clean-transactions.integration.test.ts',
      description: 'Database cleanup utility',
      status: 'UTILITY',
      priority: 'UTILITY'
    }
  }
};

const COMMANDS = {
  // Recommended commands
  runRecommended: 'npm run test:recommended',
  runBusinessJourney: 'npm run test:business-journey',
  runMissingFeatures: 'npm run test:missing-features',
  
  // Interactive runner
  runInteractive: 'npm run test:runner',
  
  // Direct Jest commands
  runAll: 'npm run test:integration',
  runSpecific: (testName) => `npm test -- tests/integration/${testName}.integration.test.ts`
};

const STATS = {
  totalRecommendedTests: 34,
  passingRecommendedTests: 34,
  totalFiles: Object.keys(TEST_SUITES.RECOMMENDED).length + 
              Object.keys(TEST_SUITES.DEVELOPMENT).length + 
              Object.keys(TEST_SUITES.FEATURES).length + 
              Object.keys(TEST_SUITES.UTILITIES).length,
  recommendedCoverage: '~95%'
};

function getRecommendedTests() {
  return TEST_SUITES.RECOMMENDED;
}

function getAllTests() {
  return TEST_SUITES;
}

function getTestPath(testName) {
  const allTests = { ...TEST_SUITES.RECOMMENDED, ...TEST_SUITES.DEVELOPMENT, ...TEST_SUITES.FEATURES, ...TEST_SUITES.UTILITIES };
  const test = allTests[testName];
  return test ? path.join(__dirname, test.file) : null;
}

function getStats() {
  return STATS;
}

function getCommands() {
  return COMMANDS;
}

module.exports = {
  TEST_SUITES,
  COMMANDS,
  STATS,
  getRecommendedTests,
  getAllTests,
  getTestPath,
  getStats,
  getCommands
};