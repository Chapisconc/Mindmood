// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    settings: {
      "import/ignore": ["@expo/vector-icons", "react-native"],
    },
    rules: {
      "import/no-unresolved": ["error", { ignore: ["@expo/vector-icons"] }],
      "import/namespace": "off",
      "import/no-named-as-default-member": "off",
    },
  },
]);
