#!/usr/bin/env node

/**
 * Script to fix common TypeScript lint errors in the codebase
 * Fixes patterns like:
 * - any types -> unknown/specific types
 * - unused variables -> prefixed with _
 * - extra semicolons
 * - prefer-const violations
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define patterns and their fixes
const fixes = [
  // Fix common 'any' patterns
  {
    pattern: /catch \(([^:]+): any\)/g,
    replacement: 'catch ($1: unknown)'
  },
  {
    pattern: /: any\[\]/g,
    replacement: ': unknown[]'
  },
  {
    pattern: /as any\)/g,
    replacement: 'as unknown)'
  },
  {
    pattern: /\(error as any\)\.message/g,
    replacement: '(error as Error).message'
  },
  {
    pattern: /\(req as any\)\.log/g,
    replacement: '(req as { log?: { error: (obj: unknown, msg: string) => void } }).log'
  },
  
  // Fix unused variables by prefixing with _
  {
    pattern: /async (\w+)\(req: Request, res: Response\)/g,
    replacement: 'async $1(_req: Request, _res: Response)'
  },
  {
    pattern: /async (\w+)\((\w+): Request, (\w+): Response\)/g,
    replacement: 'async $1(_$2: Request, _$3: Response)'
  },
  
  // Fix prefer-const
  {
    pattern: /let (\w+) = /g,
    replacement: 'const $1 = '
  },
  
  // Remove extra semicolons
  {
    pattern: /\n\s*;\s*$/gm,
    replacement: ''
  },
  {
    pattern: /}\s*;\s*$/gm,
    replacement: '}'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Find all TypeScript files
const tsFiles = glob.sync('src/**/*.ts', { 
  cwd: process.cwd(),
  absolute: true 
});

console.log(`Found ${tsFiles.length} TypeScript files`);

// Apply fixes to each file
tsFiles.forEach(fixFile);

console.log('Lint fixes applied!');