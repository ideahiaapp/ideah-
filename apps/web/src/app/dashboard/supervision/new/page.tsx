import { redirect } from "next/navigation";

export default function NewSupervisionRedirect() {
  redirect("/dashboard/supervision");
}
