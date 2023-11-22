import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";

import { authConfig } from "@/auth.config";
import type { User } from "@/app/lib/definitions";

const getUser = async (email: string) => {
  try {
    const users = await sql<User>`Select * from users where email=${email}`;
    return users.rows[0];
  } catch (e) {
    console.log(e);
    throw "Error: Failed to fetch users.";
  }
};

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;

          const passwordMath = await bcrypt.compare(password, user.password);
          if (passwordMath) {
            return user;
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
