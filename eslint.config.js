import dx from "@eoussama/dx";



export default dx({}, {
  // shadcn/ui components, copied from its registry: documented upstream
  files: ["src/components/ui/**"],
  rules: {
    "jsdoc/require-jsdoc": "off",
    "jsdoc/require-description": "off",
    "jsdoc/require-param": "off",
    "jsdoc/require-param-description": "off",
    "jsdoc/require-returns": "off",
  },
});
