import { Link } from "react-router-dom";
import { Scissors, Phone, Mail, MapPin } from "lucide-react";
import { FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center">
                <Scissors size={20} className="text-white" />
              </div>
              <span className="text-white font-bold text-xl">
                صالــون أسيــد
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4 max-w-sm">
              صالون حلاقة احترافي يقدم أفضل خدمات تصفيف الشعر والعناية باللحية
              بأيدي حلاقين متخصصين.
            </p>
            <div className="flex gap-3">
              {[
                {
                  href: "https://www.instagram.com/osaid.dwikat",
                  icon: FaInstagram,
                  label: "انستقرام",
                },
                {
                  href: "https://www.facebook.com/osaid.dwikat",
                  icon: FaFacebook,
                  label: "فيسبوك",
                },
                {
                  href: "https://www.tiktok.com/@osaiddwikat1?_r=1&_t=ZS-966m9BoJpFx",
                  icon: FaTiktok,
                  label: "تيك توك",
                },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="w-9 h-9 bg-zinc-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon size={16} className="text-zinc-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              {[
                { href: "/services", label: "خدماتنا" },
                { href: "/barbers", label: "حلاقونا" },
                { href: "/booking", label: "احجز موعد" },
                { href: "/store", label: "المتجر" },
                { href: "/my-booking", label: "مواعيدي" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="text-zinc-400 hover:text-amber-500 text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-zinc-400 text-sm">
                <Phone size={15} className="text-amber-500 shrink-0" />
                <span>+972 515718974</span>
              </li>
              <li className="flex items-center gap-2.5 text-zinc-400 text-sm">
                <Mail size={15} className="text-amber-500 shrink-0" />
                <span>Osaiddwikat148@gmail.com</span>
              </li>
              <li className="flex items-start gap-2.5 text-zinc-400 text-sm">
                <MapPin size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <span>بيتا الفوقا -نابــلس</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-zinc-400 text-center">
          © {new Date().getFullYear()}{" "}
          <span className="text-amber-500 font-medium">محمد مراد عيســاوي</span>
          . جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
