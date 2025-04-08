"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";

import {
  FaUndo,
  FaQuestionCircle,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

export default function TablePageClient() {
  const params = useParams();
  const tableId = params?.tableId as string;
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  


  const [rowCount, setRowCount] = useState(100_000);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");

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

  const updateCell = api.table.updateCell.useMutation({
    onSuccess: () => {
      utils.table.getById.invalidate({ tableId });
      utils.table.getRowsPaginated.invalidate();
    },
  });

  const addColumn = api.table.addColumn.useMutation({
    onSuccess: () => {
      utils.table.getById.invalidate({ tableId });
      router.refresh(); // re-fetch the data and trigger a re-render
    },
  });
  
  
  

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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-yellow-400 px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">📦 Untitled Base</h1>
          {["Data", "Automations", "Interfaces", "Forms"].map((tab) => (
            <button
              key={tab}
              className="rounded-full bg-yellow-300 px-3 py-1 text-sm shadow-inner hover:shadow-md cursor-pointer"
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <FaUndo className="cursor-pointer" />
          <FaQuestionCircle className="cursor-pointer" />
          <button className="rounded-full bg-white px-3 py-1 text-sm font-semibold">
            👥 Share
          </button>
          <FaBell className="cursor-pointer" />
          <FaUserCircle className="text-2xl cursor-pointer text-red-500" />
        </div>
      </div>

      {/* Sub-header Tabs */}
      <div className="flex justify-between items-center bg-yellow-500 px-4 py-1 text-sm">
        <div className="flex items-center space-x-1">
          {["Table 1", "Table 2", "Table 3"].map((t) => (
            <button
              key={t}
              className={`px-3 py-1 ${
                t === "Table 1" ? "bg-white" : "bg-yellow-500"
              } rounded-sm hover:shadow cursor-pointer`}
            >
              {t}
            </button>
          ))}
          <button className="px-2 text-lg hover:shadow cursor-pointer">＋</button>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm cursor-pointer hover:underline">Extensions</button>
          <button className="text-sm cursor-pointer hover:underline">Tools</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b text-sm">
        <div className="flex items-center gap-3">
          {[
            "Views",
            "Grid view",
            "Hide fields",
            "Filter",
            "Group",
            "Sort",
            "Color",
            "Share and sync",
            "Add 100,000 Rows",
          ].map((btn) => (
            <button
              key={btn}
              onClick={() =>
                btn === "Add 100,000 Rows" &&
                addRows.mutate({ tableId, count: rowCount })
              }
              className="hover:shadow-md rounded px-3 py-1"
            >
              {btn}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded border px-2 py-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && setQuery(search)}
          />
          <button
            onClick={() => setQuery(search)}
            className="rounded bg-gray-200 px-3 py-1 text-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Table */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-gray-300 bg-white p-2 text-sm">

          <div className="p-2">
            <input
              type="text"
              placeholder="Find a view"
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>

          <div className="p-2">
            <div className="font-semibold mb-2 text-blue-700 bg-blue-100 rounded px-2 py-1 flex items-center justify-between">
              <span>▦ Grid view</span>
              <span className="text-sm">✔</span>
            </div>
          </div>

          <div className="h-75" />

          <hr className="my-2 border-gray-300" />

          <div className="p-2 mt-auto">
            <div className="font-semibold mb-2">Create...</div>
            <ul className="space-y-1">
              {[
                ["▦ Grid"],
                ["🗓 Calendar", "text-red-600"],
                ["🖼 Gallery", "text-pink-600"],
                ["📊 Kanban", "text-green-600"],
                ["🕒 Timeline", "text-indigo-600", "Team"],
                ["📋 List"],
                ["🗂 Gantt", "text-teal-600", "Team"],
                ["📁 Section", "", "Team"],
              ].map(([label, color = "", badge]) => (
                <li key={label} className="flex justify-between items-center">
                  <span className={color}>{label}</span>
                  <div className="flex items-center gap-1">
                    {badge && (
                      <span className="bg-blue-100 text-blue-700 text-xs rounded px-1">
                        {badge}
                      </span>
                    )}
                    <span className="text-gray-400">＋</span>
                  </div>
                </li>
              ))}
            </ul>

            <hr className="my-2 border-gray-300" />

            <div className="flex justify-between items-center mt-1">
              <span className="text-pink-600">✨ Form</span>
              <span className="text-gray-400">＋</span>
            </div>
          </div>
        </aside>

        {/* Table Content */}
        <div ref={parentRef} className="flex-1 overflow-auto border-t border-gray-200 bg-white">
        {/*From here*/}
        <div
          className="grid sticky top-0 z-10 bg-gray-100 text-black font-semibold text-sm border-b border-gray-300"
          style={{
            gridTemplateColumns: `repeat(${tableData.columns.length + 1}, minmax(150px, 1fr))`,
          }}
        >
          {tableData.columns.map((col) => (
            <div
              key={col.id}
              className="px-3 py-2 border-r border-gray-300"
            >
              {col.name}
            </div>
          ))}
          <div
            onClick={() => {
              const name = prompt("Enter column name:");
              if (name) {
                addColumn.mutate({ tableId, name });
              }
            }}
            className="px-3 py-2 text-lg text-gray-500 border-r border-gray-300 cursor-pointer hover:bg-gray-200 flex items-center justify-center"
          >
            ＋
          </div>
        </div>
{/*This*/}

        


          {/*From here*/}
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
            className="grid border-b border-gray-300 text-sm"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vRow.start}px)`,
              gridTemplateColumns: `repeat(${tableData.columns.length + 1}, minmax(150px, 1fr))`,
            }}
          >

              {tableData.columns.map((col, index) => {
                const isEditing =
                  editingCell?.rowId === row.id && editingCell?.columnId === col.id;

                return (
                  <div
                    key={col.id}
                    className={`flex-1 px-3 py-2 truncate hover:bg-gray-100 cursor-pointer border-r ${
                      index === tableData.columns.length - 1 ? "border-r-0" : "border-gray-200"
                    }`}
                    onDoubleClick={() => {
                      setEditingCell({ rowId: row.id, columnId: col.id });
                      setEditingValue(cellMap[col.id] ?? "");
                    }}
                  >
                    {isEditing ? (
                      <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => {
                          if (editingCell && editingValue.trim() !== "") {
                            updateCell.mutate({
                              rowId: editingCell.rowId,
                              columnId: editingCell.columnId,
                              value: editingValue,
                            });
                          }
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingCell) {
                            updateCell.mutate({
                              rowId: editingCell.rowId,
                              columnId: editingCell.columnId,
                              value: editingValue,
                            });
                            setEditingCell(null);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      cellMap[col.id]
                    )}
                  </div>
                );
              })}

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
