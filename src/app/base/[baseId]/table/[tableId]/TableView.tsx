"use client";

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
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📋 {table.name}</h1>

      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-[500px]">
        {JSON.stringify(table, null, 2)}
      </pre>
    </div>
  );
}
