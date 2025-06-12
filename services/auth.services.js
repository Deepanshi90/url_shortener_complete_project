import { oauthAccountsTable, passwordResetTokensTable, sessionsTable, shortLinksTable, userTables, verifyEmailTokensTable } from "../drizzle/schema.js"
import { db } from "../config/db.js";
import bcrypt from "bcrypt";
import argon2 from "argon2";
import jwt from "jsonwebtoken"
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import crypto from "crypto";
import { sendEmail } from "../lib/nodemailer.js";
// import { sendEmail } from "../lib/send-email.js";
import path from "path";
import fs from "fs/promises";
import { link } from "fs";
import ejs from "ejs";
import mjml2html from "mjml";

// check the email is exist or not
export const getUserByEmail = async(email) =>{
    const [user] = await db.select().from(userTables).where(eq(userTables.email,email));
    return user;
}

export const createUser = async({name,email,password}) =>{
    return await db.insert(userTables).values({name,email,password}).$returningId();
}

// export const createUser = async({ name, email, password }) => {
//    const [user] = await db.insert(userTables)
//         .values({ name, email, password })
//         .returning();  // returns full object(s)
//         return user;
// };

export const hashPassword = async(password) =>{
    // return await bcrypt.hash(password,10);
    return await argon2.hash(password);
}

export const comparePassword = async(password,hash) =>{
    // return await bcrypt.compare(password,hash);
    return await argon2.verify(hash,password);
    // in this has password come firast then jo user enter kar raha ha password
}

// export const generateToken = ({id,name,email}) =>{
//     return jwt.sign({id,email,name},process.env.JWT_SECRET,{ expiresIn: "30d" }
//     )
// }

export const createSession = async(userId,{ip,userAgent}) =>{
    const [session] = await db.insert(sessionsTable).values({userId,ip,userAgent}).$returningId();
    return session;
}

export const createAccessToken = ({id,name,email,sessionId}) =>{
    return jwt.sign({id,name,email,sessionId},process.env.JWT_SECRET,{expiresIn: ACCESS_TOKEN_EXPIRY/MILLISECONDS_PER_SECOND})
}

export const createRefreshToken= (sessionId) =>{
    return jwt.sign({sessionId},process.env.JWT_SECRET,{expiresIn: REFRESH_TOKEN_EXPIRY/MILLISECONDS_PER_SECOND})
}

export const verifyJWTToken = (token) =>{
    return jwt.verify(token,process.env.JWT_SECRET);
}

export const findSessionById = async(sessionId) =>{
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id,sessionId));
    return session;
}

export const findUserById = async(userId)=>{
    const [user] = await db.select().from(userTables).where(eq(userTables.id,userId));
    return user;
}

export const refreshTokens = async(refreshToken) =>{
    try {
         const decodedToken = verifyJWTToken(refreshToken);
         const currentSession = await findSessionById(decodedToken.sessionId);
         if(!currentSession || !currentSession.valid){
            throw new Error("Invalid Session");
         }
         const user = await findUserById(currentSession.userId);

         if(!user) throw new Error("Invalid User");

         const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
              isEmailValid: user.isEmailValid,
            sessionId: currentSession.id,
         }
         const newAccessToken = createAccessToken(userInfo)

    const newRefreshToken = createRefreshToken(currentSession.id);

    return {
        newAccessToken,newRefreshToken,user: userInfo
    }
    } catch (error) {
        console.log(error.message);
        
    }
}

// clearUserSession
export const clearUserSession = async(sessionId) =>{
    return db.delete(sessionsTable).where(eq(sessionsTable.id,sessionId));
}


