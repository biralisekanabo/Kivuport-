import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin';

type ChatHistoryMessage = {
  role: "user" | "model";
  text: string;
};

// ===== RÉCUPÉRER L'UTILISATEUR =====
function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// ===== DÉTECTER LA LANGUE DU MESSAGE =====
function detectLanguage(text: string): string {
  const languages: Record<string, RegExp> = {
    fr: /\b(bonjour|salut|merci|svp|s'il vous plaît|comment|combien|quand|où|réservation|réserver|traversée|horaires|payer|paiement|prix|annuler|aide|bateau|port|place|voulez|pouvez|est-ce|bienvenue)\b/gi,
    en: /\b(hello|hi|morning|afternoon|evening|thank|thanks|please|how|what|when|where|booking|trip|crossing|schedule|departure|arrival|pay|payment|price|cost|cancel|help|boat|port|seat|want|would|can|welcome)\b/gi,
    sw: /\b(habari|asante|tafadhali|karibu|kwaheri|bei|safari|kivuko|wakati|saa|ngapi|bandari|meli|malipo|kulipa|nataka|unataka|naweza|weka|kutoka|kuingia|sasa|mzuri|tu|kwa|ya|na)\b/gi,
    ln: /\b(mbote|oyo|makambo|esengo|nzela|motuka|masuwa|mbongo|futa|kofuta|kosomba|libaku|mokolo|ngonga|ngai|yo|biso|boleki|tika|tala|lingi|sengeli|kombo)\b/gi,
    kin: /\b(mulembe|embote|omundu|erira|ekiro|embongo|nzira|wina|kyo|mubaka|kigho|nigho|busa)\b/gi,
  };

  const wordCount = text.trim().split(/\s+/).length || 1;
  const scores: Record<string, number> = {};

  for (const [lang, pattern] of Object.entries(languages)) {
    const matches = text.match(pattern);
    if (matches) {
      scores[lang] = matches.length / wordCount;
    }
  }

  // Trouver la langue avec le score le plus élevé
  let bestLang = 'fr';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  // Repli : si aucun mot clé reconnu, favoriser le français (langue du site)
  if (bestScore === 0 && /[éèêëàâäôöûüçîï]/i.test(text)) {
    return 'fr';
  }

  return bestLang;
}

// ===== NOMS DES LANGUES =====
const languageNames: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  sw: 'Kiswahili',
  ln: 'Lingala',
  kin: 'Kinande',
};

// ===== PROMPT SYSTÈME MULTILINGUE =====
function getSystemPrompt(lang: string, timeContext: string): string {
  const languageName = languageNames[lang] || 'Français';
  
  return `Tu es l'assistant officiel de KivuPort, une plateforme de gestion portuaire à Goma, RDC.

**LANGUES SUPPORTÉES (UNIQUEMENT):**
Tu DOIS TOUJOURS répondre dans la MÊME LANGUE que l'utilisateur, mais UNIQUEMENT parmi ces 5 langues :
- Français
- English
- Kiswahili
- Lingala
- Kinande (nande)
Langue détectée: ${languageName}.
Ne parle JAMAIS une langue autre que ces 5.

**RÈGLES IMPORTANTES:**
1. Réponds TOUJOURS dans la langue de l'utilisateur
2. N'utilise JAMAIS d'émojis, ni d'émoticônes, ni de symboles décoratifs
3. Salue l'utilisateur à CHAQUE nouvelle conversation selon le moment de la journée, dans la langue de l'utilisateur. Heure actuelle à Goma (UTC+2) : ${timeContext}.
   Selon l'heure, utilise la salutation adaptée :
   - de 06h00 à 11h59 : "Bonjour" / "bonne matinée"
   - de 12h00 à 17h59 : "Bon après-midi"
   - de 18h00 à 23h59 : "Bonsoir"
   - de 00h00 à 05h59 : "Bonne nuit"
   Au cours d'une conversation déjà commencée, ne répète PAS la salutation.
4. Sois courtois, professionnel et chaleureux
5. Donne des réponses précises et utiles, en termes simples
6. Si tu ne sais pas, oriente vers le support

**=== KIVUPORT - PRÉSENTATION ===**
KivuPort est une plateforme moderne de réservation de traversées maritimes sur le Lac Kivu, basée à Goma, République Démocratique du Congo.

**=== DESTINATIONS ET TARIFS ===**
Traversées depuis Goma :
- Goma → Bukavu : 25 000 FC (2h30)
- Goma → Kalehe : 18 000 FC (1h45)
- Goma → Minova : 32 000 FC (3h15)
- Goma → Idjwi : 40 000 FC (4h00)

**=== HORAIRES ===**
Départs quotidiens : 08:00, 12:00, 16:00

**=== SERVICES ===**
- Réservation en ligne (passage, mixte, cargaison)
- Paiement sécurisé (Mobile Money, Carte bancaire)
- Suivi en temps réel
- Reçu PDF après paiement
- Notifications par email

**=== COMMENT RÉSERVER ===**
1. Créer un compte ou se connecter
2. Choisir une destination et une date
3. Sélectionner un pavillon
4. Payer en ligne
5. Recevoir la confirmation par email

**=== CONTACT ===**
- Téléphone : +243 995 910 469
- Email : kivuport@gmail.com
- Adresse : Goma, Quartier Katoyi, RDC

**=== ÉQUIPE ===**
- Développeur Backend : Nzanzu Muanda Aristarque
- Développeur Frontend : Birali Sekanabo Blessing

**=== TYPES DE QUESTIONS ===**
- Comment réserver un voyage ?
- Quels sont les tarifs ?
- Quelles sont les destinations disponibles ?
- Comment payer ma réservation ?
- Comment annuler ma réservation ?
- Comment contacter le support ?
- Quels sont les horaires des départs ?
- Comment créer un compte ?
- Comment obtenir un reçu ?

Tu es heureux d'aider, engagé et tu expliques tout en termes simples.`;
}

