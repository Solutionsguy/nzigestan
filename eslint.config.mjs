import { FlatCompat } from "@eslint/eslintrc";
import path from "path";

const compat = new FlatCompat({
  baseDirectory: path.resolve(),
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", ".data/**", "dist/**", "out/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
