import { z } from "zod";
import { faker } from "@faker-js/faker";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        baseId: z.string().min(1),
        name: z.string().default("Untitled Table"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.create({
        data: {
          name: input.name,
          baseId: input.baseId,
        },
      });

      await ctx.db.column.createMany({
        data: [
          { name: "Name", type: "TEXT", tableId: table.id },
          { name: "Age", type: "NUMBER", tableId: table.id },
          { name: "Email", type: "TEXT", tableId: table.id },
        ],
      });

      const createdColumns = await ctx.db.column.findMany({
        where: { tableId: table.id },
      });

      for (let i = 0; i < 10; i++) {
        const row = await ctx.db.row.create({
          data: { tableId: table.id },
        });

        await ctx.db.cell.createMany({
          data: createdColumns.map((column) => ({
            rowId: row.id,
            columnId: column.id,
            value:
              column.name === "Name"
                ? faker.person.fullName()
                : column.name === "Age"
                ? faker.number.int({ min: 18, max: 60 }).toString()
                : faker.internet.email(),
          })),
        });
      }

      return table;
    }),

  getByBaseId: protectedProcedure
    .input(z.object({ baseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.table.findMany({
        where: { baseId: input.baseId },
        include: { columns: true },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ tableId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.table.findFirst({
        where: {
          id: input.tableId,
          base: { userId: ctx.session.user.id },
        },
        include: {
          columns: true,
        },
      });
    }),

  getRowsPaginated: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(1000).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.row.findMany({
        where: { tableId: input.tableId },
        include: { cells: true },
        orderBy: { createdAt: "asc" },
        take: input.limit + 1, // Fetch one extra to check if there's more
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      });

      let nextCursor: string | undefined = undefined;
      if (rows.length > input.limit) {
        const next = rows.pop(); // Remove the extra
        nextCursor = next?.id;
      }

      return {
        rows,
        nextCursor,
      };
    }),

  addRows: protectedProcedure
    .input(z.object({ tableId: z.string(), count: z.number().min(1).max(100_000) }))
    .mutation(async ({ input, ctx }) => {
      const columns = await ctx.db.column.findMany({
        where: { tableId: input.tableId },
      });

      // Step 1: Insert rows (outside of transaction to avoid timeout)
      await ctx.db.row.createMany({
        data: Array.from({ length: input.count }).map(() => ({
          tableId: input.tableId,
        })),
      });

      // Step 2: Fetch the rows just created
      const rows = await ctx.db.row.findMany({
        where: { tableId: input.tableId },
        orderBy: { createdAt: "desc" },
        take: input.count,
      });

      // Step 3: Create cells
      const cells = rows.flatMap((row) =>
        columns.map((col) => ({
          rowId: row.id,
          columnId: col.id,
          value:
            col.name.toLowerCase().includes("email")
              ? faker.internet.email()
              : col.name.toLowerCase().includes("name")
              ? faker.person.fullName()
              : faker.lorem.word(),
        }))
      );

      // Step 4: Insert cells in chunks
      const chunkSize = 10_000;
      for (let i = 0; i < cells.length; i += chunkSize) {
        const chunk = cells.slice(i, i + chunkSize);
        await ctx.db.cell.createMany({ data: chunk });
      }

      return rows.length;
    }),
});
