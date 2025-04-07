// src/app/base/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export default async function BasePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return notFound();

  const baseId = params.id;

  // Fetch base and its tables
  const base = await db.base.findFirst({
    where: {
      id: baseId,
      userId: session.user.id,
    },
    include: {
      tables: {
        orderBy: { id: "asc" }, // fallback sort (we can remove this if unnecessary)
      },
    },
  });

  if (!base) return notFound();

  // If base has no tables, create one
  let table = base.tables[0];
  if (!table) {
    table = await db.table.create({
      data: {
        name: "Untitled Table",
        baseId: base.id,
      },
    });

    // Create 3 default columns
    await db.column.createMany({
      data: [
        { name: "Name", type: "TEXT", tableId: table.id },
        { name: "Age", type: "NUMBER", tableId: table.id },
        { name: "Email", type: "TEXT", tableId: table.id },
      ],
    });
  }

  // Redirect to the first table
  redirect(`/base/${baseId}/table/${table.id}`);
}
