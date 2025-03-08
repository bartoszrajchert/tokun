import { unlinkSync } from "node:fs";
import path from "node:path";

const pathToIndex = path.join(process.cwd(), "app/docs/content/api/index.md");
unlinkSync(pathToIndex);
console.log(`Removed ${pathToIndex}`);
