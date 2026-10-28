import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyOwnerToken} from '../app/access-token.ts';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test'};
const config={teamDomain:'studio-test.cloudflareaccess.com',audience:'studio',ownerEmail:'owner@example.com'};
const fetcher=async()=>Response.json({keys:[jwk]});
const b64=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
async function token(changes={}){const payload={iss:'https://'+config.teamDomain,aud:['studio'],sub:'owner-id',email:config.ownerEmail,exp:Date.now()/1000+120,...changes};const input=b64({alg:'RS256',kid:'test'})+'.'+b64(payload);const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input));return input+'.'+Buffer.from(sig).toString('base64url');}
test('valid owner can sign in',async()=>assert.equal((await verifyOwnerToken(await token(),config,fetcher)).email,config.ownerEmail));
for(const [name,changes] of Object.entries({expired:{exp:1},wrongAudience:{aud:['other']},wrongIssuer:{iss:'https://evil.example'},nonOwner:{email:'visitor@example.com'},future:{nbf:Date.now()/1000+500}}))test(name+' cannot sign in',async()=>assert.equal(await verifyOwnerToken(await token(changes),config,fetcher),null));
test('forged signature rejected',async()=>{const t=await token();const p=t.split('.');p[2]=b64('forged');assert.equal(await verifyOwnerToken(p.join('.'),config,fetcher),null)});
test('unconfigured login fails closed',async()=>assert.equal(await verifyOwnerToken(await token(),{...config,audience:''},fetcher),null));
test('plain identity header is not a token',async()=>assert.equal(await verifyOwnerToken(config.ownerEmail,config,fetcher),null));
