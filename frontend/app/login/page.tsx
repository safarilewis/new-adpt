import { GitHubSignInButton } from "@/components/GitHubSignInButton";

export default function LoginPage() {
  return (
    <main className="page">
      <section className="panel stack">
        <h1>Log in</h1>
        <p className="lead">Continue with GitHub to manage your adpt profile.</p>
        <GitHubSignInButton>Continue with GitHub</GitHubSignInButton>
      </section>
    </main>
  );
}
