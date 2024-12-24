import fs from "fs";
import { green, red, yellow } from "kleur/colors";
import path from "path";
import { glob } from "tinyglobby";
import { tokensValidator } from "validators/tokens-validator.js";
import { startMessage } from "./helpers.js";

export async function runValidate(globInputs: string[]): Promise<void> {
  startMessage("validate");

  const inputs = await glob(globInputs);

  if (inputs.length === 0) {
    throw new Error(`No files found for ${globInputs.join(", ")}`);
  }

  for (const filePath of inputs) {
    const resolvedPath = path.relative(process.cwd(), filePath);
    console.log(yellow(`Validating tokens for ${resolvedPath}`));

    const fileContent = fs.readFileSync(resolvedPath, "utf-8");
    const { errors } = tokensValidator(JSON.parse(fileContent));

    if (errors.length > 0) {
      errors.forEach(({ message }) => {
        console.error(red(`! ${message}`));
      });
    } else {
      console.log(green("✓ The tokens are valid."));
    }
  }
}
