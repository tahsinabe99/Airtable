"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";

interface Props {
  base: {
    id: string;
    name: string;
    tables: { id: string; name: string }[];
  };
}

export default function BasePageClient({ base }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const createTable = api.table.create.useMutation({
    onSuccess: () => {
      startTransition(() => {
        router.refresh();
      });
    },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">📁 {base.name}</h1>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 cursor-pointer"
        onClick={() => createTable.mutate({ baseId: base.id, name: "Untitled Table" })}
        disabled={isPending}
      >
        {isPending ? "Creating..." : "➕ Create Table"}
      </button>

      {base.tables.length === 0 ? (
        <p>No tables yet.</p>
      ) : (
        <ul className="list-disc pl-6">
          {base.tables.map((table) => (
            <li key={table.id}>
              <Link
                href={`/base/${base.id}/table/${table.id}`}
                className="text-blue-600 underline"
              >
                {table.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
