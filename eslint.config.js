const resolveModule = (name) => {
  try {
    return require(name);
  } catch {
    return require(require.resolve(name, { paths: [__dirname, `${__dirname}/apps/expo-multi-tv`] }));
  }
};

const prettier = resolveModule('eslint-plugin-prettier');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', 'build/**', 'dist/**', '**/node_modules/**'],
    languageOptions: {
      parser: resolveModule('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': resolveModule('@typescript-eslint/eslint-plugin'),
      react: resolveModule('eslint-plugin-react'),
      prettier: prettier,
    },
    rules: {
      semi: ['warn', 'always'],
      'prefer-const': 'error',
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'auto',
          usePrettierrc: true,
        },
      ],
    },
  },
];
