import mongoose from "mongoose";

// step 1 to connect to the mongodb server
try {
    await mongoose.connect("mongodb://localhost:27017/mongoose_middleware");
    mongoose.set("debug",true);

} catch (error) {
    console.log(error);
    process.exit();

}


// step 2: create schema
const userSchema = mongoose.Schema({
    // name: String,
    name: {type:String,required: true},
    email:{type:String,required: true , unique: true},
    age:{type: Number , required: true , min: 5},
    // createdAt: {type:Date , default : Date.now()},
    // updatedAt: {type:Date , default : Date.now()},
},{
    timestamps: true,
})

// we will use middleware
// userSchema.pre("save",function(next) {
//     userSchema.pre(["updateOne","updateMany","findOneAndUpdate"],function(next) {
//         this.set({updatedAt: Date.now()});
//         next();
//     }) 
// // step 3: create a model

const Users = mongoose.model("user", userSchema);

// await Users.create({name:"thapa" , age : 31 , email: "thapa@gmail.com"});
await Users.updateOne({email: "thapa@gmail.com"},{$set: {age: 21}});

await mongoose.connection.close();

// const newUser = new Test({
//     name: "Payal",
//     email: "payal@gmail.com",
//     age: 25,
// })

// await newUser.save();