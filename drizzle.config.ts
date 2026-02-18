import { defineConfig } from "drizzle-kit";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set. Ensure MongoDB is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mongodb",
  dbCredentials: {
    uri: process.env.MONGODB_URI,
  },
});
