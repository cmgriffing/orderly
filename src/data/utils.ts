import { db } from "./db";
import { TableConfig, eq } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";

export function createRepository<Model, InsertModel>(
  table: SQLiteTable<TableConfig>
) {
  return Object.freeze({
    create: (data: Omit<InsertModel, "id" | "createdAt" | "modifiedAt">) => {
      const now = Date.now();
      return (
        db
          .insert(table)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .values({
            ...data,
            createdAt: now,
            modifiedAt: now,
          })
          .returning()
          .then((result) => result[0] as Model | undefined)
      );
    },
    read: (id: number) =>
      db
        .select()
        .from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .where(eq((table as any).id, id))
        .then((result) => result[0] as Model | undefined),
    update: (
      id: number,
      data: Partial<Omit<InsertModel, "id" | "createdAt" | "modifiedAt">>
    ) =>
      db
        .update(table)
        .set({
          ...data,
          modifiedAt: Date.now(),
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .where(eq((table as any).id, id))
        .returning()
        .then((result) => result[0] as Model | undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: (id: number) => db.delete(table).where(eq((table as any).id, id)),
    list: () => db.select().from(table).all() as Promise<Model[]>,
  });
}
