"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { api } from "~/trpc/react";
import { useState } from "react";
import Link from "next/link";


export default function HomePage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  console.log("Session status:", status);
  console.log("Session object:", session);

  const { data: bases, refetch } = api.base.getAll.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  const createBase = api.base.create.useMutation({
    onSuccess: () => {
      refetch();
      setNewBaseName("");
    },
  });

  const [newBaseName, setNewBaseName] = useState("");

  if (status === "loading") return <p>Loading session...</p>;

  return (
    <div className="p-6 space-y-4">
      {!session && (
        <button
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 cursor-pointer"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      )}

      {session && (
        <>
          <h1 className="text-xl font-bold">Welcome, {session.user?.name}</h1>

          <button
            className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-700 cursor-pointer"
            onClick={() => signOut()}
          >
            Sign out
          </button>

          <div>
            <input
              className="border p-2 mr-2"
              placeholder="New base name"
              value={newBaseName}
              onChange={(e) => setNewBaseName(e.target.value)}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-700 cursor-pointer"
              onClick={() => createBase.mutate({ name: newBaseName })}
            >
              Create Base
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Your Bases:</h2>
            <ul className="list-disc ml-6">
            {bases?.map((base) => (
              <li key={base.id}>
                <Link href={`/base/${base.id}`} className="text-blue-600 underline">
                  {base.name}
                </Link>
              </li>
            ))}
            {bases?.map((base) => (
              <li key={base.id}>
                {base.name} - ID: {base.id}
              </li>
            ))}

            
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
