import fs from "fs";
import path from "path";
import { glob } from "tinyglobby";
import { logger } from "utils/logger.js";
import { dtcgValidator } from "validators/dtcg-validator.js";
import { startMessage } from "./helpers.js";

export async function runValidate(globInputs: string[]): Promise<void> {
  startMessage("validate");

  const inputs = await glob(globInputs);

  if (inputs.length === 0) {
    throw new Error(`No files found for ${globInputs.join(", ")}`);
  }

  for (const filePath of inputs) {
    const resolvedPath = path.relative(process.cwd(), filePath);
    logger.log(`Validating tokens for ${resolvedPath}`);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { errors, warnings } = dtcgValidator(JSON.parse(fileContent));

    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        logger.warn(`! ${warning}`);
      });
    }

    if (errors.length > 0) {
      errors.forEach(({ message }) => {
        logger.error(`! ${message}`);
      });
    } else {
      logger.success("✓ The tokens are valid");
    }
  }
}
