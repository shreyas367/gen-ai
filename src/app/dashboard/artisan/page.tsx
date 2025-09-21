"use client";

import { useState, useEffect, FormEvent } from "react";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Craft {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  views?: number;
}

interface MarketingData {
  suggestions?: string[];
}

export default function ArtisanDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [uploads, setUploads] = useState<Craft[]>([]);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");
  const [marketing, setMarketing] = useState<MarketingData | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("en");
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
    if (!file) return alert("Please select an image first!");
    setLoadingAI(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "artisan_preset");

      const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dqbbieghv/image/upload", {
        method: "POST",
        body: formData,
      });
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error?.message || "Image upload failed");
      setImageUrl(cloudData.secure_url);

      const craftRes = await fetch("/api/crafts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId: userId,
          imageUrl: cloudData.secure_url,
          lang,
          userTitle: title || null,
        }),
      });

      if (!craftRes.ok) throw new Error(await craftRes.text());
      const craftData: { craft: Craft } = await craftRes.json();
      if (!craftData.craft) throw new Error("AI generation failed");

      if (!title) setTitle(craftData.craft.title);
      setDescription(craftData.craft.description);
      setPrice(craftData.craft.price.toString());

      // Marketing suggestions
      const marketingRes = await fetch("/api/crafts/marketing-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: craftData.craft.title,
          imageUrl: cloudData.secure_url,
        }),
      });

      if (marketingRes.ok) {
        const marketingData: MarketingData = await marketingRes.json();
        setMarketing(marketingData);
      }
      setToast("AI suggestions generated! You can edit before uploading.");
    } catch (err: unknown) {
      console.error(err);
      setToast((err as Error).message || "AI generation failed");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return router.push("/login");
    if (!file || !title || !price) return alert("Please add a title, price, and image!");

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return alert("Price must be valid > 0");

    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "artisan_preset");

      const res = await fetch("https://api.cloudinary.com/v1_1/dqbbieghv/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      const saveRes = await fetch("/api/crafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId: userId,
          title,
          description,
          price: parsedPrice,
          imageUrl: imageUrl || data.secure_url,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error || "Failed to save craft");

      setUploads((prev) => [saveData.craft, ...prev]);
      setFile(null);
      setTitle("");
      setDescription("");
      setPrice("");
      setToast("Craft uploaded successfully!");
    } catch (err: unknown) {
      console.error(err);
      setToast((err as Error).message || "Upload failed");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleCraftClick = async (craftId: string) => {
    if (!userId) return router.push("/login");
    try {
      const res = await fetch(`/api/crafts/${craftId}/views`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId: userId }),
      });
      const data: { success: boolean; views?: number; message?: string } = await res.json();
      if (data.success) {
        setUploads((prev) =>
          prev.map((craft) => (craft._id === craftId ? { ...craft, views: data.views } : craft))
        );
      } else console.log(data.message);
    } catch (err) {
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

      {/* Main content omitted for brevity; your JSX can remain unchanged */}
    </div>
  );
}
