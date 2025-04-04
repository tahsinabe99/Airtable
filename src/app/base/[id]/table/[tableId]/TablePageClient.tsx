"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function TablePageClient() {
  const params = useParams();
  const tableId = params?.tableId as string;
  const [rowCount, setRowCount] = useState(100000);

  const utils = api.useUtils();

  const { data: tableMeta, isLoading: isTableLoading, isError } =
    api.table.getById.useQuery(
      { tableId },
      { enabled: !!tableId }
    );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isRowsLoading,
  } = api.table.getRowsPaginated.useInfiniteQuery(
    {
      tableId,
      limit: 100,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!tableId,
    }
  );

  const addRows = api.table.addRows.useMutation({
    onSuccess: () => {
      utils.table.getById.invalidate({ tableId });
      utils.table.getRowsPaginated.invalidate();
    },
  });

  const allRows = data?.pages.flatMap((page) => page.rows) ?? [];

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
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
  }, [rowVirtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage]);

  if (isTableLoading || isRowsLoading)
    return <p className="p-4 text-gray-600">Loading table...</p>;
  if (isError || !tableMeta)
    return <p className="p-4 text-red-500">Failed to load table</p>;

  const columnMap = Object.fromEntries(
    tableMeta.columns.map((col) => [col.id, col.name])
  );

  const columns = ["ID", ...tableMeta.columns.map((col) => col.name)];

  return (
    <div className="space-y-4 p-4">
      <button
        onClick={() => addRows.mutate({ tableId, count: rowCount })}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Add {rowCount.toLocaleString()} Rows
      </button>

      <div className="border rounded-md overflow-auto">
        <div className="bg-gray-50 font-semibold text-sm text-gray-700 flex border-b">
          {columns.map((col) => (
            <div key={col} className="p-2 min-w-[150px]">
              {col}
            </div>
          ))}
        </div>

        <div
          ref={parentRef}
          className="relative h-[600px] overflow-y-auto border-t"
        >
          <div
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = allRows[virtualRow.index];

              if (!row) {
                return (
                  <div
                    key={virtualRow.key}
                    ref={virtualRow.measureElement}
                    className="absolute top-0 left-0 right-0 px-4 py-2 text-gray-400 text-sm"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isFetchingNextPage ? "Loading more..." : "No more rows"}
                  </div>
                );
              }

              return (
                <div
                  key={virtualRow.key}
                  ref={virtualRow.measureElement}
                  className="flex border-b text-sm"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="p-2 min-w-[150px] text-gray-500">{row.id}</div>
                  {tableMeta.columns.map((col) => {
                    const cell = row.cells.find((c) => c.columnId === col.id);
                    return (
                      <div key={col.id} className="p-2 min-w-[150px]">
                        {cell?.value}
                      </div>
                    );
                  })}ç
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
