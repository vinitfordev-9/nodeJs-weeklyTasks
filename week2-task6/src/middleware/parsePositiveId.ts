import { HttpError } from "../errors/HttpError";

export function parsePositiveId(value: string | string[] | undefined, entityName: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${entityName} ID must be a positive integer`);
  }
  return id;
}
