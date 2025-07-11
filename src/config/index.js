import dotenv from 'dotenv'
dotenv.config()

const config = {
    db:{
        baseUrl: process.env.DB_BASE_URL,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dbName: process.env.DB_NAME
    }
}

export default config