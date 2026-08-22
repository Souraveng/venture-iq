import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const targetRole = credentials.role === "investor" ? "investor" : "founder";

        try {
          // Find user in PostgreSQL
          const user = (await prisma.user.findUnique({
            where: { email },
          })) as any;

          if (!user || !user.password) {
            // User not found or no password (e.g. OAuth only user)
            return null;
          }

          // Compare password hash
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          // Verify role authorization
          const userRoles = user.roles || [user.role || "founder"];
          if (!userRoles.includes(targetRole)) {
            return null;
          }

          return {
            id: user.id,
            name: user.name || "Venture User",
            email: user.email,
            image: user.image,
            role: targetRole,
            roles: userRoles,
            onboarded: user.onboarded || false,
          };
        } catch (dbError) {
          console.error("Database connection failed during authentication:", dbError);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      // If the user logs in via Google, ensure they exist in our database immediately
      if (account?.provider === "google" && user.email) {
        try {
          let rawRole: string | undefined;
          try {
            const cookieStore = await cookies();
            rawRole = cookieStore.get("ventureiq_intended_role")?.value;
          } catch (e) {
            // Ignore if cookies() cannot be read outside request context
          }
          const intendedRole = rawRole === "investor" ? "investor" : "founder";

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "Google User",
                image: user.image,
                role: intendedRole, // Default to the intended role
                roles: [intendedRole],
                onboarded: false,
              },
            });
            // Mutate the user object so the jwt callback creates the token with the correct role immediately
            (user as any).role = intendedRole;
            (user as any).roles = [intendedRole];
            (user as any).onboarded = false;
          } else {
            // If they are logging in via a specific portal, grant them that role immediately to prevent JWT staleness
            const existingRoles = existingUser.roles || [existingUser.role || "founder"];
            const updatedRoles = existingRoles.includes(intendedRole) 
              ? existingRoles 
              : Array.from(new Set([...existingRoles, intendedRole]));

            (user as any).role = intendedRole;
            (user as any).roles = updatedRoles;
            (user as any).onboarded = existingUser.onboarded || false;
          }
        } catch (error) {
          console.error("Failed to provision Google OAuth user in database:", error);
          // We still return true to allow login even if DB insert fails 
          // (they will remain a "ghost" user until onboarded, but won't be locked out)
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // The 'user' object is only passed the first time this callback is called (e.g. upon login)
      if (user) {
        token.role = (user as any).role || "founder";
        token.roles = (user as any).roles || [(user as any).role || "founder"];
        token.onboarded = (user as any).onboarded || false;
        if ((user as any).image) {
          token.picture = (user as any).image;
        }
      }
      
      // ONLY query DB if we are explicitly updating the token OR if roles are completely missing 
      // (like during an initial Google OAuth sign in where user.role wasn't provided)
      if (token.email && (!token.roles || trigger === "update")) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { role: true, roles: true, onboarded: true },
          });
          if (dbUser) {
            token.role = dbUser.role || token.role || "founder";
            token.roles = dbUser.roles && dbUser.roles.length > 0 ? dbUser.roles : [token.role];
            token.onboarded = dbUser.onboarded;
          }
        } catch (err) {
          console.error("Error fetching user in NextAuth JWT callback:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || "founder";
        (session.user as any).roles = token.roles || ["founder"];
        (session.user as any).onboarded = token.onboarded || false;
        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login-role",
  },
};
