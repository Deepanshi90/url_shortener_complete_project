import { name } from "ejs";
import mongoose from "mongoose";
import { Schema } from "zod";

// step 1 to connect to the mongodb server
try {
    await mongoose.connect("mongodb://127.0.0.1/mongoose_database");
    mongoose.set("debug",true);
} catch (error) {
    console.error(error);
    process.exit();    
}

// step 2 create Schema

const userSchema = mongoose.Schema({
    // name: String,
    name:{type: String, require: true},
    email:{type:String,required: true , unique: true},
    age:{type: Number , required: true , min: 5},
    createdAt: {type:Date , default : Date.now()}

})

// step 3 create a model

const Users =  mongoose.model("User",userSchema);

await Users.create({name:"thapa" , age : 31 , email: "thapa@gmail.com"});
await mongoose.connection.close();