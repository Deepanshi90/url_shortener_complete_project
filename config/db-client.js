// // import { MongoClient } from "mongodb";
// // import { env } from "./env.js";

// // export const dbClient = new MongoClient(env.MONGODB_URI)
// // // create a new method by which we can use all the properties methods etc



// // import mongoose from "mongoose";
// // import {env} from "./env.js";

// // export const connectDB = async() =>{
// //     try {
// //         await mongoose.connect(env.MONGODB_URI);
// //     } catch (error) {
// //         console.error(error);

// //     }
// // }


// import mysql from "mysql2/promise";
// import { env } from "./env.js";

// export const db = await mysql.createConnection({
//     host: env.DATABASE_HOST,
//     user: env.DATABASE_USER,
//     password: env.DATABASE_PASSWORD,
//     database: env.DATABASE_NAME,
// })