// ===== DÉTERMINER LE MODE =====
function getMode(path: string): "public" | "client" | "admin" {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/dashboard") || path.startsWith("/reservations") || path.startsWith("/settings") || path.startsWith("/profile")) {
    return "client";
  }
  return "public";
}

// ===== FONCTION PRINCIPALE =====
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer le body
    const { message, history = [], path = "/" } = await request.json() as {
      message?: string;
      history?: ChatHistoryMessage[];
      path?: string;
    };
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: 'Message manquant' }, { status: 400 });
    }
    if (!Array.isArray(history) || history.some((entry) =>
      !entry ||
      !["user", "model"].includes(entry.role) ||
      typeof entry.text !== "string"
    )) {
      return NextResponse.json({ error: "Historique invalide" }, { status: 400 });
    }

    // 2. Détecter la langue du message
    const detectedLang = detectLanguage(message);
    console.log(`Langue détectée: ${languageNames[detectedLang] || 'Inconnue'}`);

    // 3. Vérifier l'API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 });
    }

    // 4. Récupérer l'utilisateur (si connecté)
    const userId = getUserId(request);
    
    // 5. Déterminer le mode
    const mode = getMode(path);

    if (mode !== "public" && !userId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    if (mode === "admin") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: user } = await supabase.auth.getUser(userId!);
      if (!user.user || !isAdminEmail(user.user.email)) {
        return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
      }
    }
    
    // 6. Construire le prompt système
    const now = new Date();
    const gomaHour = (now.getUTCHours() + 2) % 24;
    const gomaMinutes = String(now.getUTCMinutes()).padStart(2, "0");
    const timeContext = `${String(gomaHour).padStart(2, "0")}:${gomaMinutes}`;
    let systemPrompt = getSystemPrompt(detectedLang, timeContext);
    
    // 7. Ajouter des données client si connecté
    if (mode === "client" && userId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: user } = await supabase.auth.getUser(userId);
        
        if (user?.user) {
          const { data: client } = await supabase
            .from("client")
            .select("id, nom, prenom, telephone")
            .eq("email", user.user.email)
            .maybeSingle();
          
          if (client) {
            const { data: reservations } = await supabase
              .from("reservations")
              .select("id, statut, type_reservation, prix_total, date_embarquement")
              .eq("idclient", client.id)
              .order("date_embarquement", { ascending: false })
              .limit(3);
            
            systemPrompt += `\n\n**DONNÉES CLIENT :**\n`;
            systemPrompt += `- Nom : ${client.prenom || ""} ${client.nom || ""}\n`;
            systemPrompt += `- Téléphone : ${client.telephone || "Non renseigné"}\n`;
            if (reservations && reservations.length > 0) {
              systemPrompt += `- Dernières réservations :\n`;
              reservations.forEach((r) => {
                systemPrompt += `  • #${r.id} - ${r.type_reservation} - ${r.statut} - ${r.prix_total} FC\n`;
              });
            }
          }
        }
      } catch (error) {
        console.error("Erreur récupération données client:", error);
      }
    }

    if (mode === "admin") {
      systemPrompt += `\n\n**STATUT ADMIN:** Tu as accès à toutes les données. Tu aides à l'analyse et à la gestion.`;
    }

    // 8. Construire l'historique pour Gemini
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...history.slice(-20).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    // 9. Appeler Gemini en streaming
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`;
    const payload = { 
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    };

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 10. Gérer les erreurs de l'API Gemini
    if (!upstream.ok || !upstream.body) {
      const errorData = await upstream.json().catch(() => ({}));
      console.error("Erreur Gemini:", errorData);
      
      if (upstream.status === 429) {
        return NextResponse.json({ 
          error: "Le service est actuellement surchargé. Veuillez réessayer dans quelques instants." 
        }, { status: 429 });
      }
      
      return NextResponse.json({ 
        error: "Le service Gemini est momentanément indisponible." 
      }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // 11. Relayer le flux SSE de Gemini vers le client
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const reader = upstream.body!.getReader();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const eventBlock of events) {
              const dataLine = eventBlock.split("\n").find((line) => line.startsWith("data:"));
              if (!dataLine) continue;

              const data = dataLine.slice(5).trim();
              if (!data || data === "[DONE]") continue;

              let chunk: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
              try {
                chunk = JSON.parse(data);
              } catch {
                continue;
              }

              const delta = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Erreur de streaming Gemini:", error);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Erreur de streaming." })}\n\n`));
          } catch {
            /* stream déjà fermé */
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: unknown) {
    console.error('Erreur chat:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Une erreur est survenue"
    }, { status: 500 });
  }
}