import {getOwner} from './auth';
export async function isOwner(){return !!(await getOwner());}
