import nextConfig from "eslint-config-next";
import prettierConfig from "eslint-config-prettier/flat";
import prettierPlugin from "eslint-plugin-prettier";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import sonarjsPlugin from "eslint-plugin-sonarjs";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "*.config.mjs",
      "*.config.js",
      "*.config.ts",
    ],
  },
  ...nextConfig,
  prettierConfig,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],

    plugins: {
      "@typescript-eslint": tsPlugin,
      sonarjs: sonarjsPlugin,
      prettier: prettierPlugin,
    },

    rules: {
      "prettier/prettier": ["warn", { singleQuote: true }],
      complexity: ["error", 15],
      "max-depth": ["error", 5],
      "max-lines": [
        "error",
        {
          max: 300,
          skipComments: true,
          skipBlankLines: true,
        },
      ],
      "max-nested-callbacks": ["error", 4],
      "max-params": ["error", 5],
      "max-len": ["error", 200],

      "no-shadow": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "after-used", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-shadow": ["error"],
      "@typescript-eslint/no-explicit-any": "error",

      "react/jsx-filename-extension": [
        "warn",
        { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      ],
      "react/jsx-props-no-spreading": 0,
      "react/jsx-key": ["error", { warnOnDuplicates: true }],
      "react/react-in-jsx-scope": 0,
      "react/function-component-definition": [
        2,
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],

      "import/extensions": "off",
      "import/order": "off",
      "import/no-unresolved": "off",
      "import/no-cycle": "off",
      "import/prefer-default-export": "off",

      "default-param-last": "error",
      "dot-notation": "error",
      eqeqeq: ["error", "always"],
      "no-console": "warn",
      "import/no-duplicates": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "no-param-reassign": ["error", { props: false }],
      "no-plusplus": "off",
      "no-restricted-exports": "off",
      "no-template-curly-in-string": "error",
      "no-useless-concat": "error",
      "prefer-template": "error",
      "prefer-destructuring": [
        "error",
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
      ],
      "object-shorthand": ["error", "always"],
      "no-useless-return": "error",
      "no-unneeded-ternary": ["error", { defaultAssignment: false }],
      "no-nested-ternary": "error",
      "no-shadow-restricted-names": "error",

      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-all-duplicated-branches": "error",
      "sonarjs/no-duplicate-string": ["error", { threshold: 3 }],
      "sonarjs/no-duplicated-branches": "error",
      "sonarjs/no-empty-collection": "error",
      "sonarjs/no-gratuitous-expressions": "error",
      "sonarjs/no-identical-conditions": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-ignored-return": "error",
      "sonarjs/no-nested-switch": "error",
      "sonarjs/no-nested-template-literals": "error",
      "sonarjs/no-redundant-boolean": "error",
      "sonarjs/no-small-switch": "error",
      "sonarjs/no-unused-collection": "error",
      "sonarjs/no-use-of-empty-return-value": "error",
      "sonarjs/no-useless-catch": "error",
      "sonarjs/non-existent-operator": "error",
      "sonarjs/prefer-immediate-return": "error",
      "sonarjs/prefer-object-literal": "error",
      "sonarjs/prefer-single-boolean-return": "error",
    },

    settings: {
      "import/resolver": {
        node: true,
      },
    },
  },
];

export default eslintConfig;
