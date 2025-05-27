import mongoose from 'mongoose';

mongoose.set('strictQuery', false);

const CONNECTION_STRING = process.env.CONNECTION_STRING;

mongoose.connect(CONNECTION_STRING)
    .then(() => {
        console.log("Database connected successfully!");
    })
    .catch((error) => {
        console.error('Database connection failed!');
    });
