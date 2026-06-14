import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertUser, getUser } from "@/lib/db";

export const authOptions: AuthOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        console.log("[NextAuth OAuth Callback] Received Google Profile:", {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        });
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      }
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
        console.log("[NextAuth Credentials] Auth attempt for:", credentials?.email);
        if (!credentials?.email) return null;
        
        const email = credentials.email.toLowerCase().trim();
        const action = (credentials as any).action;
        const name = credentials.name || email.split("@")[0];
        
        // Check user database record
        const existingUser = await getUser(email);
        
        if (action === "signup") {
          if (existingUser) {
            console.warn("[NextAuth Credentials] Signup failed. User already exists:", email);
            throw new Error("USER_EXISTS");
          }
          // Sync new user creation to db
          console.log("[NextAuth Credentials] Creating new user in DB:", email);
          await upsertUser(email, name, "");
        } else {
          // signin
          if (!existingUser) {
            console.warn("[NextAuth Credentials] Signin failed. User not found:", email);
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
    async redirect({ url, baseUrl }) {
      console.log(`[NextAuth Redirect Callback] URL: ${url} | BaseURL: ${baseUrl}`);
      try {
        // Parse the URL using the baseUrl as the base to resolve relative/protocol-relative/backslash paths.
        const parsed = new URL(url, baseUrl);
        const parsedBase = new URL(baseUrl);

        // Strict origin check: only allow redirect if it matches the baseUrl origin.
        if (parsed.origin === parsedBase.origin) {
          // Re-construct the absolute URL safely using the verified base origin and relative path elements.
          // This prevents any malformed inputs (e.g. multi-slashes or backslashes) from causing security issues.
          return parsed.origin + parsed.pathname + parsed.search + parsed.hash;
        }
      } catch (e) {
        console.error("[NextAuth Redirect Callback] Error parsing redirect URL:", e);
      }
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      console.log("[NextAuth Callback] signIn triggered for:", user.email);
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
        try {
          console.log("[NextAuth Callback] Upserting user in PostgreSQL:", user.email);
          await upsertUser(user.email, user.name || "", user.image || "");
          console.log("[NextAuth Callback] PostgreSQL upsert completed successfully.");
        } catch (err: any) {
          console.error("[NextAuth Callback] PostgreSQL upsert failed:", err.message, err.stack);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("[NextAuth Callback] jwt triggered. Token email:", token.email);
      if (account) {
        console.log("[NextAuth Callback] JWT account provider is:", account.provider);
        token.accessToken = account.access_token;
      }
      if (user?.email) {
        token.email = user.email.toLowerCase().trim();
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth Callback] session triggered.");
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        if (token.email) {
          session.user.email = token.email.toLowerCase().trim();
        }
        console.log("[NextAuth Callback] Returning session for:", session.user.email);
      }
      return session;
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[NextAuth Error Log]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth Warn Log]", code);
    },
    debug(code, metadata) {
      console.log("[NextAuth Debug Log]", code, metadata);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

