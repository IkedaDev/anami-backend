import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true, // Permite usar 'describe', 'it', 'expect' sin importarlos
    environment: "node",
    include: ["tests/**/*.test.ts"], // Buscará tests en la carpeta tests/
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 10000, // 10 segundos máximo por test (por si la DB tarda)
  },
});
