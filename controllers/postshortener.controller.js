import crypto from "crypto";
// import { loadLinks, saveLinks } from "../models/shortener.model.js";
import { deleteShortCodeById, findShortLinkById, getAllShortLinks, getShortLinkByShortCode, insertShortLink, updateShortCode } from "../services/shortener.services.js";
import { z } from "zod";
import { shortenerSearchParamsSchema } from "../validators/shortener-validator.js";
// import { urls } from "../schema/url_schema.js";

export const getShortenerPage = async (req,res) =>{
    try {
        // const file = await readFile(path.join("views","index.html"));
        // const links = await loadLinks();

        if(!req.user) return res.redirect("/login");
 const searchParams = shortenerSearchParamsSchema.parse(req.query);
        // const links = await getAllShortLinks(req.user.id);
        const {shortLinks,totalCount} = await getAllShortLinks({
            userId: req.user.id,
            limit: 10,
            offset: (searchParams.page - 1) * 10,
        })

        //totalCount=100

        const totalPages = Math.ceil(totalCount/10);



        // console.log("data",links);
    
        // let isLoggedIn = req.headers.cookie;
        // isLoggedIn = Boolean(isLoggedIn?.split(";")?.find((cookie) => cookie.trim().startsWith("isLoggedIn"))?.split("=")[1])

        // console.log("~ redirectToShortLink ~isLoggedIn", isLoggedIn);

        // let isLoggedIn = req.cookies.isLoggedIn;

        // const links = await urls.find();
        return res.render("index",{links:shortLinks,host:req.host,
            currentPage: searchParams.page,
            totalPages:totalPages,
            errors:req.flash("errors")})

// return res.send(content);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const postURLShortener = async(req,res)=>{
    try {
          if(!req.user) return res.redirect("/login");
        const {url,shortCode} = req.body;

        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
        //  const links = await loadLinks();
        const link = await getShortLinkByShortCode(finalShortCode);

        if(link){
            req.flash("errors","URL with that shortCode already exists, please choose another");
            return res.redirect("/");
        }
        // const link = await getLinkByShortCode(shortCode);
        //   const links = await urls.find();
        
                // if (links[finalShortCode]) {
                // if (link){
                // if(link){
                //     return res.status(400).send(`<h1>Short Code already exists, please choose another.
                //         <a href="/">Go Back</a></h1>`);
                // }

                //  links[finalShortCode] = url;
                // await saveLinks(links);

                await insertShortLink({url,shortCode:finalShortCode ,userId:req.user.id})
                // placed in curly braces so that it form the object so it fill not affect the function when we call the this function of the paramenter

                // await saveLinks({url,shortCode});
                // await urls.create({url,shortCode});

                // await insertShortLink({url,shortCode:finalShortCode});
                return res.redirect("/")

    } catch (error) {
         console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const redirectToShortLink = async(req,res) =>{
    try {
        const {shortCode} = req.params;
        // const links = await loadLinks();
        const link = await getShortLinkByShortCode(shortCode);
        console.log("~ redirectToShortLink ~link",link);
        
        // const link = await getLinkByShortCode(shortCode);

        // const link = await urls.findOne({shortCode:shortCode});
        // console.log(link);
        
        if(!link) return res.status(404).send("404 page not found");
//  if(!link) return res.status(404).send("404 page not found");
        // return res.redirect(link.url);
        return res.redirect(link.url)
    } catch (error) {
       console.error(error);
        return res.status(500).send("Internal Server Error");  
    }
}

export const getShortenerEditPage = async(req,res) =>{
    if(!req.user) return res.redirect("/login");
    // const id = req.params;
     const {data: id,error} = z.coerce.number().int().safeParse(req.params.id);

     if(error) return res.redirect("/404");
    try {
       const shortLink = await findShortLinkById(id);

       if(!shortLink) return res.redirect("/404");

       res.render("edit-shortLink",{
        id: shortLink.id,
        url:shortLink.url,
        shortCode: shortLink.shortCode,
        errors: req.flash("errors")
       })
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal server error")        
    }
}

export const postShortenerEditPage = async(req,res) =>{
  if(!req.user) return res.redirect("/login");
    // const id = req.params;
     const {data: id,error} = z.coerce.number().int().safeParse(req.params.id);

     if(error) return res.redirect("/404");
      const {url,shortCode} = req.body;
    try {
       
       const newUpdatedShortCode = await updateShortCode({id,url,shortCode});

       if(!newUpdatedShortCode) return res.redirect("/404");
        req.flash("success", "Short link updated successfully!");
    return res.redirect("/"); // or wherever you want after success
       } catch (err) {
         if (err.code === "ER_DUP_ENTRY") {
      req.flash("errors", "ShortCode already exists, please choose another");
      return res.redirect(`/edit/${id}`);
    }
        console.log(err);
        return res.status(500).send("Internal server error")        
    }
}



export const deleteShortCode = async(req,res) =>{
     
     try {
        const {data: id,error} = z.coerce.number().int().safeParse(req.params.id);

     if(error) return res.redirect("/404");
     await deleteShortCodeById(id);
     return res.redirect("/");
     } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error")        
    }
}