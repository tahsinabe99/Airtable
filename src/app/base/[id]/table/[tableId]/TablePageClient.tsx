"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function TablePageClient() {
  const params = useParams();
  const tableId = params?.tableId as string;
  const parentRef = useRef<HTMLDivElement | null>(null);

  const [rowCount, setRowCount] = useState(100_000);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const utils = api.useUtils();

  const { data: tableData, isLoading: tableLoading } = api.table.getById.useQuery(
    { tableId },
    { enabled: !!tableId }
  );

  const addRows = api.table.addRows.useMutation({
    onSuccess: () => {
      utils.table.getById.invalidate({ tableId });
      utils.table.getRowsPaginated.invalidate();
      utils.table.getFilteredRows.invalidate();
    },
  });

  // Infinite scroll (no search)
  const {
    data: normalData,
    fetchNextPage: fetchNextPageNormal,
    hasNextPage: hasNextNormal,
    isFetching: fetchingNormal,
  } = api.table.getRowsPaginated.useInfiniteQuery(
    { tableId, limit: 100 },
    {
      getNextPageParam: (last) => last.nextCursor,
      enabled: !!tableId && !query,
    }
  );

  // Search mode
  const {
    data: searchData,
    fetchNextPage: fetchNextPageSearch,
    hasNextPage: hasNextSearch,
    isFetching: fetchingSearch,
  } = api.table.getFilteredRows.useInfiniteQuery(
    { tableId, query, limit: 100 },
    {
      getNextPageParam: (last) => last.nextCursor,
      enabled: !!tableId && !!query,
    }
  );

  const data = query
    ? searchData?.pages.flatMap((p) => p.rows) ?? []
    : normalData?.pages.flatMap((p) => p.rows) ?? [];

  const hasNextPage = query ? hasNextSearch : hasNextNormal;
  const fetchNextPage = query ? fetchNextPageSearch : fetchNextPageNormal;
  const isFetching = query ? fetchingSearch : fetchingNormal;

  const virtualizer = useVirtualizer({
    count: hasNextPage ? data.length + 1 : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  useEffect(() => {
    const last = items[items.length - 1];
    if (!last) return;
    if (last.index >= data.length - 1 && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [items, data.length, hasNextPage, isFetching, fetchNextPage]);

  if (tableLoading || !tableData) return <p className="p-4">Loading table...</p>;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => addRows.mutate({ tableId, count: rowCount })}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add {rowCount.toLocaleString()} Rows
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="ml-auto rounded border px-2 py-1 text-sm"
          onKeyDown={(e) => e.key === "Enter" && setQuery(search)}
        />
        <button
          onClick={() => setQuery(search)}
          className="rounded bg-gray-200 px-3 py-1 text-sm"
        >
          Search
        </button>
      </div>

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border rounded-md bg-white"
      >
        <div className="flex bg-gray-50 font-semibold text-sm border-b">
          {tableData.columns.map((col) => (
            <div key={col.id} className="flex-1 px-3 py-2">
              {col.name}
            </div>
          ))}
        </div>

        <div style={{ height: totalHeight, position: "relative" }}>
          {items.map((vRow) => {
            const row = data[vRow.index];
            if (!row) return null;

            const cellMap = Object.fromEntries(
              row.cells.map((cell) => [cell.columnId, cell.value])
            );

            return (
              <div
                key={row.id}
                className="flex border-b text-sm"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vRow.start}px)`,
                }}
              >
                {tableData.columns.map((col) => (
                  <div key={col.id} className="flex-1 px-3 py-2 truncate">
                    {cellMap[col.id]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
