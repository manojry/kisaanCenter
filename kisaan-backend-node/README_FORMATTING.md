# Prettier and ESLint Setup

This project uses Prettier for code formatting and ESLint for linting. These tools help maintain code quality and consistency.

- `.prettierrc` - Prettier configuration
- `.eslintrc.json` - ESLint configuration

Install dependencies:
```
npm install --save-dev prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Run Prettier:
```
npx prettier --write .
```

Run ESLint:
```
npx eslint . --ext .ts
```
