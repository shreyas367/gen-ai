"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, Home } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [homeClicked, setHomeClicked] = useState(false);

  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const buyerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // Fetch cart items
useEffect(() => {
  if (!buyerId) return;
  fetch(`/api/cart?buyerId=${buyerId}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("Cart API data:", data); // Should show actual quantities
      setCart(data.items || []);
      setLoading(false);
    });
}, [buyerId]);


  const total = cart.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.productId?.price || 0),
    0
  );

  const removeItem = async (productId: string) => {
    if (!buyerId) return;
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId, productId }),
    });
    setCart(cart.filter((item) => item.productId._id !== productId));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDelivery((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async () => {
    if (!buyerId) return alert("Please log in as a buyer!");
    if (cart.length === 0) return alert("Cart is empty!");

    const { name, phone, address, city, state, pincode } = delivery;
    if (!name || !phone || !address || !city || !state || !pincode) {
      return alert("Please fill in all delivery details.");
    }

    setPlacingOrder(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId,
          items: cart.map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
          })),
          total,
          delivery,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Order placed successfully!");
        // Clear cart
        await fetch("/api/cart/clear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyerId }),
        });
        setCart([]);
        router.push("/dashboard/buyer");
      } else {
        alert(data.error || "Failed to place order.");
      }
    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-white">Loading cart...</p>;

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
          className={`transition-all p-2 rounded-full border-2 hover:border-black hover:bg-black hover:text-white ${
            homeClicked ? "bg-black text-white ring-4 ring-black shadow-lg" : "bg-gray-200 text-black"
          }`}
        >
          <Home size={24} />
        </button>
      </div>

      {/* Checkout Heading */}
      <h1
        className="text-5xl md:text-6xl mb-8 flex items-center gap-3 gradient-text"
        style={{
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontWeight: "bold",
        }}
      >
        <ShoppingBag size={48} /> Checkout
      </h1>

      <div className="w-full max-w-4xl flex-1 overflow-auto">
        {cart.length === 0 ? (
          <p className="text-gray-200 text-center mt-10">Your cart is empty.</p>
        ) : (
          <>
            {/* Delivery Form */}
            <div className="mb-6 border p-4 rounded-lg shadow-sm bg-white text-black">
              <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["name", "phone", "city", "state", "pincode"].map((field) => (
                  <input
                    key={field}
                    type="text"
                    name={field}
                    value={delivery[field as keyof typeof delivery]}
                    onChange={handleInputChange}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    className="border border-gray-300 p-2 rounded w-full hover:border-2 hover:border-black focus:border-2 focus:border-black focus:outline-none placeholder-black transition-all"
                  />
                ))}
                <textarea
                  name="address"
                  value={delivery.address}
                  onChange={handleInputChange}
                  placeholder="Street Address"
                  className="border border-gray-300 p-2 rounded w-full col-span-2 hover:border-2 hover:border-black focus:border-2 focus:border-black focus:outline-none placeholder-black transition-all"
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between border p-3 rounded-lg shadow-sm bg-white text-black"
                >
                  <div>
                    <h2 className="font-semibold">{item.productId?.title}</h2>
               <p>
  ₹{item.productId?.price} × {item.quantity} = 
  <span className="font-medium">₹{item.productId?.price * item.quantity}</span>
</p>

                  </div>
                  <button
                    className="p-2 text-red-500"
                    onClick={() => removeItem(item.productId._id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {/* Total & Place Order */}
              <div className="flex justify-between items-center mt-6 border-t pt-4">
                <h2 className="text-xl font-bold text-black">Total: ₹{total}</h2>
                <button
                  className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md ${
                    placingOrder ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={placeOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          </>
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