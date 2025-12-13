import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to dashboard - auth will handle redirect to login if not authenticated
  redirect("/dashboard")
}
