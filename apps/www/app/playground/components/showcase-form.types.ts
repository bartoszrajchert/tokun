export type PresetFile = {
  name: string;
  content: string;
};

export type PlaygroundPreset = {
  id: string;
  label: string;
  description: string;
  files: PresetFile[];
};

export type InputFile = PresetFile & {
  id: string;
};

export type BuildOutput = {
  name: string;
  content: string;
};

export type InputParseError = {
  fileId: string;
  fileName: string;
  message: string;
};

export type TreeDirectoryNode = {
  type: "directory";
  name: string;
  path: string;
  children: TreeNode[];
};

export type TreeFileNode = {
  type: "file";
  name: string;
  path: string;
  fileId: string;
};

export type TreeNode = TreeDirectoryNode | TreeFileNode;
