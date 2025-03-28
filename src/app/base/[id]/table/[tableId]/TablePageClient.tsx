"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMemo } from "react";

export default function TablePageClient() {
  const { tableId } = useParams() as { tableId: string };
  const { data: session } = useSession();

  const { data: table, isLoading } = api.table.getById.useQuery(
    { tableId },
    { enabled: !!session && !!tableId }
  );

  const columnHelper = createColumnHelper<Record<string, string>>();

  // If table is not loaded yet, use fallback values to avoid breaking hook order
  const columnIdToName: Record<string, string> = {};
  table?.columns.forEach((col) => {
    columnIdToName[col.id] = col.name;
  });

  const data = table?.rows.map((row) => {
    const rowObj: Record<string, string> = { id: row.id };
    row.cells.forEach((cell) => {
      const colName = columnIdToName[cell.columnId] || "";
      rowObj[colName] = cell.value;
    });
    return rowObj;
  }) ?? [];

  const columns = useMemo(() => {
    return table?.columns.map((col) =>
      columnHelper.accessor(col.name, {
        header: col.name,
        cell: (info) => info.getValue(),
      })
    ) ?? [];
  }, [table?.columns]);

  const tableInstance = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!session) return <p>Please log in.</p>;
  if (isLoading) return <p>Loading table...</p>;
  if (!table) return <p>Table not found or not authorized.</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">📊 {table.name}</h1>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-700"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {tableInstance.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
