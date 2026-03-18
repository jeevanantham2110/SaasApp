const Datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize NeDB Datastore
const db = Datastore.create({ filename: path.join(__dirname, '../data/users.db'), autoload: true });

// User "Model" Logic (NeDB doesn't have true models/schemas like Mongoose)
const User = {
  findOne: async (query) => {
    return db.findOne(query);
  },
  
  create: async (userData) => {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
    userData.createdAt = new Date();
    return db.insert(userData);
  },
  
  comparePassword: async (candidatePassword, hashedPassword) => {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};

module.exports = User;
