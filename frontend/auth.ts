import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      const githubProfile = profile as { login?: string } | undefined;
      if (account?.access_token) {
        token.githubAccessToken = account.access_token;
      }
      if (githubProfile?.login) {
        token.githubUsername = githubProfile.login;
      }
      return token;
    },
    async session({ session, token }) {
      session.githubAccessToken = typeof token.githubAccessToken === "string" ? token.githubAccessToken : undefined;
      session.githubUsername = typeof token.githubUsername === "string" ? token.githubUsername : undefined;
      return session;
    }
  }
});
