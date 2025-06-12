// import {MongoClient} from "mongodb";

// const client = new MongoClient("mongodb://127.0.0.1");

// await client.connect();

// const db = client.db('mongodb_nodejs_db');

// const userCollection = db.collection("users");

// // userCollection.insertOne({name:"vinod1",age:24});

// // userCollection.insertMany([{name:"vinod2",age:24},{name:"vinod3",age:24},{name:"vinod4",age:24}])

// // Read

// // const usersCursor = userCollection.find();
// // console.log(usersCursor);

// // for await (const user of usersCursor){
// //     console.log(user);
    
// // }

// // const usersCursor = await userCollection.find().toArray();
// // console.log(usersCursor);


// // const user = await userCollection.findOne({name:"vinod"});
// // console.log(user);
// // console.log(user._id.toHexString());


// // Update
// // await userCollection.updateOne({name:"thapa"},{$set:{age:30}})

// // delete

// // await userCollection.deleteOne({name:"thapa"});

// const result = await userCollection.deleteMany({role:"user"});
// console.log(`${result.deletedCount} document deleted`);
