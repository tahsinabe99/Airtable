"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMemo } from "react";

type TableProps = {
  table: {
    id: string;
    name: string;
    columns: { id: string; name: string; type: string }[];
    rows: {
      id: string;
      cells: { id: string; value: string; columnId: string }[];
    }[];
  };
};

export default function TableView({ table }: { table: TableProps["table"] }) {
  // Map columnId → name
  const columnMap = useMemo(() => {
    const map: Record<string, string> = {};
    table.columns.forEach((col) => {
      map[col.id] = col.name;
    });
    return map;
  }, [table.columns]);

  // Transform rows into flat objects
  const data = table.rows.map((row) => {
    const obj: Record<string, string> = { id: row.id };
    row.cells.forEach((cell) => {
      const name = columnMap[cell.columnId];
      obj[name] = cell.value;
    });
    return obj;
  });

  // Define columns
  const columnHelper = createColumnHelper<Record<string, string>>();
  const columns = useMemo(
    () =>
      table.columns.map((col) =>
        columnHelper.accessor(col.name, {
          header: col.name,
          cell: (info) => info.getValue(),
        })
      ),
    [table.columns]
  );

  const tableInstance = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">📋 {table.name}</h1>

      <div className="overflow-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left font-semibold text-gray-700"
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
                  <td key={cell.id} className="px-4 py-2 text-gray-800">
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
