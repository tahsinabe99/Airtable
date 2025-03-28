import NextAuth from "next-auth";
import { cache } from "react";
// import { getServerSession } from "next-auth";
import { authConfig } from "./config"; 

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };

// export const getServerAuthSession = async () => {
//     return await getServerSession(authConfig);
//   };
export const getServerAuthSession = auth;