import { redirect } from "next/navigation";

export default function SupervisionSessionRedirect() {
  redirect("/dashboard/supervision");
}
