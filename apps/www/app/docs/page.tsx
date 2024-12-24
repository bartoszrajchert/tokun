import { redirect } from "next/navigation";
import { DEFAULT_SLUG } from "./utils";

export default function Page() {
  redirect("docs/" + DEFAULT_SLUG);
}
