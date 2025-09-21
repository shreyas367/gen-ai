"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, Home } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeClicked, setHomeClicked] = useState(false);

  const buyerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!buyerId) return;
    fetch(`/api/cart?buyerId=${buyerId}`)
      .then((res) => res.json())
      .then((data) => {
        setCart(data.items || []);
        setLoading(false);
      });
  }, [buyerId]);

const updateQuantity = async (productId: string, type: "inc" | "dec") => {
  // Update state optimistically
  setCart((prev) =>
    prev.map((item) =>
      item.productId._id === productId
        ? { ...item, quantity: type === "inc" ? item.quantity + 1 : Math.max(item.quantity - 1, 1) }
        : item
    )
  );

  if (!buyerId) return;
  await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyerId, productId, type }), // ✅ use productId
  });
};


  const removeItem = async (craftId: string) => {
    if (!buyerId) return;
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId, productId: craftId }),
    });
    setCart(cart.filter((item) => item.productId._id !== craftId));
  };

  const total = cart.reduce(
    (sum, item) => sum + (item.productId?.price || 0) * item.quantity,
    0
  );

  if (loading) return <p className="text-center mt-10 text-white">Loading cart...</p>;

  return (
    <div className="w-screen h-screen overflow-hidden relative gradient-bg p-6 flex flex-col items-center">
      {/* Home icon top-left */}
      <div className="absolute top-5 left-5">
        <button
          onClick={() => {
            setHomeClicked(true);
            setTimeout(() => setHomeClicked(false), 200);
            router.push("/dashboard/buyer");
          }}
          className={`transition-all p-2 rounded-full border-2 ${
            homeClicked
              ? "bg-green-500 text-white ring-4 ring-green-300 shadow-lg"
              : "hover:bg-black hover:text-white bg-gray-200 text-black"
          }`}
        >
          <Home size={24} />
        </button>
      </div>

      {/* Heading with logo and animated gradient */}
      <h1
        className="text-5xl md:text-6xl mb-8 flex items-center gap-3 gradient-text"
        style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: "bold" }}
      >
        <ShoppingBag size={48} /> Your Cart
      </h1>

      <div className="w-full max-w-4xl flex-1 overflow-auto">
        {cart.length === 0 ? (
          <p className="text-gray-200 text-center mt-10">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between border p-3 rounded-lg shadow-sm bg-white hover:shadow-lg transition text-black"
              >
                <div>
                  <h2 className="font-semibold">{item.productId?.title}</h2>
                  <p>₹{item.productId?.price} × {item.quantity}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="p-2 border rounded hover:bg-gray-100 transition"
                    onClick={() => updateQuantity(item.productId._id, "dec")}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="p-2 border rounded hover:bg-gray-100 transition"
                    onClick={() => updateQuantity(item.productId._id, "inc")}
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    className="p-2 text-red-500 hover:text-red-700 transition"
                    onClick={() => removeItem(item.productId._id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center mt-6 border-t pt-4">
              <h2 className="text-xl font-bold text-white">Total: ₹{total}</h2>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                onClick={() => router.push("/dashboard/buyer/checkout")}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .gradient-bg {
          background: linear-gradient(-45deg, #d5ce03ff, #1e90ff, #c11d6fff);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }

        @keyframes gradientBG {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .gradient-text {
          background: linear-gradient(90deg, black);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGradient 5s ease infinite;
        }

        @keyframes textGradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}