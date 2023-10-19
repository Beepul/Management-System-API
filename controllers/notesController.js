const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const Counter = require('../models/Counter');


// get all notes
const getAllNotes = asyncHandler(async (req,res) =>{
    const notes = await Note.find().lean();
    if(!notes?.length){
        return res.status(400).json({message: 'Notes not found'})
    }
    return res.json(notes)
})

// create new note
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body;
  
    if (!user || !title || !text) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    const duplicate = await Note.findOne({ title }).collation({locale:'en',strength:2}).lean().exec();
    console.log('duplicate', duplicate);
    if (duplicate) {
      return res.status(409).json({ message: 'Duplicate note title' });
    }
  
    // Create a new note
    const noteObject = { user, title, text };
    console.log('object', noteObject);
    const note = await Note.create(noteObject);
    console.log('note created', note);
  
    if (note) {
        const updatedTicket = await Counter.findOneAndUpdate(
            { id: 'ticketNums' },
            { $inc: { ticket: 1 } },
            {new: true}
            );
        if(updatedTicket){
            res.status(201).json({
              message: `New note with title ${note.title} created with ticket number : ${updatedTicket.ticket}`,
              note,
            });
        }else{
            const ticket = await Counter.create({ id: 'ticketNums', ticket: 1 });
            res.status(201).json({
                message: `New note with title ${note.title} created with ticket number : ${ticket.ticket}`,
                note,
            });
        }
    } else {
      res.status(400).json({ message: 'Invalid note data received' });
    }
  });

//   Update
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm note exists to update
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({locale:'en',strength:2}).lean().exec()

    // Allow renaming of the original note 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json(`'${updatedNote.title}' updated`)
})

// Delete
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID required' })
    }

    // Confirm note exists to delete 
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    const result = await note.deleteOne()

    const reply = `Note '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
})
  

module.exports = {createNewNote,getAllNotes,updateNote,deleteNote}