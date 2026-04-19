import { type UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    tenantId: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      tenantId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    tenantId?: string;
  }
}
