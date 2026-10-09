import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
export default [
  { ignores: ['.next/**', 'node_modules/**', 'js/vendors.js', 'js/vendors/**', 'public/js/vendors.js', 'public/js/vendors/**'] },
  { files: ['**/*.{js,jsx,mjs,cjs}'] },
  ...compat.extends('next/core-web-vitals'),
];
