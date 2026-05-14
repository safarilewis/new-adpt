import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectGithub } from "@/app/actions";

export default async function GithubOnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="page">
      <section className="panel stack">
        <span className="status">Step 1 of 3</span>
        <h1>Connect GitHub</h1>
        <p className="lead">We will import repository evidence and keep it removable from your dashboard.</p>
        <form className="form" action={connectGithub}>
          <label className="field">
            <span>GitHub username</span>
            <input name="username" defaultValue={session.githubUsername ?? ""} required />
          </label>
          <input name="accessToken" type="hidden" value={session.githubAccessToken ?? ""} />
          <button type="submit">Import GitHub data</button>
        </form>
      </section>
    </main>
  );
}

