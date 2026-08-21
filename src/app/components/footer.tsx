import { Anchor, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><span className="footer-icon"><Anchor size={17} /></span><strong>KivuPort</strong><small>Port de Goma</small></div>
      <div className="footer-contact"><a href="tel:+243995910469"><Phone size={14} /> +243 995 910 469</a><a href="mailto:kivuport.com"><Mail size={14} /> contact@kivuport.cd</a></div>
      <p>© 2026 KivuPort. Tous droits réservés.</p>
    </footer>
  );
}
