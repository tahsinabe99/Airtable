"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import TableView from "./TableView";
import { useState } from "react";

export default function TablePageClient() {
  const params = useParams();
  const tableId = params?.tableId as string;
  const [rowCount, setRowCount] = useState(100000);

  const utils = api.useUtils();

  const { data, isLoading, isError } = api.table.getById.useQuery({ tableId }, {
    enabled: !!tableId,
  });

  const addRows = api.table.addRows.useMutation({
    onSuccess: () => utils.table.getById.invalidate({ tableId }),
  });

  if (isLoading) return <p className="p-4 text-gray-600">Loading table...</p>;
  if (isError || !data) return <p className="p-4 text-red-500">Failed to load table</p>;

  return (
    <div className="space-y-4 p-4">
      <button
        onClick={() => addRows.mutate({ tableId, count: rowCount })}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Add {rowCount.toLocaleString()} Rows
      </button>
      <TableView table={data} />
    </div>
  );
}
