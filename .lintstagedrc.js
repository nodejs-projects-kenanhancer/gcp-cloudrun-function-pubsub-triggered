module.exports = {
  // TypeScript files - run ESLint and Prettier
  // '*.{ts,tsx,mts,cts}': ['eslint --fix', 'prettier --write'],
  // JavaScript files - run ESLint and Prettier
  '*.{js,jsx,mjs,cjs}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  // Format config files
  '*.{json,yaml,yml,xml,md,txt}': 'prettier --write',
  // Conditional logic is possible
  // '*.sh': (files) => {
  //   return files.map((file) => `shellcheck ${file}`);
  // },
  // Terraform files
  '*.{tf,tfvars}': 'terraform fmt -recursive',
};
