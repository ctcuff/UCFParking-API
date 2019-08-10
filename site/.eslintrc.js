module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: ['plugin:vue/essential'],
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'vue/no-unused-vars': 'off'
      }
    }
  ],
  plugins: ['vue'],
  rules: {
    semi: "error",
    quotes: ['warn', 'single']
  }
};