import path from "path";
import { fileURLToPath } from "url";
import YAML from "yamljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiPath = path.resolve(__dirname, "../docs/openapi.yaml");

const swaggerDocument = YAML.load(openApiPath);

export default swaggerDocument;
