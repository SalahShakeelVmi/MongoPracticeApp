const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 5000;
app.use(cors()); 
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://salahshakeelvmi:salahshakeelvmi@cluster0.cltwsku.mongodb.net/PracticeDB?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const usersCollection = mongoose.connection.client.db().collection('users');

// app.get('/users', async (req, res) => {
//     try {
      
//         const usersData = await usersCollection.find({}).toArray();
//         return res.json(usersData);
//     } catch (error) {
//         console.error('Error getting users data:', error);
//         return res.status(500).send('Internal Server Error');
//     }
// });

app.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const searchQuery = req.query.search || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    console.log(startDate, endDate);

    // Construct a dynamic query based on the search query and date range
    const query = {};
    if (searchQuery) {
      query.name = { $regex: new RegExp(searchQuery, 'i') };
    }
    if (startDate && endDate) {
     

      // Add date range to the query
      query.date = { $gte: startDate, $lte: endDate };

    }

    // Fetch total users count with the search query and date range
    const totalUsers = await usersCollection.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / pageSize);

    

    // Fetch users data with pagination, search query, and date range
    const usersData = await usersCollection
      .find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
      console.log(usersData);

    return res.json({
      data: usersData,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error getting users data:', error);
    return res.status(500).send('Internal Server Error');
  }
});



app.post('/users', async (req, res) => {
    try{
        const newUser = req.body; // Assuming your request body contains the new user data
        const result = await usersCollection.insertOne(newUser);
        return res.send(result); // Return the newly created user
    }
    catch(error){
        console.error('Error creating new user:', error);
        return res.send('Internal Server Error');
    }
});

app.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const objectId = new ObjectId(userId);
        const updatedUser = req.body; // Assuming your request body contains the updated user data
        const result = await usersCollection.updateOne({ _id: objectId }, { $set: updatedUser });
        return res.send(result); // Return the updated user
    } catch (error) {
        console.error('Error updating user:', error);
        return res.send('Internal Server Error');
    }
});

app.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        // Convert userId to ObjectId
        const objectId = new ObjectId(userId);
        
        const result = await usersCollection.deleteOne({ _id: objectId });

        if (result.deletedCount === 1) {
            console.log(`User with ID ${userId} deleted successfully`);
            return res.send(`User with ID ${userId} deleted successfully`); // 204 No Content - indicates successful deletion
        } else {
            console.log(`User with ID ${userId} not found`);
            return res.send('User not found');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.send('Internal Server Error');
    }
});

app.post('/users/bulk-delete', async (req, res) => {
    try {
        const userIds = req.body.data; // Extract 'data' property from the request body
        const result = await usersCollection.deleteMany({ _id: { $in: userIds.map((id) => new ObjectId(id)) } });
        console.log('Deleted users:', result);
        return res.send(result);
    } catch (error) {
        console.error('Error deleting users:', error);
        return res.status(500).send('Internal Server Error');
    }
});

  

app.get('/users/check-email/:email', async (req, res) => {
    try {
      const userEmail = req.params.email;
      const existingUser = await usersCollection.findOne({ email: userEmail });
  
      if (existingUser) {
        // Email already exists
        return res.json({ isUnique: false });
      } else {
        // Email is unique
        return res.json({ isUnique: true });
      }
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


  // role based urls
  const roleBasedUsersCollection = mongoose.connection.client.db().collection('roleBasedUsers');
  app.get('/users/rolebased', async (req, res) => {
    try {   
        const usersData = await roleBasedUsersCollection.find({}).toArray();
        return res.json(usersData[0]["users"]);
    } catch (error) {
        console.error('Error getting users data:', error);
        return res.status(500).send('Internal Server Error');
    }
});