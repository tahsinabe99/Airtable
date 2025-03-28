import { z } from "zod";
import { faker } from "@faker-js/faker";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({
  // ✅ Create Table
  create: protectedProcedure
    .input(
      z.object({
        baseId: z.string().min(1),
        name: z.string().default("Untitled Table"),
      }),
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
        where: {
          baseId: input.baseId,
        },
        include: {
          columns: true,
        },
      });
    }),

    getById: protectedProcedure
    .input(z.object({ tableId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.table.findFirst({
        where: {
          id: input.tableId,
          base: {
            userId: ctx.session.user.id, // ✅ only allow access if the table's base belongs to the user
          },
        },
        include: {
          columns: true,
          rows: {
            include: {
              cells: true,
            },
          },
        },
      });
    }),
  
  
});
