// api/payments/webhook/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("🚀 WEBHOOK APPELE");
    
    const rawBody = await request.text();
    console.log("📦 BODY BRUT:", rawBody);
    console.log("📋 HEADERS:", Object.fromEntries(request.headers));
    
    // Tenter de parser le JSON
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log("✅ JSON PARSÉ:", JSON.stringify(body, null, 2));
      console.log("🔑 CLÉS DISPONIBLES:", Object.keys(body));
    } catch (e) {
      console.error("❌ ERREUR JSON:", e);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid JSON",
        received: rawBody 
      }, { status: 400 });
    }
    
    // Extraire les données (flexible)
    const externalReference = 
      body.externalReference || 
      body.transactionReference || 
      body.reference || 
      body.transactionId || 
      body.id || 
      "NOT_FOUND";
    
    const providerStatus = 
      body.status || 
      body.transactionStatus || 
      body.transaction_status || 
      body.state || 
      "NOT_FOUND";
    
    const rawAmount = 
      body.amount || 
      body.order?.amount || 
      body.total || 
      body.amount_paid || 
      0;
    
    console.log("📊 DONNEES EXTRAITES:", { externalReference, providerStatus, rawAmount });
    
    // Toujours retourner un succès pour voir la requête
    return NextResponse.json({ 
      success: true,
      received: {
        body,
        extracted: { externalReference, providerStatus, rawAmount }
      }
    });
    
  } catch (error) {
    console.error("❌ ERREUR GLOBALE:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}