import { motion } from "framer-motion";
import {
  Anchor,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link as LinkIcon,
  ExternalLink,
  GitFork,
  Send,
} from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const socialLinks = [
    { icon: Globe, href: "#", label: "Twitter" },
    { icon: LinkIcon, href: "#", label: "LinkedIn" },
    { icon: ExternalLink, href: "#", label: "YouTube" },
    { icon: GitFork, href: "#", label: "GitHub" },
  ];

  const quickLinks = [
    { label: "À propos", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Mentions légales", href: "/legal" },
  ];

  return (
    <motion.footer
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Effet de fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-3">
        {/* Grille principale */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 lg:gap-x-10">
          {/* Brand Section */}
          <motion.div
            className="col-span-2 md:col-span-1"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                  <Anchor size={18} className="relative z-10" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold text-white">KivuPort</span>
                <span className="block text-xs text-slate-400 font-medium">Port de Goma</span>
              </div>
            </Link>

          </motion.div>

          {/* Liens rapides */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Liens rapides
            </h3>
            <ul className="space-y-1">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-all duration-300 hover:translate-x-1 inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Contact
            </h3>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="tel:+243995910469"
                  className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-all duration-300 group"
                >
                  <span className="p-1 bg-blue-500/10 rounded-md group-hover:bg-blue-500/20 transition-colors">
                    <Phone size={15} className="text-blue-400" />
                  </span>
                  <span>+243 995 910 469</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:kivuport@gmail.com"
                  className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-all duration-300 group"
                >
                  <span className="p-1 bg-blue-500/10 rounded-md group-hover:bg-blue-500/20 transition-colors">
                    <Mail size={15} className="text-blue-400" />
                  </span>
                  <span>kivuport@gmail.com</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="p-1 bg-blue-500/10 rounded-md mt-0.5">
                    <MapPin size={15} className="text-blue-400" />
                  </span>
                  <span>Goma, République Démocratique du Congo</span>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter + Social */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Restez connecté
            </h3>
            <p className="text-sm text-slate-300 mb-2">
              Abonnez-vous pour recevoir nos actualités
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
              <button className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl text-white transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
                <Send size={18} />
              </button>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-2 mt-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all duration-300"
                  whileHover={{ y: -3, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon size={16} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Séparateur */}
        <motion.div
          className="relative my-3"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </motion.div>

        {/* Footer bottom */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-slate-400 text-center sm:text-left">
            © {currentYear}{" "}
            <span className="text-white font-medium">KivuPort</span>
            . Tous droits réservés.
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Politique de confidentialité
            </Link>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <Link href="/terms" className="hover:text-white transition-colors">
              Conditions d&apos;utilisation
            </Link>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              En ligne
            </span>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
