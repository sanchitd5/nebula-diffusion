import 'dotenv/config';
const mongo = {
    URI: process.env.MONGO_URI || 'mongodb://localhost/User_Onboarding',
    //URI: process.env.MONGO_URI || "mongodb://"+process.env.MONGO_USER+":"+process.env.MONGO_PASS+"@localhost/"+process.env.MONGO_DBNAME_DEV,
    port: 27017
};
const postgres = process.env.PG_URI || 'postgres://postgres:postgres@localhost:5432/User_Onboarding';

export default {
    mongo,
    postgres
} as const;


