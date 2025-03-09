import globals from 'globals';
import prettier from 'eslint-plugin-prettier/recommended';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,jsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  prettier,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
    }
  }
];
