"use client";
import { useState } from "react";
export default function SaveStayButton({ listingId }: { listingId: string }) {
 const [saved,setSaved]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function toggle(){setBusy(true);setError("");try{const r=await fetch("/api/favorites",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listingId})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Please sign in to save stays.");setSaved(d.favorited);}catch(e){setError(e instanceof Error?e.message:"Unable to save stay.");}finally{setBusy(false);}}
 return <div><button onClick={()=>void toggle()} disabled={busy} className="mt-2 w-full rounded-lg border border-green-800 px-4 py-2 font-semibold text-green-900 disabled:opacity-50">{busy?"Saving…":saved?"♥ Saved · Remove":"♡ Save stay"}</button>{error&&<p role="status" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
