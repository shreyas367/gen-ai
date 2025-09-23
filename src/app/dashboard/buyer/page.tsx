"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Loader2,
  Tag,
  ShoppingCart,
  Eye,
  Search,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Craft {
  _id: string;
  artisanId: { _id: string; name: string };
  title: string;
  imageUrl: string;
  price: number;
  views: number;
  liked: boolean;
  likes: number;
}

export default function BuyerDashboard() {
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState<number>(0);

  const [artistName, setArtistName] = useState("");
  const [craftTitle, setCraftTitle] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [searchError, setSearchError] = useState("");
  const [loadingCraftId, setLoadingCraftId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Craft[] | null>(null);

  const [buyerId, setBuyerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = localStorage.getItem("userId");
      if (id) setBuyerId(id);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/crafts");
        const data = await res.json();
        setCrafts(data.crafts || []);

        if (buyerId) {
          const [favRes, cartRes] = await Promise.all([
            fetch(`/api/favorites?buyerId=${buyerId}`),
            fetch(`/api/cart?buyerId=${buyerId}`),
          ]);
          const favData = await favRes.json();
          const cartData = await cartRes.json();

          const favoriteCraftIds = favData
            .map((f: any) => f.craftId?._id)
            .filter(Boolean);

          setCrafts((prevCrafts) =>
            prevCrafts.map((c) => ({
              ...c,
              liked: favoriteCraftIds.includes(c._id),
            }))
          );

          const count = cartData.items?.length || 0;
          setCartCount(count);
          localStorage.setItem("cartCount", count.toString());
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [buyerId]);

  const handleCraftClick = (craft: Craft) => {
    localStorage.setItem("selectedCraft", JSON.stringify(craft));
    window.location.href = "/dashboard/buyer/craft";
  };

  const toggleLike = async (craftId: string) => {
    if (!buyerId) return toast.error("Please log in as a buyer!");

    // Optimistic UI
    setCrafts((prev) =>
      prev.map((c) =>
        c._id === craftId
          ? {
              ...c,
              liked: !c.liked,
              likes: c.liked ? (c.likes || 1) - 1 : (c.likes || 0) + 1,
            }
          : c
      )
    );
    if (searchResults)
      setSearchResults((prev) =>
        prev
          ? prev.map((c) =>
              c._id === craftId ? { ...c, liked: !c.liked } : c
            )
          : null
      );

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, craftId }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to update favorite");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update favorite");
    }
  };

  const messageArtisan = async (artisanId: string, craftTitle: string) => {
    if (!buyerId) return alert("Please log in as a buyer!");
    if (!artisanId) return alert("Invalid artisan ID!");
    const content = prompt(`Message to artisan about "${craftTitle}":`);
    if (!content?.trim()) return alert("Message cannot be empty.");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, artisanId, content }),
      });
      const data = await res.json();
      toast.success(data.success ? "Message sent!" : "Failed to send message.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClear = () => {
    setIsRefreshing(true);

    setArtistName("");
    setCraftTitle("");
    setPriceRange("");
    setSearchResults(null);
    setSearchError("");

    setTimeout(() => setIsRefreshing(false), 800);
  };

  const addToCart = async (craftId: string) => {
    if (!buyerId) return toast.error("Please log in as a buyer!");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, productId: craftId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setCartCount((prev) => prev + 1);
        toast.success("✅ Added to cart!");
        localStorage.setItem("cartCount", (cartCount + 1).toString());
      } else {
        toast.error(data.error || "Failed to add to cart.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart.");
    }
  };

  const handleSearch = () => {
    if (!artistName && !craftTitle && !priceRange) {
      setSearchError("At least one field is required");
      setSearchResults(null);
      return;
    }
    setSearchError("");

    let minPrice = 0,
      maxPrice = Infinity;
    if (priceRange) [minPrice, maxPrice] = priceRange.split("-").map(Number);

    const results = crafts.filter((craft) => {
      const matchArtist = artistName
        ? craft.artisanId?.name
            ?.toLowerCase()
            .includes(artistName.toLowerCase())
        : true;
      const matchTitle = craftTitle
        ? craft.title.toLowerCase().includes(craftTitle.toLowerCase())
        : true;
      const matchPrice =
        typeof craft.price === "number" &&
        craft.price >= minPrice &&
        craft.price <= maxPrice;
      return matchArtist && matchTitle && matchPrice;
    });

    setSearchResults(results);
  };

  const formatPrice = (amount: number | string | undefined | null) => {
    if (!amount || isNaN(Number(amount))) return "₹0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const displayedCrafts =
    searchResults !== null
      ? searchResults
      : [...crafts]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 4);

  return (
    <div
      className="min-h-screen p-5 font-serif font-bold italic text-gray-900 overflow-hidden"
      style={{
        fontFamily: "Georgia, serif",
        background:
          "linear-gradient(-45deg, #e70000ff, #07e7e7ff, #d58e8eff, #93fd93ff)",
        backgroundSize: "400% 400%",
        animation: "gradientBG 12s ease infinite",
      }}
    >
      <style jsx global>{`
        @keyframes gradientBG {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 50% 0%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .gradient-text {
          background: linear-gradient(90deg, red, black, blue);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientBG 6s ease infinite;
        }
        .cart-btn {
          background-color: black;
          transition: all 0.3s;
          border-radius: 0.5rem;
        }
        .cart-btn:hover {
          background-color: white;
        }
        .cart-btn:hover svg {
          color: black;
        }
        input,
        select {
          transition: all 0.3s;
          font-style: normal !important;
          font-weight: normal !important;
          font-family: inherit !important;
          color: black !important;
        }
        input::placeholder,
        select::placeholder {
          color: black !important;
          font-style: normal !important;
          font-weight: normal !important;
        }
        input:hover,
        input:focus,
        select:hover,
        select:focus {
          border: 2px solid green;
          outline: none;
        }
        .search-btn {
          background-color: blue;
          transition: all 0.2s;
          border-radius: 50%;
          padding: 0.55rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-btn:hover {
          background-color: black;
          transform: scale(1.12);
        }
        .search-btn:active {
          box-shadow: 0 0 0 3px green;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .card-3d:hover {
          transform: rotateY(10deg) rotateX(5deg) translateZ(15px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
        }
        .search-3d {
          transform-style: preserve-3d;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .search-3d:hover {
          transform: translateZ(10px) rotateX(2deg) rotateY(2deg);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
        }
        .most-viewed-3d {
          display: inline-block;
          transform: perspective(500px) rotateX(5deg) rotateY(-5deg);
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
          transition: transform 0.4s ease, text-shadow 0.4s ease;
        }
        .most-viewed-3d:hover {
          transform: perspective(500px) rotateX(0deg) rotateY(0deg)
            translateZ(10px);
          text-shadow: 4px 4px 12px rgba(0, 0, 0, 0.6);
        }
      `}</style>

      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-4xl tracking-tight drop-shadow-lg">
          <span className="mr-2">🛍</span>
          <span className="gradient-text">Buyer Dashboard</span>
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/buyer/cart" className="relative p-2 cart-btn">
            <ShoppingCart className="w-6 h-6 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition shadow-md"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Search Panel */}
      <section className="mb-5">
        <div className="search-3d bg-white p-3.5 rounded-lg flex flex-col gap-2">
          <h2 className="text-xl font-bold">Search for Craft</h2>

          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Artist Name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="border p-2 rounded-lg flex-1 min-w-[150px]"
            />
            <input
              type="text"
              placeholder="Craft Title"
              value={craftTitle}
              onChange={(e) => setCraftTitle(e.target.value)}
              className="border p-2 rounded-lg flex-1 min-w-[150px]"
            />
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="border p-2 rounded-lg min-w-[120px]"
            >
              <option value="">Price</option>
              <option value="0-100">0-100</option>
              <option value="101-200">101-200</option>
              <option value="201-300">201-300</option>
            </select>

            <button className="search-btn" onClick={handleSearch}>
              <Search className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex justify-between items-center mt-2 min-h-[1.5rem]">
            <div className="text-left text-gray-700">
              {searchError && <p className="text-red-600">{searchError}</p>}
              {searchResults !== null && searchResults.length === 0 && (
                <p>No results found.</p>
              )}
            </div>

            <div>
              <button
                onClick={handleClear}
                className="w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100 transition"
                title="Clear search"
              >
                <svg
                  className={`w-6 h-6 text-gray-700 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0116 0 8 8 0 01-16 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOST VIEWED */}
      <h2 className="most-viewed-3d text-2xl mb-5 drop-shadow-md text-blue-900">
        [MOST VIEWED CRAFTS]
      </h2>

      <section>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
            {displayedCrafts.map((craft) => (
              <div
                key={craft._id}
                onClick={() => handleCraftClick(craft)}
                className="card-3d bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer border border-blue-200"
              >
                <img
                  src={craft.imageUrl}
                  alt={craft.title}
                  className="w-full h-44 object-cover"
                />
                {craft.price > 5000 && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Premium
                  </div>
                )}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-lg truncate">{craft.title}</h3>
                    <p className="text-xs mt-2">
                      by {craft.artisanId?.name || "Unknown Artisan"}
                    </p>
                    <p className="text-lg font-bold text-black mt-2">
                      {formatPrice(craft.price)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />{" "}
                      {craft.views || 0} views
                      {loadingCraftId === craft._id && (
                        <Loader2 className="w-4 h-4 animate-spin inline-block ml-1 text-blue-500" />
                      )}
                    </p>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(craft._id);
                      }}
                      className={`flex items-center gap-1 text-sm transition ${
                        craft.liked
                          ? "text-red-600"
                          : "text-gray-700 hover:text-red-600"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 transition ${
                          craft.liked ? "fill-red-600 text-red-600" : ""
                        }`}
                      />
                      {craft.likes || 0}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        messageArtisan(craft.artisanId._id, craft.title);
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(craft._id);
                      }}
                      className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
