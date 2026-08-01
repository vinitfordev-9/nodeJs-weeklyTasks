const noteService = require("../services/noteService");

function getAllNotes(req, res) {
  const notes = noteService.getAllNotes();
  res.status(201).json(notes);
}

function createNotes(req, res) {
  const note = req.body;
  const createdNote = noteService.createNotes(note);
  res.status(201).json(createdNote);
}

function getNoteById(req, res) {
  const id = Number(req.params.id);

  const note = noteService.getNoteById(id);

  if (!note) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  res.status(200).json(note);
}
function updateNote(req, res) {
  const id = Number(req.params.id);

  const updatedData = req.body;

  const updatedNote = noteService.updateNote(id, updatedData);

  if (!updatedNote) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  res.status(200).json(updatedNote);
}
function deleteNote(req, res) {
  const id = Number(req.params.id);

  const deletedNote = noteService.deleteNote(id);

  if (!deletedNote) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  res.status(200).json({
    message: "Note deleted successfully",
    deletedNote,
  });
}

module.exports = {
  getAllNotes,
  createNotes,
  getNoteById,
  updateNote,
  deleteNote
};
