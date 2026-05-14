import "next-auth";

declare module "next-auth" {
  interface Session {
    githubAccessToken?: string;
    githubUsername?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubAccessToken?: string;
    githubUsername?: string;
  }
}

