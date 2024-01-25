import { Kysely, sql } from "kysely";

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
    .addColumn("book_id", "integer", (col) => col.notNull())
    .addForeignKeyConstraint(
      "book_id_fk",
      ["book_id"],
      "books",
      ["id"],
      (key) => {
        return key.onDelete("cascade");
      }
    )
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
    .addColumn("chapter_id", "integer", (col) => col.notNull())
    .addForeignKeyConstraint(
      "chapter_id_fk",
      ["chapter_id"],
      "chapters",
      ["id"],
      (key) => {
        return key.onDelete("cascade");
      }
    )
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

  // Seed initial data for user

  try {
    await sql`
  INSERT OR IGNORE INTO settings(id,user_id,threads,selected_model,created_at,modified_at)
  VALUES (0,1,2,'',0,0)
`.execute(db);

    await sql`
  INSERT INTO books(title)
  VALUES ('Introduction')
`.execute(db);

    await sql`
  INSERT INTO chapters(book_id,label,sort_order)
  VALUES (1,'Welcome',0)
`.execute(db);

    const now = Date.now() + 60 * 60 * 1000;

    await sql`
    INSERT INTO snippets(chapter_id,label,content,sort_order,recorded_at,processed_at,finished_at)
    VALUES (1,'Dark and Stormy Night', 'It was a dark and stormy night; the rain fell in torrents—except at occasional intervals, when it was checked by a violent gust of wind which swept up the streets (for it is in London that our scene lies), rattling along the housetops, and fiercely agitating the scanty flame of the lamps that struggled against the darkness.',0,${now},${now},${now})
`.execute(db);
  } catch (e) {
    console.log("Error in migration", { e });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("books").execute();
  await db.schema.dropTable("chapters").execute();
  await db.schema.dropTable("snippets").execute();
  await db.schema.dropTable("settings").execute();
}
