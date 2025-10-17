import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { serialize } from 'cookie';
import { encrypt, listingMenu } from "../../../utilities/encrypt";
import axios from "axios";

export const getNextAuthOptions = (req,res) =>{
  const authOptions = {
    providers : [
      CredentialsProvider({
        // Credentials provider configuration
        name: 'credentials',

        async authorize(credentials) {
          //# versi awal
          // const result = await fetch(`http://127.0.0.1:8000/api/login`, {
          //   method: 'POST',
          //   body: JSON.stringify({email:credentials?.email,password:credentials?.password}),
          //   headers: { "Content-Type": "application/json" }
          // });

          const result = await axios({
            method: 'post',
            url: `${process.env.API_URL}/api/login`,
            headers:{ "Content-Type": "application/json" },
            data: JSON.stringify({email:credentials?.email,password:credentials?.password,aslogin:credentials?.aslogin})
          });

          const user = await result.data
          //#versi awal retrieve data
          // const user = await result.json()
          if(user?.name){
             const encToken = encrypt(user.token);
             const token_encrypt = encToken.encryptedText+"/"+encToken.iv;

             const cookies =
              serialize('_A2F',token_encrypt, {
               httpOnly: true,
               secure: false, // Setel ke true jika menggunakan HTTPS di produksi
               sameSite: 'lax',
               path: '/',
               expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Contoh: kedaluwarsa dalam 7 hari
             });
             res.setHeader('Set-Cookie', cookies);
            //  let menus = await listingMenu(JSON.stringify(user.menu));
             user.menu = user?.menu;
            //  let menuArr = [];
            //  menuArr = user.menu.map((val)=>{
            //     let enkripsi = encrypt(val.to);
            //     let resEncript =  enkripsi.encryptedText+"/"+enkripsi.iv;
            //     return {
            //       to:resEncript
            //     }
            //  });
            //  user.menu = menuArr;

            //  const rr = JSON.stringify(user.role);
            //  const encryptRole = encrypt(rr);
            //  user.role = encryptRole.encryptedText+"/"+encryptRole.iv;
            return user;
          }

          throw new Error(user.error)
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
      //parameter user berasal dari const user di atas
      async jwt({ token, account, user }) {
        // Persist the OAuth access_token and or the user id to the token right after signin
        // if (account) {
        //   token.token = user.token
        // }
        if(user){
          token.userRole = user.role;
          token.menu = user.menu;
        }
        return token
      },
      async session({ session, token, user }) {
        // Send properties to the client, like an access_token and user id from a provider.
        // session.user.token = token.token
        // session.user.role = token.role
        session.user.userRole = token.userRole
        session.user.menu = token.menu
        return session
      }
    },
  };

  return authOptions;
};

export default async function handler(req, res) {
  return await NextAuth(req, res, getNextAuthOptions(req, res));
}
