import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { serialize } from 'cookie';
import { encrypt, listingMenu } from "../../../utilities/encrypt";
import axios from "axios";

export const getNextAuthOptions = (req, res) => {
  const authOptions = {
    providers: [
      CredentialsProvider({
        name: 'credentials',

        async authorize(credentials) {
          const result = await axios({
            method: 'post',
            url: `${process.env.API_URL}/api/login`,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ email: credentials?.email, password: credentials?.password, aslogin: credentials?.aslogin })
          });

          const user = await result.data;

          if (user?.name) {
            const encToken = encrypt(user.token);
            let token_encrypt = encToken.encryptedText + "/" + encToken.iv;

            // Decode the token to replace %2F with /
            token_encrypt = decodeURIComponent(token_encrypt);

            const cookies =
              serialize('_A2F', token_encrypt, {
                httpOnly: true,
                secure: false, // Setel ke true jika menggunakan HTTPS di produksi
                sameSite: 'lax',
                path: '/',
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Contoh: kedaluwarsa dalam 7 hari
              });
            res.setHeader('Set-Cookie', cookies);

            user.menu = user?.menu;
            return user;
          }

          throw new Error(user.error);
        }

      })
    ],
    pages: {
      signIn: '/login',
      error: '/login', // Error code passed in query string as ?error=
      signOut: '/login'
    },
    cookies: {
      sessionToken: {
        name: `_A2R`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: false
        }
      },
    },
    callbacks: {
      async jwt({ token, account, user }) {
        if (user) {
          token.userRole = user.role;
          token.menu = user.menu;
        }
        return token;
      },
      async session({ session, token, user }) {
        session.user.userRole = token.userRole;
        session.user.menu = token.menu;
        return session;
      }
    },
  };

  return authOptions;
};

export default async function handler(req, res) {
  return await NextAuth(req, res, getNextAuthOptions(req, res));
}
