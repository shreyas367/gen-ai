"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Users, Sparkles } from "lucide-react";

export default function HomePage() {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const images = ["/hero-bg.png", "/2.png", "/3.png"]; // slideshow images
  const [currentImage, setCurrentImage] = useState(0);

  // Automatic slideshow effect (10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 10000); // change image every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const translations = {
    en: {
      brand: "CraftConnect",
      heroTitle: "Discover & Support Local Artisans",
      heroDesc:
        "CraftConnect is your destination for unique, handmade creations. Connect directly with artisans, support their work, and own something truly special.",
      signup: "Sign Up",
      login: "Login",
      getStarted: "Get Started",
      howItWorks: "How It Works",
      forBuyers: "For Buyers",
      buyersDesc:
        "Explore handmade crafts, save your favorites, and connect with artisans directly.",
      forArtisans: "For Artisans",
      artisansDesc:
        "Showcase your creativity, sell your work, and reach passionate buyers.",
      community: "Community",
      communityDesc:
        "Join a community that values tradition, culture, and authentic craftsmanship.",
      featured: "Featured Crafts",
      crafts: [
        { img: "/craft1.png", title: "Handmade Pottery", desc: "Beautiful clay pots crafted by local artisans." },
        { img: "/craft2.png", title: "Traditional Weaving", desc: "Unique handwoven fabrics from skilled weavers." },
        { img: "/craft3.png", title: "Wood Carvings", desc: "Intricate designs carved into natural wood." },
      ],
      footer: "Built with ❤️ for artisans & buyers.",
    },
    hi: {
      brand: "क्राफ्टकनेक्ट",
      heroTitle: "स्थानीय कारीगरों की खोज और समर्थन करें",
      heroDesc:
        "क्राफ्टकनेक्ट आपके लिए अद्वितीय हस्तनिर्मित वस्तुओं का गंतव्य है। कारीगरों से सीधे जुड़ें, उनके काम का समर्थन करें, और कुछ वास्तव में खास पाएं।",
      signup: "साइन अप",
      login: "लॉगिन",
      getStarted: "शुरू करें",
      howItWorks: "यह कैसे काम करता है",
      forBuyers: "खरीदारों के लिए",
      buyersDesc:
        "हस्तनिर्मित वस्तुओं का अन्वेषण करें, अपनी पसंदीदा सहेजें, और सीधे कारीगरों से जुड़ें।",
      forArtisans: "कारीगरों के लिए",
      artisansDesc:
        "अपनी रचनात्मकता दिखाएं, अपना काम बेचें, और उत्साही खरीदारों तक पहुँचें।",
      community: "समुदाय",
      communityDesc:
        "ऐसे समुदाय से जुड़ें जो परंपरा, संस्कृति और प्रामाणिक शिल्प कौशल को महत्व देता है।",
      featured: "विशेष शिल्प",
      crafts: [
        { img: "/craft1.png", title: "हस्तनिर्मित मिट्टी के बर्तन", desc: "स्थानीय कारीगरों द्वारा बनाए गए सुंदर मिट्टी के बर्तन।" },
        { img: "/craft2.png", title: "पारंपरिक बुनाई", desc: "कुशल बुनकरों से अनोखे हाथ से बुने कपड़े।" },
        { img: "/craft3.png", title: "लकड़ी की नक्काशी", desc: "प्राकृतिक लकड़ी में की गई जटिल नक्काशी।" },
      ],
      footer: "कारीगरों और खरीदारों के लिए ❤️ से बनाया गया।",
    },
  };

  const t = translations[language];

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
      {/* Navbar */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-cyan-200 rounded-b-[50px] shadow-2xl blur-[1px]" />
        <div className="flex justify-between items-center px-8 py-6 relative z-10">
          <h1 className="text-4xl font-extrabold text-black drop-shadow-lg tracking-wide transform transition duration-500 hover:scale-110 hover:rotate-1 hover:translate-y-1 animate-3d-text">
            {t.brand}
          </h1>
          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
              className="border border-black/30 bg-white/30 backdrop-blur-md text-black rounded-lg px-3 py-1 shadow-md hover:shadow-lg hover:bg-white/40 transition cursor-pointer"
            >
              <option className="text-black" value="en">English</option>
              <option className="text-black" value="hi">हिंदी</option>
            </select>
            <Link
              href="/signup"
              className="px-5 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 hover:scale-105 transition shadow-md"
            >
              {t.signup}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Slideshow */}
      <section
        className="relative w-full h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${images[currentImage]})` }}
      >
        <div className="absolute inset-0 bg-black/40 transition-all duration-1000" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl font-extrabold leading-tight mb-6 text-transparent bg-clip-text animate-gradient">
            {t.heroTitle}
          </h2>
          <p className="text-lg text-gray-200 mb-10 px-4">{t.heroDesc}</p>
          <div className="flex justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:scale-105 hover:bg-blue-700 transition shadow-lg"
            >
              {t.getStarted}
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:scale-105 hover:bg-green-700 transition shadow-lg"
            >
              {t.login}
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-12 px-6">
        <h3
          className="text-4xl md:text-5xl font-bold italic text-center mb-12 animate-gradient text-transparent bg-clip-text"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {t.howItWorks}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[t.forBuyers, t.forArtisans, t.community].map((title, index) => {
            const icons = [ShoppingBag, Users, Sparkles];
            const Icon = icons[index];
            const descriptions = [t.buyersDesc, t.artisansDesc, t.communityDesc];
            return (
              <div key={index} className="perspective-600">
                <div className="hover-3d p-6 border rounded-2xl shadow-lg bg-white">
                  <Icon className="w-12 h-12 text-indigo-600 mb-4 transition-colors duration-300 group-hover:text-cyan-500" />
                  <h4 className="font-semibold text-lg text-gray-800 mb-2 transition-colors duration-300 group-hover:text-cyan-600">
                    {title}
                  </h4>
                  <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-800">
                    {descriptions[index]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Crafts */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white px-6">
        <h3
          className="text-4xl md:text-5xl font-bold italic text-center mb-12 animate-featured-gradient text-transparent bg-clip-text"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {t.featured}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {t.crafts.map((craft, i) => (
            <div key={i} className="perspective-600">
              <div className="hover-3d bg-white p-6 rounded-2xl shadow-lg">
                <img
                  src={craft.img}
                  alt={craft.title}
                  className="w-full h-52 object-cover rounded-xl mb-4 transition-transform duration-500 group-hover:scale-105"
                />
                <h4 className="font-semibold text-lg text-gray-800 mb-2 transition-colors duration-300 group-hover:text-pink-600">
                  {craft.title}
                </h4>
                <p className="text-gray-600 transition-colors duration-300 group-hover:text-gray-800">
                  {craft.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-6 text-center mt-auto">
        <p className="text-sm">
          © {new Date().getFullYear()} CraftConnect. {t.footer}
        </p>
      </footer>

      {/* Custom Animations */}
<style jsx global>{`
  .perspective-600 { perspective: 600px; }

  .hover-3d { 
    transform-style: preserve-3d; 
    transition: transform 0.4s ease, box-shadow 0.4s ease; 
  }
  .hover-3d:hover { 
    transform: rotateX(5deg) rotateY(5deg) scale(1.03); 
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2); 
  }

  /* CraftConnect Brand Text - static black, no animation */
  .animate-3d-text {
    color: black;
    text-shadow: none;
    animation: none;
  }

  /* Gradient Text Animations (for headings like How It Works & Featured Crafts) */
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient {
    background-image: linear-gradient(270deg,#00ff4cff,#2b00ffff,#00ff00,#ff00ff,#ff0000);
    background-size: 600% 600%;
    animation: gradient 6s ease infinite;
    -webkit-background-clip: text;
    color: transparent;
  }

  @keyframes featured-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-featured-gradient {
    background-image: linear-gradient(270deg,#ff69b4,#ff00ff,#ffcc70,#ff69b4);
    background-size: 600% 600%;
    animation: featured-gradient 8s ease infinite;
    -webkit-background-clip: text;
    color: transparent;
  }
`}</style>


    </main>
  );
}