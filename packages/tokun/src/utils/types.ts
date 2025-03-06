import { Token, TokenGroup } from "types/definitions.js";
import { FlattenTokens } from "./to-flat.js";

export type Transform = {
  transitive: boolean;
  name: string;
  filter?: (arg: Token) => boolean;
} & (TokenTransform | NameTransform);

export type TransformGroup = {
  name: string;
  transforms: Transform[];
};

type TokenTransform = {
  type: "token";
  transformer: (arg: Token) => Token;
};

type NameTransform = {
  type: "name";
  transformer: (arg: string) => string;
};

export type Loader = {
  name: string;
  pattern: RegExp;
  loadFn: ({ content }: { content: TokenGroup }) => FlattenTokens;
};

export type Format = {
  name: string;
  formatter: (args: {
    tokens: FlattenTokens;
    config: any;
    fileHeader: FileHeader;
  }) => string;
};

export type FileHeader = {
  name: string;
  fileHeader: () => string[];
};

export type ModifyProperties<
  T,
  Changes extends Partial<Record<keyof T, any>>,
> = Omit<T, keyof Changes> & {
  [K in keyof Changes]: Changes[K];
};
