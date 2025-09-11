#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function runCommand(command, description) {
  log(`\n${COLORS.BLUE}${COLORS.BOLD}🚀 ${description}${COLORS.RESET}`);
  log(`${COLORS.YELLOW}Command: ${command}${COLORS.RESET}`);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
    log(`${COLORS.GREEN}✅ ${description} completed successfully${COLORS.RESET}`);
    return true;
  } catch (error) {
    log(`${COLORS.RED}❌ ${description} failed${COLORS.RESET}`);
    return false;
  }
}

function showMenu() {
  log(`\n${COLORS.BOLD}${COLORS.BLUE}KisaanCenter Integration Test Runner${COLORS.RESET}`);
  log(`${COLORS.YELLOW}======================================${COLORS.RESET}`);
  log(`
${COLORS.BOLD}Choose an option:${COLORS.RESET}

${COLORS.GREEN}RECOMMENDED TESTS:${COLORS.RESET}
  ${COLORS.BOLD}1${COLORS.RESET} - Complete Business Journey (26 tests) ⭐
  ${COLORS.BOLD}2${COLORS.RESET} - Missing Features Coverage (8 tests) ⭐
  ${COLORS.BOLD}3${COLORS.RESET} - Run Both Recommended Suites (34 tests) 🎯

${COLORS.YELLOW}DEVELOPMENT TESTS:${COLORS.RESET}
  ${COLORS.BOLD}4${COLORS.RESET} - Complete Workflow (Debug version)
  ${COLORS.BOLD}5${COLORS.RESET} - All Integration Tests

${COLORS.BLUE}INDIVIDUAL FEATURES:${COLORS.RESET}
  ${COLORS.BOLD}6${COLORS.RESET} - Balance Tests
  ${COLORS.BOLD}7${COLORS.RESET} - Transaction Tests
  ${COLORS.BOLD}8${COLORS.RESET} - User Management Tests
  ${COLORS.BOLD}9${COLORS.RESET} - Shop Management Tests

${COLORS.RED}UTILITIES:${COLORS.RESET}
  ${COLORS.BOLD}10${COLORS.RESET} - Clean Test Data
  ${COLORS.BOLD}0${COLORS.RESET}  - Exit

${COLORS.YELLOW}Note: Make sure your API server is running on localhost:3000${COLORS.RESET}
`);
}

function main() {
  const args = process.argv.slice(2);
  
  // Direct command line arguments
  if (args.length > 0) {
    const option = args[0];
    handleOption(option);
    return;
  }

  // Interactive mode
  showMenu();
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`${COLORS.BOLD}Enter your choice (1-10, 0 to exit): ${COLORS.RESET}`, (answer) => {
    rl.close();
    handleOption(answer.trim());
  });
}

function handleOption(option) {
  let success = false;
  
  switch (option) {
    case '1':
      success = runCommand(
        'npm test -- tests/integration/business-journey.integration.test.ts',
        'Running Complete Business Journey Tests'
      );
      break;
      
    case '2':
      success = runCommand(
        'npm test -- tests/integration/missing-features.integration.test.ts',
        'Running Missing Features Tests'
      );
      break;
      
    case '3':
      log(`${COLORS.BOLD}${COLORS.GREEN}Running Recommended Test Suite (34 tests)${COLORS.RESET}`);
      const journey = runCommand(
        'npm test -- tests/integration/business-journey.integration.test.ts',
        'Running Business Journey Tests (26 tests)'
      );
      const features = runCommand(
        'npm test -- tests/integration/missing-features.integration.test.ts',
        'Running Missing Features Tests (8 tests)'
      );
      success = journey && features;
      if (success) {
        log(`${COLORS.GREEN}${COLORS.BOLD}🎉 All 34 recommended tests completed successfully!${COLORS.RESET}`);
      }
      break;
      
    case '4':
      success = runCommand(
        'npm test -- tests/integration/complete-workflow.integration.test.ts',
        'Running Complete Workflow Tests (Debug Version)'
      );
      break;
      
    case '5':
      success = runCommand(
        'npm test -- tests/integration/',
        'Running All Integration Tests'
      );
      break;
      
    case '6':
      success = runCommand(
        'npm test -- tests/integration/balance.integration.test.ts',
        'Running Balance Tests'
      );
      break;
      
    case '7':
      success = runCommand(
        'npm test -- tests/integration/transactions.integration.test.ts',
        'Running Transaction Tests'
      );
      break;
      
    case '8':
      success = runCommand(
        'npm test -- tests/integration/user-management.test.ts',
        'Running User Management Tests'
      );
      break;
      
    case '9':
      success = runCommand(
        'npm test -- tests/integration/shop.integration.test.ts',
        'Running Shop Management Tests'
      );
      break;
      
    case '10':
      success = runCommand(
        'npm test -- tests/integration/clean-transactions.integration.test.ts',
        'Running Database Cleanup'
      );
      break;
      
    case '0':
      log(`${COLORS.YELLOW}Goodbye!${COLORS.RESET}`);
      process.exit(0);
      break;
      
    default:
      log(`${COLORS.RED}Invalid option: ${option}${COLORS.RESET}`);
      log(`${COLORS.YELLOW}Please choose a number between 0-10${COLORS.RESET}`);
      process.exit(1);
  }
  
  if (success) {
    log(`${COLORS.GREEN}${COLORS.BOLD}\n✨ Test execution completed successfully!${COLORS.RESET}`);
  } else {
    log(`${COLORS.RED}${COLORS.BOLD}\n💥 Test execution failed. Check the output above for details.${COLORS.RESET}`);
    process.exit(1);
  }
}

// Handle command line usage
if (require.main === module) {
  main();
}

module.exports = { runCommand, handleOption };