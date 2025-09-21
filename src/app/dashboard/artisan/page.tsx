"use client";

import { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Craft {
  _id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl: string;
  views?: number;
}

interface MarketingData {
  suggestions?: string[];
}

interface CreateCraftResponse {
  success: boolean;
  craft: Craft;
  error?: string;
}

interface MarketingResponse {
  suggestions?: string[];
}

export default function ArtisanDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(""); 
  const [title, setTitle] = useState(""); 
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(""); 
  const [uploads, setUploads] = useState<Craft[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [toast, setToast] = useState("");
  const [marketing, setMarketing] = useState<MarketingData | null>(null);
  const [lang, setLang] = useState("en");
  const router = useRouter();

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    fetch("/api/crafts")
      .then((res) => res.json())
      .then((data: { crafts: Craft[] }) => setUploads(data.crafts || []));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const formatPrice = (amount: number | string | undefined | null) => {
    if (!amount) return "₹0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "₹0.00";
    return num.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  };

  const generateAIContent = async () => {
    if (!file) {
      alert("Please select an image first!");
      return;
    }
    setLoadingAI(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "artisan_preset");

      const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dqbbieghv/image/upload", {
        method: "POST",
        body: formData,
      });
      const cloudData: { secure_url: string; error?: { message: string } } = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error?.message || "Image upload failed");
      setImageUrl(cloudData.secure_url);

      const craftRes = await fetch("/api/crafts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId: localStorage.getItem("userId"),
          imageUrl: cloudData.secure_url,
          lang,
          userTitle: title || null,
        }),
      });

      const craftData: CreateCraftResponse = await craftRes.json();
      if (!craftData.craft) throw new Error("AI generation failed");

      if (!title) setTitle(craftData.craft.title);
      setDescription(craftData.craft.description || "");
      setPrice(craftData.craft.price.toString());

      try {
        const marketingRes = await fetch("/api/crafts/marketing-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: craftData.craft.title,
            imageUrl: cloudData.secure_url,
          }),
        });

        let marketingData: MarketingData | null = null;

        if (marketingRes.ok) {
          marketingData = await marketingRes.json() as MarketingResponse;
        }

        setMarketing(marketingData ?? null);
        setToast("AI suggestions generated! You can edit before uploading.");
      } catch (err: unknown) {
        setToast("Marketing AI generation failed");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setToast(err.message);
      else setToast("AI generation failed");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const artisanId = localStorage.getItem("userId");

    if (!artisanId) {
      router.push("/login");
      return;
    }

    if (!file || !title || !price) {
      alert("Please add a title, price, and image!");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Price must be a valid number greater than 0");
      return;
    }

    try {
      setLoadingUpload(true);

      const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dqbbieghv/image/upload";
      const UPLOAD_PRESET = "artisan_preset";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      const data: { secure_url: string; error?: { message: string } } = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      const saveRes = await fetch("/api/crafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId,
          title,
          description,
          price: parsedPrice,
          imageUrl: imageUrl || data.secure_url,
        }),
      });

      const saveData: CreateCraftResponse = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error || "Failed to save craft");

      setUploads((prev) => [saveData.craft, ...prev]);
      setFile(null);
      setTitle("");
      setDescription("");
      setPrice("");
      setToast("Craft uploaded successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) setToast(`Upload failed: ${err.message}`);
      else setToast("Upload failed");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleCraftClick = async (craftId: string) => {
    try {
      const artisanId = localStorage.getItem("userId");
      if (!artisanId) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/crafts/${craftId}/views`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId: artisanId }),
      });

      const data: { success: boolean; views?: number } = await res.json();

      if (data.success) {
        setUploads((prevUploads) =>
          prevUploads.map((craft) =>
            craft._id === craftId ? { ...craft, views: data.views } : craft
          )
        );
      }
    } catch (err: unknown) {
      console.error("Error updating views:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 to-white p-6 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <span className="text-5xl animate-bounce">🎨</span>
          <span className="animate-gradient-text">Artisan Dashboard</span>
        </h1>
        <button
          onClick={handleLogout}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-lg transition transform hover:scale-105"
        >
          Logout
        </button>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-toast">
          {toast}
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Upload Form */}
        <section className="bg-white rounded-3xl shadow-lg p-6 flex-shrink-0 w-full md:w-1/3 border-t-4 border-green-600 overflow-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-green-600" /> Upload Your Craft
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="text"
              placeholder="Craft Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-0 focus:border-green-500 transition"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-0 focus:border-green-500 transition"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-0 focus:border-green-500 transition"
              required
              min={0.01}
              step={0.01}
            />
            <label className="block w-full border-2 border-dashed border-green-300 rounded-xl p-6 cursor-pointer hover:bg-green-50 transition text-center text-gray-500">
              {file ? file.name : "Click or drag to select an image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              onClick={generateAIContent}
              disabled={loadingAI || !file}
              className="w-full bg-yellow-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-600 transition disabled:opacity-60"
            >
              {loadingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {loadingAI ? "Generating..." : "Generate AI Suggestions"}
            </button>
            <button
              type="submit"
              disabled={loadingUpload}
              className="w-full bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition transform hover:scale-105 disabled:opacity-60"
            >
              {loadingUpload ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {loadingUpload ? "Uploading..." : "Upload"}
            </button>
          </form>

          {/* Marketing Suggestions */}
          {marketing?.suggestions && marketing.suggestions.length > 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold text-gray-700 mb-2">Marketing Tips:</h3>
              <ul className="list-disc pl-5 text-gray-600">
                {marketing.suggestions.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Gallery */}
        <section className="flex-1 bg-white rounded-3xl shadow-lg p-6 overflow-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2 gallery-3d">
            <ImageIcon className="w-6 h-6 text-green-600" /> Your Gallery
          </h2>
          {uploads.length === 0 ? (
            <p className="text-gray-500">No crafts uploaded yet. Start by uploading one!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...uploads]
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .map((craft, i) => (
                  <div
                    key={i}
                    onClick={() => handleCraftClick(craft._id)}
                    className="card-3d bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-2xl transition relative cursor-pointer border border-blue-200"
                  >
                    <img
                      src={craft.imageUrl}
                      alt={craft.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{craft.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{craft.description}</p>
                      <p className="text-xs text-green-700 mt-1 font-medium">{formatPrice(craft.price)}</p>
                      <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                        <span>👁 {craft.views || 0} views</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        :where(div, h1, h2, h3, p, span, label):not(input):not(textarea):not(button) {
          font-family: Georgia, serif;
          font-weight: bold;
          font-style: italic;
        }
        .gallery-3d {
          display: inline-flex;
          transform: perspective(500px) rotateX(5deg) rotateY(-5deg);
          text-shadow: 2px 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.4s ease, text-shadow 0.4s ease;
        }
        .gallery-3d:hover {
          transform: perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(10px);
          text-shadow: 4px 4px 12px rgba(0,0,0,0.6);
        }
        input, textarea {
          color: #000;
          border: 1px solid #d1d5db;
          font-family: Arial, sans-serif;
          font-weight: normal;
          font-style: normal;
          transition: border 0.3s ease;
        }
        input::placeholder, textarea::placeholder {
          color: #6b7280;
          font-family: Arial, sans-serif;
          font-weight: normal;
          font-style: normal;
        }
        input:hover, textarea:hover, input:focus, textarea:focus {
          border: 2px solid #22c55e;
          outline: none;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          cursor: pointer;
        }
        .card-3d:hover {
          transform: rotateY(10deg) rotateX(5deg) translateZ(15px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.35);
        }
        @keyframes toast-in { 0% { opacity:0; transform:translateY(-20px); } 100% { opacity:1; transform:translateY(0); } }
        .animate-toast { animation: toast-in 0.5s ease-out; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .animate-gradient-text {
          background: linear-gradient(90deg, #f700ff, #0400ff, #4bc522);
          background-size: 200% auto;
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
          animation: gradient-text 3s linear infinite;
        }
        @keyframes gradient-text { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
      `}</style>
    </div>
  );
}