export const authenticateUser = async({req,res,user,name,email}) =>{
      const session = await createSession(user.id,{ip:req.clientIp,userAgent:req.headers["user-agent"]})
    
        // creacte access_token
    
        const accessToken = createAccessToken({
            id: user.id,
            name: user.name || name,
            email:user.email || email,
            isEmailValid: false,
            sessionId: session.id
        })
    
        const refreshToken = createRefreshToken(session.id);
    
        const baseConfig = {
            httpOnly: true, secure: true
        };
    
        res.cookie("access_token",accessToken,{
            ...baseConfig,
            maxAge: ACCESS_TOKEN_EXPIRY
        })
        res.cookie("refresh_token",refreshToken,{
            ...baseConfig,
            maxAge: REFRESH_TOKEN_EXPIRY
        })
}


export const getAllShortLinks = async(userId) =>{
    return await db.select().from(shortLinksTable).where(eq(shortLinksTable.userId,userId));
}

// generate random token

export const generateRandomToken = (digit = 8) => {
    const min = 10 ** (digit - 1);
    const max = 10 ** digit;
    return crypto.randomInt(min,max).toString();   
}

export const  insertVerificationEmailToken = async({userId,token}) =>{
    // console.log("token",token);
    
    return db.transaction(async(tx) =>{
 try {
      await tx.delete(verifyEmailTokensTable).where(lt(verifyEmailTokensTable.expiresAt,sql`CURRENT_TIMESTAMP`));
      await tx.delete(verifyEmailTokensTable).where(eq(verifyEmailTokensTable.userId,userId));
    await tx.insert(verifyEmailTokensTable).values({userId,token});
  } catch (error) {
    console.error("Failed to insert verification token",error);
    throw new Error("Unable to create verification token");
    
  }
    })

 
}

// export const createVerifyEmailLink = async({email,token}) =>{
//     const uriEncodedEmail = encodeURIComponent(email);
//     return `${process.env.FRONTEND_URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`;
// }

export const createVerifyEmailLink = async({email,token}) =>{
    const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
    url.searchParams.append("token",token);
    url.searchParams.append("email",email);

    return url.toString();
}

// /findVerificationEmailToken

// export const findVerificationEmailToken = async ({ token, email }) => {
//   const tokenData = await db
//     // .select({ key: table.column })
//     .select({
//       userId: verifyEmailTokensTable.userId,
//       token: verifyEmailTokensTable.token,
//       expiresAt: verifyEmailTokensTable.expiresAt,
//     })
//     .from(verifyEmailTokensTable)
//     .where(
//       and(
//         eq(verifyEmailTokensTable.token, token),
//         gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
//       )
//     );

//   // If no token found, return null
//   if (!tokenData.length) {
//     return null;
//   }

//   const { userId } = tokenData[0];
//   // const userId = tokenData[0].userId;

//   const userData = await db
//     .select({
//       userId: userTables.id,
//       email: userTables.email,
//     })
//     .from(userTables)
//     .where(eq(userTables.id, userId));

//   // If user not found, return null
//   if (!userData.length) {
//     return null;
//   }

//   return {
//     userId: userData[0].userId,
//     email: userData[0].email,
//     token: tokenData[0].token,
//     expiresAt: tokenData[0].expiresAt,
//   };
// };

export const findVerificationEmailToken = async ({ token, email }) => {
  console.log("token: ", token);

  return db
    .select({
      userId: userTables.id,
      email: userTables.email,
      token: verifyEmailTokensTable.token,
      expiresAt: verifyEmailTokensTable.expiresAt,
    })
    .from(verifyEmailTokensTable)
    .where(
      and(
        eq(verifyEmailTokensTable.token, token),
        eq(userTables.email, email),
        gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
      )
    )
    .innerJoin(userTables, eq(verifyEmailTokensTable.userId, userTables.id));
};

export const verifyUserEmailAndUpdate = async(email) =>{
    return db.update(userTables)
    .set({isEmailValid: true}).
    where(eq(userTables.email,email));
}

export const clearVerifyEmailTokens = async(userId) =>{
    // const [user] = await db.select().from(userTables).where(eq(userTables.email,email));



    return await db.delete(verifyEmailTokensTable).where(eq(verifyEmailTokensTable.userId,userId))
}


