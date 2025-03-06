// TODO: do types later
// @ts-nocheck

import React from "react";
import { highlight } from "sugar-high";

export function Code({ children, ...props }) {
  const codeHTML = highlight(children);
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}
