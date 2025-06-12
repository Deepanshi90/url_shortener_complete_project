import mysql from "mysql2/promise";

// 1. to connect to mysql server
const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "mysql_db",
    // this is database name
    // If the database "mysql_db" does NOT exist, MySQL will NOT automatically create it, and this will result in an error 
});
console.log("MySQL Connected Successfully");
// 2. we need to create a db
// await db.execute(`create database mysql_db`);
// console.log(await db.execute(`show databases`));
// 3. then we need to create a table
// await db.execute(`create table users(id int auto_increment primary key , username varchar(100) not null , email varchar(100) not null unique)`)
// 4. is to perform CURD operation


// insert
// await db.execute(`insert into users(username,email) values ('vinod','e@gmail.com')`);   //this is inline value
// we use prepared statement
// await db.execute(`insert into users(username,email) values (?,?) `, ["monal","m@gmail.com"]);

// multiple data

// const values = [
//     ["Alice" , "alice@gmail.com"],
//     ["Bob","bob@gmail.com"],
//     ["Cat","cat@gmail.com"]
// ];
// await db.query(`insert into users(username,email) values ?` , [values]);


// read


// const [rows,fields] = await db.execute(`select * from users`);
// const [rows] = await db.execute(`select * from users where username="alice"`)
// console.log(rows,fields);


// Update
// update table_name set column1 = value1, column2 = value2,... 
// where condition;
// try {
//     const [rows] = await db.execute(`update users set username=? where email=?`,["Monal Garg","m@gmail.com"]);
//     console.log(rows);
    
// } catch (error) {
//     console.error(error);
    
// }

// delete
// delete from table_name where condition;
// try {
//     const [rows] = await db.execute(`delete from users where email= ? , ["cat@gmail.com"]`);
//     console.log(rows);
// } catch (error) {
//     console.error(error);
    
// }

