import { SuccessResponse } from "@/types/global.type";
import { fetcher } from "@/utils/fetcher";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type AdminLogin = {
  admin_id: string;
  fullname: string;
  access_token: string;
};

export const authOptions: NextAuthOptions = {
  secret: process.env.JWT_SECRET_KEY,
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60 * 6,
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        admin_id: { label: "admin_id" },
        password: { label: "password" },
      },
      async authorize(credentials, req) {
        try {
          const response: SuccessResponse<AdminLogin> = await fetcher({
            url: "/auth/login/admins",
            method: "POST",
            data: credentials,
          });

          return response.data;
        } catch (error) {
          throw new Error(JSON.stringify(error));
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.admin_id = user.admin_id;
        token.fullname = user.fullname;
        token.access_token = user.access_token;
      }
      return token;
    },

    session({ session, token }) {
      session.user.admin_id = token.admin_id;
      session.user.fullname = token.fullname;
      session.user.access_token = token.access_token;
      return session;
    },
  },
};

export default NextAuth(authOptions);
