import { MongoClient, ObjectId } from "mongodb";
const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "generador";
let db;
export function isReady() { return Boolean(db); }
export async function connect() {
  if (!uri) throw new Error("Falta MONGODB_URI");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  db = client.db(dbName);
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("saved").createIndex({ userId: 1, createdAt: -1 });
  console.log(`MongoDB conectado (${dbName})`);
  return db;
}
export const users = () => db.collection("users");
export const saved = () => db.collection("saved");
export function toId(value) { return ObjectId.isValid(value) ? new ObjectId(String(value)) : null; }
export function mapSaved(doc) { return { id: String(doc._id), label: doc.label, length: doc.length || 0, createdAt: doc.createdAt }; }
