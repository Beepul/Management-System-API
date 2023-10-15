const express = require('express')
const { getAllNotes, createNewNote, updateNote, deleteNote } = require('../controllers/notesController')

const router = express.Router();

router.route('/')
    .get(getAllNotes)
    .post(createNewNote)
    .patch(updateNote)
    .delete(deleteNote)


module.exports = router;