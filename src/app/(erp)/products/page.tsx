import { redirect } from "next/navigation";

/** Legacy route — catalog lives at `/items`. */
export default function Page() {
  redirect("/items");
}
