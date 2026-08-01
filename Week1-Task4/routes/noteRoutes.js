const express = require("express");
const router = express.Router();

const noteController = require("../controllers/noteController");
const validateNote = require("../middleware/validateNote");

router.get("/notes", noteController.getAllNotes);
router.post("/notes",validateNote, noteController.createNotes);
router.get("/notes/:id", noteController.getNoteById);
router.put("/notes/:id",validateNote, noteController.updateNote);
router.delete("/notes/:id", noteController.deleteNote);

module.exports = router;
