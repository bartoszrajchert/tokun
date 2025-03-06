import { FileHeader } from "utils/types.js";

export const defaultFileHeader: FileHeader = {
  name: "default-file-header",
  fileHeader: () => ["File generated automatically, do not edit manually"],
};
