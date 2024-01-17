import { InferSelectModel, InferInsertModel, eq } from "drizzle-orm";
import { settings } from "../models/settings";
import { createRepository } from "../utils";
import { db } from "../db";
import { USER_ID } from "../../constants";

export type SettingsModel = InferSelectModel<typeof settings>;
export type SettingsInsertModel = InferInsertModel<typeof settings>;

export const SettingsCRUD = createRepository<
  SettingsModel,
  SettingsInsertModel
>(settings);

export class SettingsQueries {
  static getSettingsForUser(userId: number = USER_ID) {
    return db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .then((results) => results?.[0]);
  }
}
