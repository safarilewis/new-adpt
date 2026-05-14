import { GitHubSignInButton } from "@/components/GitHubSignInButton";

export default function SignupPage() {
  return (
    <main className="page">
      <section className="panel stack">
        <h1>Create your profile</h1>
        <p className="lead">Start with GitHub. Your public profile remains off until you review and publish it.</p>
        <GitHubSignInButton>Sign up with GitHub</GitHubSignInButton>
      </section>
    </main>
  );
}
