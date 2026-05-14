"use client";

import { Github } from "lucide-react";
import { signIn } from "next-auth/react";

export function GitHubSignInButton({ children }: { children: string }) {
  return (
    <button type="button" onClick={() => signIn("github", { callbackUrl: "/onboarding/github" })}>
      <Github size={18} /> {children}
    </button>
  );
}

