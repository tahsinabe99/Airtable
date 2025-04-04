// src/app/base/[id]/table/[tableId]/page.tsx

"use client";

import dynamic from "next/dynamic";

// Lazy load the client-side component (optional but clean)
const TablePageClient = dynamic(() => import("./TablePageClient"), {
  ssr: false, // disables server-side rendering (required if you use hooks like useSession)
});

export default function TablePageWrapper() {
  return <TablePageClient />;
}
