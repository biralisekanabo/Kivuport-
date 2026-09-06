// api/payments/webhook/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("🚀 WEBHOOK APPELE - KIVUPORT");
  
  // Lire le body brut
  const rawBody = await request.text();
  console.log("📦 BODY BRUT:", rawBody);
  
  // Lire les headers
  const headers = Object.fromEntries(request.headers);
  console.log("📋 HEADERS:", JSON.stringify(headers, null, 2));
  
  try {
    // Parser le JSON
    const body = JSON.parse(rawBody);
    console.log("✅ JSON PARSÉ:", JSON.stringify(body, null, 2));
    console.log("🔑 CLÉS DISPONIBLES:", Object.keys(body));
    
    // Extraire les données (tous les formats possibles)
    const externalReference = 
      body.externalReference || 
      body.transactionReference || 
      body.reference || 
      body.transactionId || 
      body.id ||
      body.data?.transactionReference ||
      body.data?.reference ||
      body.payment?.reference ||
      null;
    
    const providerStatus = 
      body.status || 
      body.transactionStatus || 
      body.transaction_status || 
      body.state ||
      body.data?.status ||
      body.data?.transactionStatus ||
      body.payment?.status ||
      null;
    
    const rawAmount = 
      body.amount || 
      body.order?.amount || 
      body.total || 
      body.amount_paid ||
      body.data?.amount ||
      body.data?.order?.amount ||
      body.payment?.amount ||
      null;
    
    const amount = typeof rawAmount === "number" ? rawAmount : 
                   typeof rawAmount === "string" ? Number(rawAmount) : 
                   NaN;
    
    console.log("📊 DONNÉES EXTRAITES:", { 
      externalReference, 
      providerStatus, 
      amount,
      rawAmount 
    });
    
    // TOUJOURS retourner une réponse pour voir la requête
    return NextResponse.json({
      success: true,
      debug: {
        received: body,
        extracted: { externalReference, providerStatus, amount },
        headers: headers
      }
    });
    
  } catch (error) {
    console.error("❌ ERREUR:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      rawBody: rawBody 
    }, { status: 400 });
  }
}