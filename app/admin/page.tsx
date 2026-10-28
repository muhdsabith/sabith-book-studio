import {getDb} from '../../db';
import {books} from '../../db/schema';
import {desc} from 'drizzle-orm';
import RemoveBooks from './remove-books';
import {getOwner} from '../auth';
import Form from './form';
export const dynamic='force-dynamic';
export default async function Admin(){const user=await getOwner();if(!user)return <main className="form"><h1>Studio owner only</h1><p>Owner sign-in is not configured or your session has expired. Please use the protected studio address.</p><a href="/">Back to books</a></main>;const saved=await getDb().select().from(books).orderBy(desc(books.createdAt));return <main className="form"><a href="/">← My Books</a><h1>Add a book</h1><p>Upload the front cover and add your Amazon link. Your book will appear on the public bookshelf.</p><Form/><RemoveBooks books={saved.map(b=>({id:b.id,title:b.title}))}/></main>}