"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useState, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function TablePageClient() {
  const params = useParams();
  const tableId = params?.tableId as string;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rowCount, setRowCount] = useState(100_000);

  const utils = api.useUtils();

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: tableData } = api.table.getById.useQuery(
    { tableId },
    { enabled: !!tableId }
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.table.getRowsPaginated.useInfiniteQuery(
    {
      tableId,
      limit: 100,
      search: debouncedSearch,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!tableId,
    }
  );

  const addRows = api.table.addRows.useMutation({
    onSuccess: () => utils.table.getRowsPaginated.invalidate(),
  });

  const allRows = data?.pages.flatMap((page) => page.rows) ?? [];

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 42,
    overscan: 10,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;
    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), allRows.length, hasNextPage, isFetchingNextPage]);

  if (!tableData) return <p className="p-4 text-gray-600">Loading table...</p>;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <button
          onClick={() => addRows.mutate({ tableId, count: rowCount })}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add {rowCount.toLocaleString()} Rows
        </button>
      </div>

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border rounded-md bg-white"
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = allRows[virtualRow.index];
            if (!row) return null;

            return (
              <div
                key={row.id}
                className="flex border-b text-sm"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {tableData.columns.map((col) => {
                  const cell = row.cells.find(
                    (c) => c.columnId === col.id
                  );
                  return (
                    <div
                      key={col.id}
                      className="flex-1 px-4 py-2 truncate border-r"
                    >
                      {cell?.value ?? ""}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
