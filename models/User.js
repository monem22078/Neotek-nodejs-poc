const { Client } = require('pg');

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: "5432",
    password: "admin",
    database: "poc"
})
client.connect()
    .then(() => console.log("Connected to PostgreSQL database"))
    .catch(error => console.error("Error connecting to PostgreSQL database:", error));

async function insertUserData(file1, file2, file3 , keyCloakID, status) {
    let query = `DELETE FROM "users" Where keycloakid='${keyCloakID.toString()}'`;
    console.log(query);
    await client.query(query);
    try {
        query = {
            text: 'INSERT INTO "users" (file1, file2, file3 , keyCloakID, status) VALUES ($1, $2, $3 , $4, $5) RETURNING *',
            values: [file1, file2, file3 , keyCloakID, status]
        };
        const insertedUser = await client.query(query);
        return insertedUser.rows[0];
    } catch (error) {
        console.error('Error inserting user data:', error);
        throw error;
    }
}
async function findByID(keyCloakID){
    console.log(keyCloakID);
    try{
        const query = {
            text: 'SELECT * FROM "users" WHERE keyCloakID = $1',
            values: [keyCloakID]
        };
        const userFiles = await client.query(query);
        console.log(userFiles);
        return userFiles.rows[0];
    }catch(error){
        console.error('Error finding user by ID:', error);
        throw error;
    }
}
async function updateUserData(keyCloakID ,reqBody){
    try{
        const setFields = Object.entries(reqBody)
        .map(([key, value], index) => `${key} = $${index + 1}`)
        .join(', ');
        const values = Object.values(reqBody);

        const query = {
            text: `UPDATE users SET ${setFields} WHERE keyCloakID = $${Object.keys(reqBody).length + 1}`,
            values: [...values, keyCloakID]
        }
        const updatedUser = await client.query(query);
        return updatedUser.rows[0];
    }catch(err){
        console.error('Error updating user' , err)
        throw err;
    }
}
module.exports = {
    insertUserData,
    findByID,
    updateUserData
};