import { relations, sql } from 'drizzle-orm';
import { boolean, text } from 'drizzle-orm/gel-core';
import { mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const shortLinksTable = mysqlTable('short_link', {
  id: int().autoincrement().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  shortCode: varchar("short_code",{ length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId: int("user_id").notNull().references(() => userTables.id)
});

export const sessionsTable = mysqlTable("sessions",{
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull().
  references(()=> userTables.id,{onDelete:'cascade'}),
  valid: boolean().default(true).notNull(),
  userAgent: text("user_agent"),
  ip: varchar({length:255}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
})

export const verifyEmailTokensTable = mysqlTable("is_email_valid",{
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(()=> userTables.id,{onDelete: "cascade"}),
  token: varchar({length:8}).notNull(),
  expiresAt: timestamp("expires_at").default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 DAY)`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

//passwordResetTokensTable
export const passwordResetTokensTable = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => userTables.id, { onDelete: "cascade" })
    .unique(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at")
    .default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 HOUR)`)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


//oauthAccountsTable
export const oauthAccountsTable = mysqlTable("oauth_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => userTables.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["google", "github"]).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userTables = mysqlTable('users', {
  id: int().autoincrement().primaryKey(),
  name: varchar({length:255}).notNull(),
  email: varchar({length:255}).notNull().unique(),
  password: varchar({length:255}),
  avatarUrl: text("avatar_url"),
  isEmailValid: boolean("is_email_valid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// a user can have many short code
export const usersRelation = relations(userTables,({many}) =>({
  shortLink: many(shortLinksTable),
  session: many(sessionsTable),
}));

// a short link belongs to a user 
export const shortLinksRelation = relations(shortLinksTable,({one}) => ({
  user:one(userTables,{
     fields: [shortLinksTable.userId], //foreign key
    references:[userTables.id] //refence to which table
  }
  )
}))

export const sessionsRelation = relations(sessionsTable, ({one}) =>({
  user: one(userTables,{
    fields:[sessionsTable.userId],
    references: [userTables.id]
  })
}))
