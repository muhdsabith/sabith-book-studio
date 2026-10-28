import {env} from 'cloudflare:workers';
import {getDb} from '../../../../db';
import {books} from '../../../../db/schema';
import {eq} from 'drizzle-orm';
import {isOwner} from '../../../owner';
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){if(!await isOwner())return Response.json({error:'Owner access required.'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request origin.'},{status:403});const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return Response.json({error:'Invalid book.'},{status:400});try{const db=getDb();const [book]=await db.select().from(books).where(eq(books.id,id)).limit(1);if(!book)return Response.json({ok:true});await db.delete(books).where(eq(books.id,id));try{await env.BUCKET!.delete(book.coverKey)}catch{}return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Unable to remove the book. Please retry.'},{status:500})}}