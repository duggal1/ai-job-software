import { redirect } from "next/navigation";

export default function JobPostRedirect() {
  redirect("/job-post/new");
}
