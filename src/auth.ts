import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/admin";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, profile }) {
      const emailFromProfile = typeof profile?.email === "string" ? profile.email : undefined;
      const email = (emailFromProfile ?? token.email ?? "").toString();
      token.isAdmin = isAdminEmail(email);
      return token;
    },
    async session({ session, token }) {
      session.user = session.user ?? {};
      (session.user as { isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin);
      return session;
    }
  }
};
