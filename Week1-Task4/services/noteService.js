const notes = [];

function getAllNotes() {
  return notes;
}

function createNotes(note) {
  const newNote = {
    id: notes.length + 1,
    title: note.title,
    content: note.content,
  };
  notes.push(newNote);
  return newNote;
}

function getNoteById(id) {
  const note = notes.find((note) => note.id === id);
  return note;
}

function updateNote(id, updatedData) {
  const note = notes.find((note) => note.id === id);
  if (!note) {
    return null;
  }
  note.title = updatedData.title;
  note.content = updatedData.content;
  return note;
}
function deleteNote(id) {
  const index = notes.findIndex((note) => note.id === id);

  if (index === -1) {
    return null;
  }

  const deletedNote = notes.splice(index, 1);

  return deletedNote[0];
}
module.exports = {
  getAllNotes,
  createNotes,
  getNoteById,
  updateNote,
  deleteNote
};
