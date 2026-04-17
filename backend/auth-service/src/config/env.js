import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceRoot = path.resolve(__dirname, "../..");
const workspaceRoot = path.resolve(serviceRoot, "../..");
const isProduction = process.env.NODE_ENV === "production";

dotenv.config({ path: path.join(workspaceRoot, ".env"), override: !isProduction });
dotenv.config({ path: path.join(serviceRoot, ".env"), override: !isProduction });

