function parsePositiveId(value, entityName) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`${entityName} ID must be a positive integer`);
    error.status = 400;
    throw error;
  }

  return id;
}

module.exports = { parsePositiveId };
