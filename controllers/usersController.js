const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// Get all users (/users , private)
const getAllUsers = asyncHandler(async (req,res) => {
    const users = await User.find().select('-password').lean()
    if(!users?.length){
        return res.status(400).json({message: 'No users found'})
    }
    res.json(users)
})

// Create new user (/users , private)
const createNewUser = asyncHandler(async (req,res) => {
    const {username,password,roles} = req.body;

    if(!username || !password ){
        return res.status(400).json({message: 'All fields are required'})
    }

    const duplicate = await User.findOne({username}).collation({locale:'en',strength:2}).lean().exec()

    if(duplicate){
        return res.status(409).json({message: 'Duplicate username'})
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userObject = (!Array.isArray(roles) || !roles.length) 
        ? {username,"password": hashedPassword} 
        : {username,"password":hashedPassword,roles}

    const user = await User.create(userObject);
    if(user){
        res.status(201).json({message: `New user ${username} created`})
    }else{
        res.status(400).json({message: 'Invalid user data recieved'});
    }

})

// Update user (/users , private)
const updateUser = asyncHandler(async (req,res) => {
    const { id, username , roles,active,password} = req.body;

    if( !id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean'){
        return res.status(400).json({message: 'All feilds are required'})
    }

    const user = await User.findById(id).exec()
    if(!user){
        return res.status(400).json('User not found')
    }
    const duplicate = await User.findOne({username}).collation({locale:'en',strength:2}).lean().exec();

    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: 'Duplicate Username'})
    }

    user.username = username
    user.roles = roles 
    user.active = active 

    if(password){
        user.password = await bcrypt.hash(password, 10)
    }
    const updatedUser = await user.save()
    res.json({message: `${updatedUser.username} updated`})
})

// Delete user (/users , private)
const deleteUser = asyncHandler(async (req,res) => {
    const {id} = req.body;
    if(!id){
        return res.status(400).json({message: 'User Id Required'})
    }
    const note = await Note.findOne({user: id}).lean().exec()
    if(note){
        return res.status(400).json({message: 'User has assigned notes so cant delete'})
    }

    const user = await User.findById(id).exec()
    if(!user){
        return res.status(400).json({message: 'User not found'})
    }
    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} is deleted`
    res.json(reply)
})

module.exports = {getAllUsers,createNewUser,updateUser,deleteUser}