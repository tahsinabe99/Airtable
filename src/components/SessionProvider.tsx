"use client";

import { SessionProvider as NextAuthProvider } from "next-auth/react";
import type { Session } from "next-auth";

type Props = {
  children: React.ReactNode;
  session: Session | null;
};

export default function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthProvider session={session}>
      {children}
    </NextAuthProvider>
  );
}
