import { Router } from "express";
import { name } from "ejs";
import { getShortenerPage, postURLShortener, redirectToShortLink,getShortenerEditPage,postShortenerEditPage,deleteShortCode } from "../controllers/postshortener.controller.js";

const router = Router();



// router.get("/report",(req,res)=>{

//     const student = [{
//         name:"Aarav",
//         grade:"10",
//         favoriteSubject:"Maths"
//     },
//     {
//         name:"Aarav2",
//         grade:"10",
//         favoriteSubject:"Maths"
//     }
//     ,
//     {
//         name:"Aarav3",
//         grade:"10",
//         favoriteSubject:"Maths"
//     },
//     {
//         name:"Aara4",
//         grade:"10",
//         favoriteSubject:"Maths"
//     }]
//     return res.render("report",{student});
// })



router.get("/", getShortenerPage)

router.post("/", postURLShortener);

// router.post("/",async(req,res)=>{
//     try {
//         const {url,shortCode} = req.body;
//          const links = await loadLinks();
//          const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
//                 if (links[finalShortCode]) {
//                     return res.status(400).send("Short Code already exists, please choose another.");
//                 }

//                  links[finalShortCode] = url;
//                 await saveLinks(links);
//                 return res.redirect("/")

//     } catch (error) {
//          console.error(error);
//         return res.status(500).send("Internal Server Error");
//     }
// })

router.get("/:shortCode",redirectToShortLink);

router.route("/edit/:id").get(getShortenerEditPage).post(postShortenerEditPage);

router.route("/delete/:id").post(deleteShortCode);

// default exports
// export default router;

// Named export
export const shortenerRoutes = router;