import { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_SLUG } from "./utils";

export const metadata: Metadata = {
  title: "Documentation | Tokun",
  description: "Documentation for Tokun",
};

export default function Page() {
  redirect("docs/" + DEFAULT_SLUG);
}
