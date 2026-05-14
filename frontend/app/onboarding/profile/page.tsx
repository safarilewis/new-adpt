import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { saveProfileSection } from "@/app/actions";

export default async function ProfileOnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="page">
      <section className="panel stack">
        <span className="status">Step 3 of 3</span>
        <h1>Add profile evidence</h1>
        <p className="lead">Add one section now. You can add more from the dashboard.</p>
        <form className="form" action={saveProfileSection}>
          <label className="field">
            <span>Section type</span>
            <select name="kind" defaultValue="project">
              <option value="project">Project</option>
              <option value="experience">Experience</option>
              <option value="education">Education</option>
              <option value="certification">Certification</option>
              <option value="bootcamp">Bootcamp</option>
            </select>
          </label>
          <label className="field"><span>Title</span><input name="title" required /></label>
          <label className="field"><span>Organization</span><input name="organization" /></label>
          <label className="field"><span>Description</span><textarea name="description" /></label>
          <label className="field"><span>URL</span><input name="url" /></label>
          <input name="order" type="hidden" value="0" />
          <button type="submit">Save and open dashboard</button>
        </form>
      </section>
    </main>
  );
}

