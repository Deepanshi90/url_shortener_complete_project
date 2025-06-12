import { ACCESS_TOKEN_EXPIRY, OAUTH_EXCHANGE_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { getHtmlFromMjmlTemplate } from "../lib/get-html-from-mjml-template.js";
import { sendEmail } from "../lib/nodemailer.js";
// import { sendEmail } from "../lib/send-email.js";
import { authenticateUser, clearResetPasswordToken, clearUserSession, clearVerifyEmailTokens, comparePassword, createAccessToken, createRefreshToken, createResetPasswordLink, createSession, createUser,
    createUserWithOauth,
    createVerifyEmailLink,
    findUserByEmail,
    findUserById,
    findVerificationEmailToken,
    generateRandomToken,
    getAllShortLinks,
    getResetPasswordToken,
    //  generateToken,
     getUserByEmail, getUserWithOauthId, hashPassword, 
     insertVerificationEmailToken,
     linkUserWithOauth,
     sendNewVerifyEmailLink,
     updateUserByName,
     updateUserPassword,
     verifyUserEmailAndUpdate} from "../services/auth.services.js";
import { forgotPasswordSchema, loginUserSchema, registerUserSchema, setPasswordSchema, verifyEmailSchema, verifyPasswordSchema, verifyResetPasswordSchema, verifyUserSchema } from "../validators/auth-validator.js";
import {google} from "../lib/oauth/google.js";
import { github } from "../lib/oauth/github.js";


export const getRegisterPage = (req,res) =>{
    if(req.user) return res.redirect("/");
   return res.render("../views/auth/register",{errors: req.flash("errors")});
}


export const postRegister = async (req,res) =>{
    if(req.user) return res.redirect("/");
    console.log(req.body);
    // const {name,email,password} = req.body;

const { data, error } = registerUserSchema.safeParse(req.body);

if (error) {
    console.log("Validation Error:", error);  // ✅ Add this line
    const errors = error.errors[0].message;
    req.flash("errors", errors);
    return res.redirect("/register");
}

console.log("Validated Data:", data); // Only runs if no error
const { name, email, password } = data;


    const userExits = await getUserByEmail(email);
    console.log(userExits);
    // if(userExits) return res.redirect("/register");
    if(userExits){
        req.flash("errors","User already exists")
        return res.redirect("/register")
    }

    const hashedPassword = await hashPassword(password)
    //  const [user] = await createUser({name,email,password: hashedPassword});
    // const [user] = await createUser({name,email,password});
    const [user] = await createUser({name, email, password: hashedPassword});

   console.log("User returned from DB:", user);
    

    // res.redirect("/login");    

   await authenticateUser({req,res,user,name,email});
    await sendNewVerifyEmailLink({ email,userId: user.id})

    res.redirect("/");
}

export const getLoginPage = (req,res) =>{
    if(req.user) return res.redirect("/");
   return res.render("../views/auth/login",{errors: req.flash("errors")});
}

export const postLogin = async(req,res) =>{
if(req.user) return res.redirect("/");
    // const {email,password} = req.body;

     const {data,error} = loginUserSchema.safeParse(req.body);
    console.log(data);
    if(error){
        const errors = error.errors[0].message;
        req.flash("errors",errors);
        res.redirect("/login");
    }
    const {email,password} = data;


    const user = await getUserByEmail(email);
    console.log("user",user);
    // if(!user) return res.redirect("/login");
    if(!user){
          req.flash("errors","Incorrect Email or Password")
          res.redirect("/login");
    }

    if(!user.password){
        req.flash("errors","You have created account using social login. Please loginwith your social account");

        return res.redirect("/login");
    }

    // todo bcrypt.compare(plainTextPassword,hashedPassword)
    const isPasswordValid = await comparePassword(password,user.password)

    if(!isPasswordValid){
        req.flash("errors","Incorrect Email or Password");
         return res.redirect("/login");
    }
    // if(user.password !== password) return res.redirect("/login");
    // res.setHeader("Set-Cookie","isLoggedIn= true;path=/;")


    // res.cookie("isLoggedIn",true);

    // const token = generateToken({
    //     id: user.id,
    //     name: user.name,
    //     email: user.email
    // })
    // res.cookie("access_token",token);

    // we can create a session
   await authenticateUser({req,res,user})
    res.redirect("/");
    // console.log("Token Payload:", { id: user.id, name: user.name, email: user.email });
}


export const getMe = (req,res) =>{
    return res.send(`<h1>Hello, ${req.user.name} with email Id ${req.user.email}</h1>`);
}

export const logoutUser = async(req,res) =>{

    await clearUserSession(req.user.sessionId);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    res.redirect("/login");
}


export const getProfilePage = async(req,res) =>{
    if(!req.user) return res.send("Not Logged In");

    const user = await findUserById(req.user.id);
    if(!user) return res.redirect("/login");

    const userShortLinks = await getAllShortLinks(user.id);

    return res.render("auth/profile",{
        user:{
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailValid: user.isEmailValid,
            hasPassword: Boolean(user.password),
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            links: userShortLinks
        }
    })
}


export const getVerifyEmailPage = async(req,res) =>{
    if(!req.user) return res.redirect("/");

    const user = await findUserById(req.user.id);

    if(!user || user.isEmailValid) return res.redirect("/");

    return res.render("auth/verify-email",{
        email: req.user.email,
    })
}

export const resendVerificationLink = async(req,res) =>{
  if(!req.user) return res.redirect("/");

    const user = await findUserById(req.user.id);

    if(!user || user.isEmailValid) return res.redirect("/");
    
    await sendNewVerifyEmailLink({ email: req.user.email,userId: req.user.id})

    res.redirect("/verify-email")
}

export const verifyEmailToken = async(req,res) =>{
    const {data,error} = verifyEmailSchema.safeParse(req.query);

    if(error) {return res.send("verification link is invalid or expired");}

    // const token = await findVerificationEmailToken(data); without joins

     const [token] = await findVerificationEmailToken(data);
    console.log("~ verifyEmail Token ~Token",token);

    if(!token) res.send("verification link is invalid or expired");

    await verifyUserEmailAndUpdate(token.email);
    // clearVerifyEmailTokens(token.email).catch(console.error);
      clearVerifyEmailTokens(token.userId).catch(console.error);

    return res.redirect("/profile");
    

}


export const getEditProfilePage = async(req,res) =>{
    if(!req.user) return res.redirect("/");

    const user = await findUserById(req.user.id);
    if(!user) return res.status(404).send("User not found");

    return res.render("auth/edit-profile",{
        name: user.name,
        avatarUrl: user.avatarUrl,
        errors: req.flash("errors")
    })
}

export const postEditProfile = async(req,res) =>{
    if(!req.user)  return res.redirect("/");

    const {data,error} = verifyUserSchema.safeParse(req.body);

    if(error){
        const errorMessages = error.errors.map((err) => err.message)

        req.flash("errors",errorMessages);

        return res.redirect("/edit-profile");
    }
    //  await updateUserByName({userId: req.user.id,name: data.name})

    const fileUrl = req.file ? `uploads/avatar/${req.file.filename}` : undefined;

     await updateUserByName({userId: req.user.id,name: data.name,avatarUrl: fileUrl})
        return res.redirect("/profile");

}

export const getChangePasswordPage = async(req,res) =>{
    if(!req.user) return res.redirect("/");

    return res.render("auth/change-password",{
        errors: req.flash("errors")
    })
}

export const postChangePassword = async(req,res) =>{
    // if(!req.user) return res.redirect("/");

    const {data,error} = verifyPasswordSchema.safeParse(req.body);
 if(error){
        const errorMessages = error.errors.map((err) => err.message)

        req.flash("errors",errorMessages);

        return res.redirect("/change-password");
    }

    // console.log(data);

    const {currentPassword , newPassword} = data;

     const user = await findUserById(req.user.id);
    if(!user) return res.status(404).send("User not found");

const isPasswordValid = await comparePassword(currentPassword,user.password);

if(!isPasswordValid) {
    req.flash("errors","Current password that you entered is invalid");

    return res.redirect("/change-password");
}

await updateUserPassword({userId: user.id,newPassword});
    
    return res.redirect("/profile");
}


export const getResetPasswordPage = async(req,res) =>{
    return res.render("auth/forgot-password",{
        formSubmitted: req.flash("formSubmitted")[0],
        errors: req.flash("errors")
    })
}

export const postForgotPassword = async(req,res) =>{
    const {data,error} = forgotPasswordSchema.safeParse(req.body);
    
    if(error){
        const errorMessages = error.errors.map((err) => err.message)

        req.flash("errors",errorMessages[0]);

        return res.redirect("/reset-password");
    }

const user = await findUserByEmail(data.email);

if(user) {
    const resetPasswordLink = await createResetPasswordLink({userId: user.id});

    const html = await getHtmlFromMjmlTemplate("reset-password-email",{
        name: user.name,
        link: resetPasswordLink,
    })

    // console.log("html",html);
    sendEmail({
        to: user.email,
        subject: "Reset Your Password",
        html,
    })
    
}
req.flash("formSubmitted",true);
return res.redirect("/reset-password");
}


//getResetPasswordTokenPage
export const getResetPasswordTokenPage = async (req, res) => {
  const { token } = req.params;
  const passwordResetData = await getResetPasswordToken(token);
  if (!passwordResetData) return res.render("auth/wrong-reset-password-token");

  return res.render("auth/reset-password", {
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors"),
    token,
  });
};

//! Extract password reset token from request parameters.
//! Validate token authenticity, expiration, and match with a previously issued token.
//! If valid, get new password from request body and validate using a schema (e.g., Zod) for complexity.
//! Identify user ID linked to the token.
//! Invalidate all existing reset tokens for that user ID.
//! Hash the new password with a secure algorithm .
//! Update the user's password in the database with the hashed version.
//! Redirect to login page or return a success response.

//postResetPasswordToken
export const postResetPasswordToken = async (req, res) => {
  const { token } = req.params;
  const passwordResetData = await getResetPasswordToken(token);
  if (!passwordResetData) {
    req.flash("errors", "Password Token is not matching");
    return res.render("auth/wrong-reset-password-token");
  }

  const { data, error } = verifyResetPasswordSchema.safeParse(req.body);
  if (error) {
    const errorMessages = error.errors.map((err) => err.message);
    req.flash("errors", errorMessages[0]);
    res.redirect(`/reset-password/${token}`);
  }

  const { newPassword } = data;

  const user = await findUserById(passwordResetData.userId);

  await clearResetPasswordToken(user.id);

  await updateUserPassword({ userId: user.id, newPassword });

  return res.redirect("/login");
};


//getGoogleLoginPage
export const getGoogleLoginPage = async (req, res) => {
  if (req.user) return res.redirect("/");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid", // this is called scopes, here we are giving openid, and profile
    "profile", // openid gives tokens if needed, and profile gives user information
    // we are telling google about the information that we require from user.
    "email",
  ]);

  const cookieConfig = {
    httpOnly: true,
    secure: true,
    maxAge: OAUTH_EXCHANGE_EXPIRY,
    sameSite: "lax", // this is such that when google redirects to our website, cookies are maintained
  };

  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);

  res.redirect(url.toString());
};