export const sendNewVerifyEmailLink = async({userId,email}) =>{
  const randomToken = generateRandomToken();
  
      await insertVerificationEmailToken({userId, token: randomToken});
  
      const verifyEmailLink = await createVerifyEmailLink({
          email,
          token: randomToken
      })
// to get file data
      const mjmlTemplate = await fs.readFile(path.join(import.meta.dirname,"..","emails","verify-email.mjml"),"utf-8");
      // to replace the placeholder with dynamic value
      const filledTemplate = ejs.render(mjmlTemplate,{code: randomToken, link: verifyEmailLink})

      // convert mjml to html

      const htmlOutput = mjml2html(filledTemplate).html;
      // console.log(mjmlTemplate);
      
  
      sendEmail({
          to: email,
          subject: "Verify your Email",
          html: htmlOutput
      }).catch(console.error);
}


export const updateUserByName = async({userId,name,avatarUrl})=>{
    return await db.update(userTables).set({name: name,avatarUrl:avatarUrl}).where(eq(userTables.id,userId));
}


export const updateUserPassword = async({userId,newPassword}) =>{
    const newHashPassword = await hashPassword(newPassword);

    return await db.update(userTables).set({password:newHashPassword}).where(eq(userTables.id,userId));
}

export const findUserByEmail = async(email) =>{
    const [user] = await db.select().from(userTables).where(eq(userTables.email,email));
    
    return user;
}

// 1. random token
// 2. concvert into hash token
// 3. clear the user prev. data - delete
// 4. now we need to insert userid, hashtoken
// 5. return the link (create the link)


export const createResetPasswordLink = async({userId}) =>{
    const randomToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(randomToken).digest("hex");

    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId,userId));

    await db.insert(passwordResetTokensTable).values({userId,tokenHash});

    return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`;

}

export const getResetPasswordToken = async(token) =>{
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [user] = await db.select().from(passwordResetTokensTable).where(and(eq(passwordResetTokensTable.tokenHash,tokenHash),
gte(passwordResetTokensTable.expiresAt,sql`CURRENT_TIMESTAMP`)));

    return user;
}

export const clearResetPasswordToken = async(userId) =>{
    return await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId,userId));
}


export async function getUserWithOauthId({ email, provider }) {
  const [user] = await db
    .select({
      id: userTables.id,
      name: userTables.name,
      email: userTables.email,
      isEmailValid: userTables.isEmailValid,
      providerAccountId: oauthAccountsTable.providerAccountId,
      provider: oauthAccountsTable.provider,
    })
    .from(userTables)
    .where(eq(userTables.email, email))
    .leftJoin(
      oauthAccountsTable,
      and(
        eq(oauthAccountsTable.provider, provider),
        eq(oauthAccountsTable.userId, userTables.id)
      )
    );

  return user;
}

export async function linkUserWithOauth({
  userId,
  provider,
  providerAccountId,
  avatarUrl,
}) {
  await db.insert(oauthAccountsTable).values({
    userId,
    provider,
    providerAccountId,
  });

  if (avatarUrl) {
    await db
      .update(userTables)
      .set({ avatarUrl })
      .where(and(eq(userTables.id, userId), isNull(userTables.avatarUrl)));
  }
}

export async function createUserWithOauth({
  name,
  email,
  provider,
  providerAccountId,
  avatarUrl,
}) {
  const user = await db.transaction(async (trx) => {
    const [user] = await trx
      .insert(userTables)
      .values({
        email,
        name,
        // password: "",
        avatarUrl,
        isEmailValid: true, // we know that google's email are valid
      })
      .$returningId();

    await trx.insert(oauthAccountsTable).values({
      provider,
      providerAccountId,
      userId: user.id,
    });

    return {
      id: user.id,
      name,
      email,
      isEmailValid: true, // not necessary
      provider,
      providerAccountId,
    };
  });

  return user;
}
