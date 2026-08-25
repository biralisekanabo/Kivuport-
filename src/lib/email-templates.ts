type ReservationEmailData = {
  reservationId: number;
  customer: string;
  voyage: string;
  pavilion?: string;
  departure?: string;
  amount: string;
  paymentUrl?: string;
  detailUrl?: string;
};

const colors = { ink: "#17353d", muted: "#63777d", brand: "#0b5968", accent: "#e8794f", pale: "#edf7f8", line: "#d9e7e9" };

function shell(title: string, preheader: string, content: string) {
  return `<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>${title}</title></head><body style="margin:0;background:#f3f7f7;font-family:Arial,Helvetica,sans-serif;color:${colors.ink}"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f7;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid ${colors.line};border-radius:14px;overflow:hidden"><tr><td style="padding:24px 30px;background:${colors.brand};color:#fff"><table role="presentation" width="100%"><tr><td style="font-size:22px;font-weight:700;letter-spacing:.2px">KivuPort</td><td align="right" style="font-size:11px;letter-spacing:1.5px;color:#bfe0e4">PORT DE GOMA</td></tr></table></td></tr><tr><td style="padding:34px 30px 26px">${content}</td></tr><tr><td style="padding:20px 30px;background:#f7fbfb;border-top:1px solid ${colors.line};font-size:12px;line-height:1.6;color:${colors.muted}">KivuPort · Port de Goma<br><span>Ce message est automatique, merci de ne pas y répondre.</span></td></tr></table></td></tr></table></body></html>`;
}

function details(data: ReservationEmailData) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border:1px solid ${colors.line};border-radius:10px"><tr><td style="padding:16px 18px;background:${colors.pale};font-size:12px;font-weight:700;color:${colors.brand}">RÉSUMÉ DE LA RÉSERVATION</td></tr><tr><td style="padding:16px 18px;font-size:14px;line-height:1.9"><strong>Réservation #${data.reservationId}</strong><br>Client : ${data.customer || "-"}<br>Voyage : ${data.voyage}<br>${data.pavilion ? `Pavillon : ${data.pavilion}<br>` : ""}${data.departure ? `Embarquement : ${data.departure}<br>` : ""}<span style="display:inline-block;margin-top:8px;font-size:18px;font-weight:700;color:${colors.accent}">${data.amount}</span></td></tr></table>`;
}

export function confirmationEmail(data: ReservationEmailData) {
  const content = `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1.4px;color:${colors.accent}">RÉSERVATION CONFIRMÉE</p><h1 style="margin:0;font-size:28px;line-height:1.2;color:${colors.ink}">Votre traversée est prête.</h1><p style="font-size:15px;line-height:1.7;color:${colors.muted}">Bonjour ${data.customer || ""}, votre réservation a été confirmée par notre équipe. Vous pouvez maintenant régler votre réservation ou consulter ses détails.</p>${details(data)}<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px"><tr><td style="padding-right:10px"><a href="${data.paymentUrl}" style="display:inline-block;padding:14px 20px;background:${colors.accent};border-radius:7px;color:#fff;text-decoration:none;font-size:14px;font-weight:700">Payer maintenant</a></td><td><a href="${data.detailUrl}" style="display:inline-block;padding:13px 20px;border:1px solid ${colors.brand};border-radius:7px;color:${colors.brand};text-decoration:none;font-size:14px;font-weight:700">Voir la réservation</a></td></tr></table><p style="margin:18px 0 0;font-size:12px;color:${colors.muted}">Le paiement est accessible sans connexion depuis le bouton ci-dessus.</p>`;
  return shell("Réservation confirmée - KivuPort", "Votre réservation KivuPort est confirmée et prête à être payée.", content);
}

export function paymentReceiptEmail(data: ReservationEmailData) {
  const content = `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1.4px;color:#16805d">PAIEMENT CONFIRMÉ</p><h1 style="margin:0;font-size:28px;line-height:1.2;color:${colors.ink}">Merci, votre paiement est reçu.</h1><p style="font-size:15px;line-height:1.7;color:${colors.muted}">Votre paiement pour la réservation #${data.reservationId} a été enregistré. Votre facture PDF avec QR Code est jointe à cet email.</p>${details(data)}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${colors.pale};border-radius:10px"><tr><td style="padding:16px 18px;font-size:13px;line-height:1.6;color:${colors.brand}"><strong>Document joint</strong><br>Facture KivuPort · PDF · QR de vérification lié à la réservation</td></tr></table>`;
  return shell("Paiement reçu - KivuPort", "Paiement reçu. Votre facture PDF avec QR Code est jointe.", content);
}
