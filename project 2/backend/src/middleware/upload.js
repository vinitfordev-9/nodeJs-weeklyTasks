import multer from "multer";
import { AppError, RESPONSES } from "../common/responses.js";
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 1,
    fieldSize: 12000,
    parts: 2,
  },
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype !== "application/pdf" ||
      !file.originalname.toLowerCase().endsWith(".pdf")
    )
      return callback(new AppError(RESPONSES.UPLOAD));
    callback(null, true);
  },
}).single("resume");
export function requirePdf(req, res, next) {
  if (
    !req.file ||
    req.file.buffer.subarray(0, 5).toString() !== "%PDF-" ||
    !req.file.buffer.subarray(-2048).includes(Buffer.from("%%EOF"))
  )
    throw new AppError(RESPONSES.UPLOAD);
  next();
}
