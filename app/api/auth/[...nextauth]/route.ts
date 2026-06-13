import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertUser, getUser } from "@/lib/db";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        action: { label: "Action", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        const email = credentials.email.toLowerCase().trim();
        const action = (credentials as any).action;
        const name = credentials.name || email.split("@")[0];
        
        // Check user database record
        const existingUser = await getUser(email);
        
        if (action === "signup") {
          if (existingUser) {
            throw new Error("USER_EXISTS");
          }
          // Sync new user creation to db
          await upsertUser(email, name, "");
        } else {
          // signin
          if (!existingUser) {
            throw new Error("USER_NOT_FOUND");
          }
        }
        
        return {
          id: email,
          email: email,
          name: existingUser?.name || name,
          image: existingUser?.image || ""
        };
      }
    })
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
        await upsertUser(user.email, user.name || "", user.image || "");
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user?.email) {
        token.email = user.email.toLowerCase().trim();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        if (token.email) {
          session.user.email = token.email.toLowerCase().trim();
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
