import express from "express";
import {shortenerRoutes} from "./routes/shortener.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import {verifyAuthentication} from "./middlewares/verify-auth-middleware.js";
import session from "express-session";
import flash from "connect-flash";
import requestIp from "request-ip";
// import { env } from "./config/env.js";
// import { connectDB } from "./config/db-client.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use('/uploads', express.static('uploads'));

app.use(express.urlencoded({extended:true}))

app.set("view engine","ejs");
// express router
// app.use(router)
app.use(cookieParser());

app.use(session({secret:"my-secret",resave:true,saveUninitialized:false}))
app.use(flash());
app.use(requestIp.mw());
// this must beafter cookie parser middleware
app.use(verifyAuthentication);


app.use((req,res,next) =>{
    res.locals.user = req.user;
    return next();
})

app.use(authRoutes);
app.use(shortenerRoutes);

try {
//    await connectDB();
   app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 
} catch (error) {
    console.error(error);
    
}


