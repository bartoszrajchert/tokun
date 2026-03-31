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

  let validFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const filePath of inputs) {
    const resolvedPath = path.relative(process.cwd(), filePath);
    logger.info(`Validate ${resolvedPath}`);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { errors, warnings } = dtcgValidator(JSON.parse(fileContent));

    totalWarnings += warnings.length;
    totalErrors += errors.length;

    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        logger.warn(`[${resolvedPath}] ${warning}`);
      });
    }

    if (errors.length > 0) {
      errors.forEach(({ message }) => {
        logger.error(`[${resolvedPath}] ${message}`);
      });
    } else {
      validFiles++;
      logger.success(`${resolvedPath} is valid`);
    }
  }

  logger.break();

  if (totalErrors > 0) {
    logger.warn(
      `Validation finished with ${totalErrors} error${totalErrors === 1 ? "" : "s"} and ${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}.`,
    );
    return;
  }

  logger.success(
    `Validation finished: ${validFiles}/${inputs.length} file${inputs.length === 1 ? "" : "s"} valid (${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}).`,
  );
}