//getGoogleLoginCallback
export const getGoogleLoginCallback = async (req, res) => {
  // google redirects with code, and state in query params
  // we will use code to find out the user
  const { code, state } = req.query;
  console.log(code, state);

  const {
    google_oauth_state: storedState,
    google_code_verifier: codeVerifier,
  } = req.cookies;

  if (
    !code ||
    !state ||
    !storedState ||
    !codeVerifier ||
    state !== storedState
  ) {
    req.flash(
      "errors",
      "Couldn't login with Google because of invalid login attempt. Please try again!"
    );
    return res.redirect("/login");
  }

  let tokens;
  try {
    // arctic will verify the code given by google with code verifier internally
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    req.flash(
      "errors",
      "Couldn't login with Google because of invalid login attempt. Please try again!"
    );
    return res.redirect("/login");
  }

  console.log("token google: ", tokens);

  const claims = decodeIdToken(tokens.idToken());
  console.log("claim: ", claims);

  const { sub: googleUserId, name, email, picture } = claims;

  //! there are few things that we should do
  // Condition 1: User already exists with google's oauth linked
  // Condition 2: User already exists with the same email but google's oauth isn't linked
  // Condition 3: User doesn't exist.

  // if user is already linked then we will get the user
  let user = await getUserWithOauthId({
    provider: "google",
    email,
  });

  // if user exists but user is not linked with oauth
  if (user && !user.providerAccountId) {
    await linkUserWithOauth({
      userId: user.id,
      provider: "google",
      providerAccountId: googleUserId,
      avatarUrl: picture,
    });
  }

  // if user doesn't exist
  if (!user) {
    user = await createUserWithOauth({
      name,
      email,
      provider: "google",
      providerAccountId: googleUserId,
      avatarUrl: picture,
    });
  }
  await authenticateUser({ req, res, user, name, email });

  res.redirect("/");
};


