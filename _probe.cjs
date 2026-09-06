const fs = require("node:fs");
const line = (s) => {
  const i = s.indexOf("=");
  return [s.slice(0, i).trim(), s.slice(i + 1).trim().replace(/^"/, "").replace(/"$/, "")];
};
const env = Object.fromEntries(fs.readFileSync("A:/portuaire/.env", "utf8").split(/\r?\n/).filter(l => l.includes("=") && !l.trim().startsWith("#")).map(line));
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const get = async (path) => {
  const r = await fetch(URL + path, { headers: H });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
};

(async () => {
  const txs = await get("/rest/v1/payment_transactions?select=external_reference,idpaiement&order=created_at.desc&limit=5");
  console.log("TX:", JSON.stringify(txs));
  const idpaiement = txs.j?.[0]?.idpaiement;
  if (idpaiement) {
    const pays = await get(`/rest/v1/paiements?select=id,idreservation,statut&id=eq.${idpaiement}&limit=5`);
    console.log("PAY:", JSON.stringify(pays));
    const rid = pays.j?.[0]?.idreservation;
    if (rid) {
      const res = await get(`/rest/v1/reservations?select=id,statut,token_paiement,token_expire_at&id=eq.${rid}&limit=5`);
      console.log("RES:", JSON.stringify(res));
    }
  }
})();