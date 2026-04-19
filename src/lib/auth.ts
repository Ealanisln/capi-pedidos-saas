import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

const demoSchema = z.object({
  demo: z.string().trim().toLowerCase(),
});

const demoEmailDomain =
  process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN ??
  process.env.SEED_DEMO_EMAIL_DOMAIN ??
  process.env.ROOT_DOMAIN ??
  "example.com";

const demoEmails: Record<string, string> = {
  lite: `demo.lite@${demoEmailDomain}`,
  pro: `demo.pro@${demoEmailDomain}`,
  enterprise: `demo.enterprise@${demoEmailDomain}`,
  mariscos: `demo.mariscos@${demoEmailDomain}`,
  cafe: `demo.cafe@${demoEmailDomain}`,
  pizza: `demo.pizza@${demoEmailDomain}`,
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password.trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          password,
          user.passwordHash,
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
    CredentialsProvider({
      id: "demo",
      name: "Demo",
      credentials: {
        demo: { label: "Demo", type: "text" },
      },
      async authorize(credentials) {
        const parsed = demoSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = demoEmails[parsed.data.demo];
        if (!email) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenant: {
              select: {
                isDemo: true,
                isActive: true,
              },
            },
          },
        });
        if (!user || !user.tenant.isDemo || !user.tenant.isActive) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.STAFF;
        session.user.tenantId = (token.tenantId as string) ?? "";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuthSession() {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.tenantId) {
    redirect("/admin/login");
  }
  return session;
}