//getGithubLoginPage

export const getGithubLoginPage = async (req, res) => {
  if (req.user) return res.redirect("/");

  const state = generateState();

  const url = github.createAuthorizationURL(state, ["user:email"]);

  const cookieConfig = {
    httpOnly: true,
    secure: true,
    maxAge: OAUTH_EXCHANGE_EXPIRY,
    sameSite: "lax", // this is such that when google redirects to our website, cookies are maintained
  };

  res.cookie("github_oauth_state", state, cookieConfig);

  res.redirect(url.toString());
};

//getGithubLoginCallback
export const getGithubLoginCallback = async (req, res) => {
  const { code, state } = req.query;
  const { github_oauth_state: storedState } = req.cookies;

  function handleFailedLogin() {
    req.flash(
      "errors",
      "Couldn't login with GitHub because of invalid login attempt. Please try again!"
    );
    return res.redirect("/login");
  }

  if (!code || !state || !storedState || state !== storedState) {
    return handleFailedLogin();
  }

  let tokens;
  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch {
    return handleFailedLogin();
  }

  const githubUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
    },
  });
  if (!githubUserResponse.ok) return handleFailedLogin();
  const githubUser = await githubUserResponse.json();
  const { id: githubUserId, name } = githubUser;

  const githubEmailResponse = await fetch(
    "https://api.github.com/user/emails",
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    }
  );
  if (!githubEmailResponse.ok) return handleFailedLogin();

  const emails = await githubEmailResponse.json();
  const email = emails.filter((e) => e.primary)[0].email; // In GitHub we can have multiple emails, but we only want primary email
  if (!email) return handleFailedLogin();

  // there are few things that we should do
  //! Condition 1: User already exists with github's oauth linked
  //! Condition 2: User already exists with the same email but google's oauth isn't linked
  //! Condition 3: User doesn't exist.

  let user = await getUserWithOauthId({
    provider: "github",
    email,
  });

  if (user && !user.providerAccountId) {
    await linkUserWithOauth({
      userId: user.id,
      provider: "github",
      providerAccountId: githubUserId,
    });
  }

  if (!user) {
    user = await createUserWithOauth({
      name,
      email,
      provider: "github",
      providerAccountId: githubUserId,
    });
  }

  await authenticateUser({ req, res, user, name, email });

  res.redirect("/");
};

//getSetPasswordPage
export const getSetPasswordPage = async (req, res) => {
  if (!req.user) return res.redirect("/");

  return res.render("auth/set-password", {
    errors: req.flash("errors"),
  });
};

//postSetPassword
export const postSetPassword = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const { data, error } = setPasswordSchema.safeParse(req.body);

  if (error) {
    const errorMessages = error.errors.map((err) => err.message);
    req.flash("errors", errorMessages);
    return res.redirect("/set-password");
  }

  const { newPassword } = data;

  const user = await findUserById(req.user.id);
  if (user.password) {
    req.flash(
      "errors",
      "You already have your Password, Instead Change your password"
    );
    return res.redirect("/set-password");
  }

  await updateUserPassword({ userId: req.user.id, newPassword });

  return res.redirect("/profile");
};
