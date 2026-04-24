import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Session cookie lifetime — 30 days is comfortable for a family app. */
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

/** Re-issue session cookie if it's older than this on an active request. */
const SESSION_UPDATE_AGE = 24 * 60 * 60;

// ─── authOptions ──────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        // ── Fetch user ────────────────────────────────────────────────────────
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id:       true,
            email:    true,
            name:     true,
            password: true,
            memberships: {
              select: { role: true, familyId: true },
              take: 1,
            },
          },
        });

        if (!user) {
          // Constant-time compare — prevents timing-based user enumeration
          await bcrypt.compare(
            credentials.password,
            "$2b$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          );
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        const firstMember = user.memberships[0];

        return {
          id:       user.id,
          email:    user.email,
          name:     user.name ?? undefined,
          role:     firstMember?.role,
          familyId: firstMember?.familyId ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    // Populate JWT token on sign-in — role is fetched once and stored in the token.
    // For a family app with rarely-changing roles, this is perfectly fine.
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.role     = user.role;
        token.familyId = user.familyId;
      }
      return token;
    },

    // Shape the session object that the client receives
    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.id;
        session.user.role     = token.role;
        session.user.familyId = token.familyId;
      }

      if (token.error) {
        (session as any).error = token.error;
      }

      return session;
    },
  },

  session: {
    strategy:  "jwt" as const,
    maxAge:    SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path:     "/",
        secure:   process.env.NODE_ENV === "production",
      },
    },
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };