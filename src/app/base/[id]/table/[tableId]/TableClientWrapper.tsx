"use client";

import dynamic from "next/dynamic";

// Dynamically import the client-side component
const TablePageClient = dynamic(() => import("./TablePageClient"), {
  ssr: false,
});

export default function TableClientWrapper() {
  return <TablePageClient />;
}
