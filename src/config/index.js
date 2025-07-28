import dotenv from 'dotenv'
dotenv.config()

const config = {
    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_MASTER_DB || 'fbr_master'
    }
}

export default config