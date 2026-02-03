
// Adding a public home page redirection
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/login");
}
