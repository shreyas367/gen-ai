"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShoppingCart,
  Heart,
  MessageCircle,
  Eye,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

interface Craft {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  artisanId: { _id: string; name: string };
  liked?: boolean;
  views?: number;
}

export default function CraftPage() {
  const router = useRouter();
  const [craft, setCraft] = useState<Craft | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCraft = localStorage.getItem("selectedCraft");
    if (storedCraft) setCraft(JSON.parse(storedCraft));

    const id = localStorage.getItem("userId");
    if (id) setBuyerId(id);

    const cart = localStorage.getItem("cartCount");
    setCartCount(cart ? parseInt(cart) : 0);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "cartCount") {
        setCartCount(event.newValue ? parseInt(event.newValue) : 0);
      }
      if (event.key === "selectedCraft" && event.newValue) {
        setCraft(JSON.parse(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateLocalStorageLike = (liked: boolean) => {
    if (!craft) return;
    const updatedCraft = { ...craft, liked };
    localStorage.setItem("selectedCraft", JSON.stringify(updatedCraft));
    setCraft(updatedCraft);
  };

  const updateCartCount = (newCount: number) => {
    localStorage.setItem("cartCount", newCount.toString());
    setCartCount(newCount);
  };

  const addToCart = async () => {
    if (!buyerId || !craft) return toast.error("Please log in as a buyer!");
    setIsAddingToCart(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, productId: craft._id, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Added to cart!");
        updateCartCount(cartCount + 1);
      } else {
        toast.error(data.error || "Failed to add to cart.");
      }
    } catch {
      toast.error("Failed to add to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const messageArtisan = async () => {
    if (!buyerId || !craft) return toast.error("Please log in as a buyer!");
    const content = prompt(`Message to artisan about "${craft.title}":`);
    if (!content?.trim()) return toast.error("Message cannot be empty.");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId,
          artisanId: craft.artisanId._id,
          content,
        }),
      });
      const data = await res.json();
      toast.success(data.success ? "Message sent!" : "Failed to send message.");
    } catch {
      toast.error("Failed to send message.");
    }
  };

  const toggleLike = async () => {
    if (!buyerId || !craft) return toast.error("Please log in as a buyer!");
    setIsLiking(true);

    const newLikedState = !craft.liked;
    updateLocalStorageLike(newLikedState);

    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, craftId: craft._id }),
      });
    } catch {
      toast.error("Failed to update favorite");
      updateLocalStorageLike(!newLikedState);
    } finally {
      setIsLiking(false);
    }
  };

  if (!craft) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 via-purple-200 to-pink-200">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50 flex flex-col p-5">
      {/* Top Buttons */}
      <div className="flex justify-between items-center mb-5">
        <button
          onClick={() => router.push("/dashboard/buyer")}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white hover:bg-blue-700 active:ring-2 active:ring-blue-400 transition relative"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => router.push("/dashboard/buyer/cart")}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white hover:bg-blue-700 active:ring-2 active:ring-blue-400 transition relative"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Craft Content */}
      <div className="bg-white shadow-2xl rounded-3xl flex flex-col md:flex-row max-w-6xl w-full overflow-hidden mx-auto">
        {/* Left: Image */}
        <div className="md:w-1/2 relative overflow-hidden">
          <img
            src={craft.imageUrl}
            alt={craft.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Right: Details */}
        <div className="md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-bold italic mb-3 text-black">
              {craft.title}
            </h1>
            <p
              className="text-gray-700 mb-6 font-bold"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {craft.description}
            </p>

            <div className="flex items-center gap-6 mb-4">
              <p className="text-3xl font-extrabold text-green-700">
                ₹{craft.price}
              </p>
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <Eye className="w-5 h-5" /> {craft.views || 0} views
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Artisan: <span className="font-semibold">{craft.artisanId?.name}</span>
            </p>
          </div>

          {/* Like & Message */}
          <div className="flex justify-between mb-4">
            <button
              onClick={toggleLike}
              disabled={isLiking}
              className={`w-20 h-20 flex items-center justify-center rounded-full transition shadow-lg font-semibold text-white ${
                craft.liked
                  ? "bg-red-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              <Heart className="w-8 h-8" />
            </button>

            <button
              onClick={messageArtisan}
              className="w-20 h-20 flex items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-800 transition shadow-lg font-semibold"
            >
              <MessageCircle className="w-8 h-8" />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={addToCart}
            disabled={isAddingToCart}
            className="w-full h-20 flex items-center justify-center gap-3 bg-green-700 text-white px-6 rounded-xl hover:bg-green-800 transition shadow-lg font-semibold text-xl"
          >
            <ShoppingCart className="w-7 h-7" />{" "}
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
