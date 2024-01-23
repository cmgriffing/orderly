import { Kysely } from "kysely";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("books")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .addColumn("modified_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .ifNotExists()
    .execute();

  await db.schema
    .createTable("chapters")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("sort_order", "real", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .addColumn("modified_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .addColumn("book_id", "integer", (col) => col.notNull().onDelete("cascade"))
    .addForeignKeyConstraint("book_id_fk", ["book_id"], "books", ["id"])
    .ifNotExists()
    .execute();

  await db.schema
    .createTable("snippets")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("content", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("sort_order", "real", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .addColumn("modified_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .addColumn("recorded_at", "integer", (col) => col.defaultTo(0))
    .addColumn("processed_at", "integer", (col) => col.defaultTo(0))
    .addColumn("finished_at", "integer", (col) => col.defaultTo(0))
    .addColumn("raw_recording_content", "text", (col) => col.defaultTo(""))
    .addColumn("chapter_id", "integer", (col) =>
      col.notNull().onDelete("cascade")
    )
    .addForeignKeyConstraint("chapter_id_fk", ["chapter_id"], "chapters", [
      "id",
    ])
    .ifNotExists()
    .execute();

  await db.schema
    .createTable("settings")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("user_id", "integer", (col) => col.notNull().unique())
    .addColumn("threads", "integer", (col) => col.notNull().defaultTo(2))
    .addColumn("selected_model", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("created_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .addColumn("modified_at", "integer", (col) =>
      col.defaultTo(Date.now()).notNull()
    )
    .ifNotExists()
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("books").execute();
  await db.schema.dropTable("chapters").execute();
  await db.schema.dropTable("snippets").execute();
  await db.schema.dropTable("settings").execute();
}
