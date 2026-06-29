import next from "eslint-config-next";

/** Flat ESLint config — eslint-config-next v16 ships a native flat config array. */
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
