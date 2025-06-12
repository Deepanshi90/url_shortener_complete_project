import { and, count, desc, eq, ne } from "drizzle-orm";
import {db} from "../config/db.js"
import { shortLinksTable } from "../drizzle/schema.js"

export const getAllShortLinks = async({userId,limit=10,offset=0}) =>{
    // get the data from db

    const condition = eq(shortLinksTable.userId,userId);
   const shortLinks = await db.select().from(shortLinksTable).where(condition).
    orderBy(desc(shortLinksTable.createdAt))
    .limit(limit).offset(offset);

    const [{totalCount}] = await db.select({totalCount: count()}).from(shortLinksTable).where(condition);

    return {shortLinks,totalCount};
};

export const getShortLinkByShortCode = async(shortCode) =>{
    const [result] = await db.select().from(shortLinksTable).where(eq(shortLinksTable.shortCode,shortCode));
    return result;
    // this query returnthe array that why we use the [result]
}

export const insertShortLink = async({url,shortCode,userId}) =>{
    await db.insert(shortLinksTable).values({
        url ,shortCode , userId
    })
}

export const findShortLinkById =  async(id) =>{
    const [result] = await db.select().from(shortLinksTable).where(eq(shortLinksTable.id,id));
    return result;
}

export const updateShortCode = async({id,url,shortCode}) =>{

    // Check if the shortCode already exists for a different record
  const existing = await db
    .select()
    .from(shortLinksTable)
    .where(and(eq(shortLinksTable.shortCode, shortCode), ne(shortLinksTable.id, id)))
    .limit(1);

  if (existing.length > 0) {
    // Manually throw a duplicate entry error
    const error = new Error("ShortCode already exists");
    error.code = "ER_DUP_ENTRY";
    throw error;
  }

    return await db.update(shortLinksTable).set({url,shortCode}).where(eq(shortLinksTable.id,id))
}

export const deleteShortCodeById =async(id) =>{
    return await db.delete(shortLinksTable).where(eq(shortLinksTable.id,id));
}