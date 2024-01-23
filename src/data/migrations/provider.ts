import { MigrationProvider } from "kysely";
import * as migrations from "./index";

export class RuntimeMigrationProvider implements MigrationProvider {
  async getMigrations() {
    return migrations;
  }
}
