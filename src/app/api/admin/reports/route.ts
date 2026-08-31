import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";

function escapeCsvValue(value: unknown) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const period = searchParams.get("period") || "tous";

  if (!token || !url || !key) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth } = await supabase.auth.getUser(token);

  if (!isAdminEmail(auth.user?.email)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let query = supabase
    .from("kivuport_revenue_report")
    .select("day, voyage_id, pavillon_id, payments_count, revenue")
    .order("day", { ascending: false });

  if (period === "aujourdhui") {
    query = query.gte("day", new Date().toISOString().slice(0, 10));
  }

  if (period === "semaine") {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    query = query.gte("day", date.toISOString().slice(0, 10));
  }

  if (period === "mois") {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    query = query.gte("day", date.toISOString().slice(0, 10));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];

  if (format === "pdf") {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const margin = 40;
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const today = new Date().toLocaleDateString("fr-FR");
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
    const totalPayments = rows.reduce((sum, row) => sum + Number(row.payments_count || 0), 0);

    let y = 800;
    let currentPage = page;
    currentPage.drawText("Rapport journalier KivuPort", { x: margin, y, size: 20, font: fontBold, color: rgb(0.04, 0.2, 0.5) });
    y -= 20;
    currentPage.drawText(`Généré le ${today}`, { x: margin, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 30;

    currentPage.drawText(`Paiements : ${totalPayments}`, { x: margin, y, size: 11, font: fontBold, color: rgb(0.1, 0.5, 0.3) });
    currentPage.drawText(`Chiffre d'affaires : ${Number(totalRevenue).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USD`, { x: margin + 220, y, size: 11, font: fontBold, color: rgb(0.2, 0.3, 0.7) });
    y -= 20;
    currentPage.drawLine({ start: { x: margin, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
    y -= 18;

    const headers = ["Jour", "Voyage", "Pavillon", "Paiements", "Revenu"];
    const colX = [margin, margin + 110, margin + 220, margin + 330, margin + 420];

    headers.forEach((header, index) => {
      currentPage.drawText(header, { x: colX[index], y, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    });
    y -= 12;

    const tableRows = rows.slice(0, 18);
    for (const row of tableRows) {
      if (y < 90) {
        currentPage = pdf.addPage([595, 842]);
        y = 800;
        currentPage.drawText("Suite du rapport journalier", { x: margin, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        y -= 20;
      }

      const values = [
        row.day ? new Date(row.day).toLocaleDateString("fr-FR") : "-",
        String(row.voyage_id ?? "-"),
        String(row.pavillon_id ?? "-"),
        String(row.payments_count ?? 0),
        `${Number(row.revenue || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      ];

      values.forEach((value, index) => {
        currentPage.drawText(String(value).slice(0, 18), { x: colX[index], y, size: 8, font, color: rgb(0.25, 0.25, 0.25) });
      });
      y -= 16;
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=kivuport-rapport-journalier-${new Date().toISOString().slice(0, 10)}.pdf`,
      },
    });
  }

  const csv = [
    "jour,voyage_id,pavillon_id,paiements,chiffre_affaires",
    ...rows.map((row) => [
      row.day,
      row.voyage_id,
      row.pavillon_id,
      row.payments_count,
      row.revenue,
    ].map(escapeCsvValue).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=kivuport-revenue-report.csv",
    },
  });
}
