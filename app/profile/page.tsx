"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle2, 
  LogOut, 
  ChevronRight, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  Star, 
  Calendar, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Headphones, 
  Clock, 
  ShoppingBag, 
  Heart, 
  HelpCircle,
  AlertCircle,
  Home,
  Briefcase,
  Check,
  RotateCcw,
  MessageCircle,
  Tag,
  X
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Address } from "@/types";
import { supabase } from "@/lib/supabase/client";

// ─── Help Chat Box Data ───────────────────────────────────────────────────────

type HelpTopic = {
  id: string;
  icon: string;
  label: string;
  questions: {
    q: string;
    a: string;
    waText?: string; // optional custom WhatsApp message
  }[];
};

const HELP_TOPICS: HelpTopic[] = [
  {
    id: "order",
    icon: "📦",
    label: "My Order",
    questions: [
      {
        q: "Where is my order?",
        a: "Your order is being packed and will be out for delivery in the scheduled slot you chose. You'll receive a call from our delivery partner before arrival. You can track your order status from the Recent Orders tab.",
        waText: "Hi K MART! I'd like to track my order. My concern: Where is my order?",
      },
      {
        q: "My order is delayed",
        a: "We're sorry for the delay! Delays can sometimes happen due to high demand or traffic. Our delivery team is working hard to reach you. If it's been over 2 hours past your slot, please connect with us on WhatsApp for an immediate update.",
        waText: "Hi K MART! My order is delayed. Can you help me?",
      },
      {
        q: "I received the wrong item",
        a: "We sincerely apologise for this! Please connect with us on WhatsApp with a photo of the wrong item and your order number. We'll arrange an immediate replacement or full refund within 24 hours.",
        waText: "Hi K MART! I received a wrong item in my order. I need help.",
      },
      {
        q: "An item is missing from my order",
        a: "We're sorry an item was missing! Please reach out to us on WhatsApp with your order number and the missing item name. We'll verify and refund the item amount within 24 hours.",
        waText: "Hi K MART! An item is missing from my order. Please help.",
      },
      {
        q: "My item was damaged / expired",
        a: "We take quality very seriously. Please send us a photo of the damaged or expired item on WhatsApp along with your order number. We'll process a full refund or replacement immediately.",
        waText: "Hi K MART! I received a damaged/expired item. I need a refund or replacement.",
      },
    ],
  },
  {
    id: "delivery",
    icon: "🚚",
    label: "Delivery",
    questions: [
      {
        q: "What are the delivery time slots?",
        a: "We offer two daily delivery slots — Morning (7 AM – 12 PM) and Evening (5 PM – 9 PM). You can pick your preferred slot during checkout. Slots can be scheduled up to 10 days in advance.",
      },
      {
        q: "Can I change my delivery address?",
        a: "You can manage your saved addresses from the Saved Addresses tab on this page. For an existing order that hasn't been picked up yet, please contact us on WhatsApp immediately.",
        waText: "Hi K MART! I want to change the delivery address for my order.",
      },
      {
        q: "Delivery partner did not call / did not show up",
        a: "We apologise for this experience. Please connect with us on WhatsApp with your order number and we'll investigate and ensure your delivery is rescheduled at no extra charge.",
        waText: "Hi K MART! The delivery partner didn't call or show up for my order.",
      },
      {
        q: "Is delivery free?",
        a: "Yes! Your first 3 orders get FREE delivery automatically — no coupon needed. After that, a small delivery fee applies based on your order value. The exact fee is shown during checkout.",
      },
      {
        q: "Can I schedule delivery in advance?",
        a: "Absolutely! During checkout, you can schedule your delivery up to 10 days in advance. Just pick a date and a morning or evening slot that works best for you.",
      },
    ],
  },
  {
    id: "payment",
    icon: "💳",
    label: "Payment & Billing",
    questions: [
      {
        q: "My payment was deducted but order not placed",
        a: "Don't worry! If your payment was deducted but the order wasn't placed, the amount will be automatically refunded to your original payment method within 5–7 business days. Please share your transaction ID with us on WhatsApp for faster resolution.",
        waText: "Hi K MART! My payment was deducted but the order was not placed. Transaction ID: ",
      },
      {
        q: "I want a refund",
        a: "Refunds for eligible orders (missing, wrong, or damaged items) are processed within 24–48 hours and reflect in your account within 5–7 business days depending on your bank. Please contact us on WhatsApp with your order number to initiate a refund.",
        waText: "Hi K MART! I'd like to request a refund for my order.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major payment methods — UPI (GPay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), and Net Banking. All payments are secured via Razorpay.",
      },
      {
        q: "I was charged twice for the same order",
        a: "We're sorry for this! Duplicate charges are rare but can happen during payment gateway timeouts. Please reach out on WhatsApp with your bank transaction IDs and we'll resolve it within 24 hours.",
        waText: "Hi K MART! I was charged twice for the same order. Please help.",
      },
    ],
  },
  {
    id: "account",
    icon: "👤",
    label: "My Account",
    questions: [
      {
        q: "How do I update my phone number or email?",
        a: "You can update your profile details from the Personal Details tab on this page. For phone number changes linked to authentication, please contact us on WhatsApp.",
        waText: "Hi K MART! I need help updating my account phone number.",
      },
      {
        q: "How do I add or remove a saved address?",
        a: "Head to the Saved Addresses tab on this page. You can add a new address with the '+' button, set a default address, or delete any existing one.",
      },
      {
        q: "I can't log in to my account",
        a: "Please try the OTP login option on the sign-in screen. If you still face issues, reach out on WhatsApp with your registered phone number and we'll help you recover access.",
        waText: "Hi K MART! I'm unable to log in to my account. Please help.",
      },
    ],
  },
  {
    id: "product",
    icon: "🛒",
    label: "Products",
    questions: [
      {
        q: "A product I want is out of stock",
        a: "We keep restocking regularly! If a product you need is frequently out of stock, let us know on WhatsApp — we'll do our best to prioritise it. You can also check back daily as stock gets updated every morning.",
        waText: "Hi K MART! A product I need is out of stock. Can you help?",
      },
      {
        q: "Product quality complaint",
        a: "We're sorry to hear that! Please share a photo of the product along with your order number on WhatsApp. Our quality team will review it and arrange a refund or replacement right away.",
        waText: "Hi K MART! I have a product quality complaint. I'd like to raise it.",
      },
      {
        q: "Product price seems incorrect",
        a: "Prices on K MART are updated regularly and match our store pricing. If you believe there's a discrepancy, please share the product name on WhatsApp and we'll verify it for you.",
        waText: "Hi K MART! I noticed a price issue on a product.",
      },
    ],
  },
  {
    id: "other",
    icon: "💬",
    label: "Other",
    questions: [
      {
        q: "I want to give feedback about K MART",
        a: "We love hearing from you! Your feedback helps us grow. Please share your thoughts with us on WhatsApp — positive or negative, all feedback is welcome and reviewed by our team.",
        waText: "Hi K MART! I'd like to share some feedback about my experience.",
      },
      {
        q: "I have a different issue",
        a: "No worries! Our support team is happy to help with anything. Please connect with us on WhatsApp and describe your issue — we're available daily from 7 AM to 10 PM.",
        waText: "Hi K MART! I have an issue I need help with.",
      },
    ],
  },
];

const WA_NUMBER = "919876543210";

// ─── Chat message types ────────────────────────────────────────────────────────

type ChatMsg =
  | { from: "bot"; type: "text"; text: string }
  | { from: "bot"; type: "wa"; text: string; waLink: string }
  | { from: "user"; text: string };

// ─── HelpChatBox Component ─────────────────────────────────────────────────────

function HelpChatBox({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: "bot", type: "text", text: "👋 Hi! I'm your K MART support assistant. What can I help you with today?" },
  ]);
  const [phase, setPhase] = useState<"topics" | "questions" | "answered" | "done">("topics");
  const [activeTopic, setActiveTopic] = useState<HelpTopic | null>(null);
  const [activeQ, setActiveQ] = useState<{ q: string; a: string; waText?: string } | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  const addBot = (msg: ChatMsg) =>
    setMessages((prev) => [...prev, msg]);
  const addUser = (text: string) =>
    setMessages((prev) => [...prev, { from: "user", text }]);

  const handleTopicSelect = (topic: HelpTopic) => {
    addUser(topic.icon + " " + topic.label);
    setTimeout(() => {
      addBot({ from: "bot", type: "text", text: `Got it! For *${topic.label}*, which of these best describes your issue?` });
      setActiveTopic(topic);
      setPhase("questions");
    }, 400);
  };

  const handleQuestionSelect = (item: { q: string; a: string; waText?: string }) => {
    addUser(item.q);
    setTimeout(() => {
      addBot({ from: "bot", type: "text", text: item.a });
      setTimeout(() => {
        addBot({ from: "bot", type: "text", text: "Did that help? 😊" });
        setActiveQ(item);
        setPhase("answered");
      }, 600);
    }, 400);
  };

  const handleYes = () => {
    addUser("👍 Yes, that helped!");
    setTimeout(() => {
      addBot({ from: "bot", type: "text", text: "Great! 🎉 Happy to help. If you ever need anything else, just come back here anytime." });
      setPhase("done");
    }, 400);
  };

  const handleNo = () => {
    addUser("👎 Still need help");
    setTimeout(() => {
      const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
        activeQ?.waText || `Hi K MART! I need help with: ${activeQ?.q || "my issue"}`
      )}`;
      addBot({
        from: "bot",
        type: "wa",
        text: "No worries! Let me connect you with our support team on WhatsApp — they'll resolve this for you right away. 🙌",
        waLink,
      });
      setPhase("done");
    }, 400);
  };

  const handleRestart = () => {
    addUser("🔄 Ask another question");
    setTimeout(() => {
      addBot({ from: "bot", type: "text", text: "Sure! What else can I help you with?" });
      setActiveTopic(null);
      setActiveQ(null);
      setPhase("topics");
    }, 400);
  };

  // Quick-reply chips rendered below the chat
  const renderChips = () => {
    if (phase === "topics") {
      return (
        <div className="grid grid-cols-3 gap-1.5 p-3 border-t border-gray-100 bg-gray-50/60">
          {HELP_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicSelect(topic)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border border-gray-200 bg-white hover:border-[#E11A22] hover:bg-red-50/40 transition-all cursor-pointer text-center"
            >
              <span className="text-lg leading-none">{topic.icon}</span>
              <span className="text-[10px] font-bold text-gray-600 leading-tight">{topic.label}</span>
            </button>
          ))}
        </div>
      );
    }
    if (phase === "questions" && activeTopic) {
      return (
        <div className="flex flex-col gap-1.5 p-3 border-t border-gray-100 bg-gray-50/60">
          {activeTopic.questions.map((item, i) => (
            <button
              key={i}
              onClick={() => handleQuestionSelect(item)}
              className="w-full text-left px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#E11A22] hover:bg-red-50/30 transition-all cursor-pointer flex items-center justify-between gap-2 group"
            >
              <span className="text-[11px] font-semibold text-gray-700 group-hover:text-[#E11A22] leading-snug">{item.q}</span>
              <ChevronRight className="w-3 h-3 text-gray-400 shrink-0 group-hover:text-[#E11A22]" />
            </button>
          ))}
        </div>
      );
    }
    if (phase === "answered") {
      return (
        <div className="flex gap-2 p-3 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={handleYes}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all cursor-pointer"
          >
            👍 Yes, solved!
          </button>
          <button
            onClick={handleNo}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition-all cursor-pointer"
          >
            👎 Still need help
          </button>
        </div>
      );
    }
    if (phase === "done") {
      return (
        <div className="p-3 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={handleRestart}
            className="w-full py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs cursor-pointer transition-all"
          >
            🔄 Ask another question
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#163a5f] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm shrink-0">
            🤖
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-xs leading-tight">K MART Support</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
              <p className="text-white/70 text-[10px] font-medium">Online · Instant replies</p>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close support chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col gap-2.5 p-3.5 overflow-y-auto bg-[#f0f2f5] min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Bot avatar */}
            {msg.from === "bot" && (
              <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm shrink-0 mb-0.5 shadow-xs">
                🤖
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[78%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              {msg.from === "bot" && msg.type === "wa" ? (
                /* WhatsApp escalation bubble */
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-3 shadow-xs space-y-2.5">
                  <p className="text-xs text-gray-800 leading-relaxed">{msg.text}</p>
                  <a
                    href={msg.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black text-xs transition-all cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.556 4.117 1.528 5.849L.057 24l6.305-1.654A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.372l-.359-.214-3.741.981 1-3.641-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                  <p className="text-[10px] text-gray-400 text-center">Available daily 7 AM – 10 PM</p>
                </div>
              ) : msg.from === "bot" ? (
                /* Regular bot bubble */
                <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-xs border border-gray-100">
                  <p className="text-xs text-gray-800 leading-relaxed">{msg.text}</p>
                </div>
              ) : (
                /* User bubble */
                <div className="bg-[#E11A22] rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-xs">
                  <p className="text-xs text-white leading-relaxed font-medium">{msg.text}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick-reply chips */}
      {renderChips()}
    </div>
  );
}





const AVATAR_OPTIONS = [
  "/profile-avatar.png",

  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
];

export default function ProfilePage() {
  const router = useRouter();
  const { 
    user, 
    currentCustomer, 
    updateProfile, 
    addresses, 
    selectedAddress, 
    setSelectedAddress, 
    addAddress, 
    deleteAddress, 
    setDefaultAddress, 
    orders, 
    removeOrder,
    setIsAuthOpen,
    setIsLocationOpen,
    addToCart,
    setUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<"details" | "addresses" | "orders">("details");
  const [isHelpChatOpen, setIsHelpChatOpen] = useState(false);
  
  // Profile edit form state
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [dob, setDob] = useState(user.dob || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || "/profile-avatar.png");
  const [whatsappOptIn, setWhatsappOptIn] = useState(user.whatsappOptIn || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Sign out confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // New Address Form State
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLine1, setNewLine1] = useState("");
  const [newLine2, setNewLine2] = useState("");
  const [newCity, setNewCity] = useState("Pune");
  const [newState, setNewState] = useState("Maharashtra");
  const [newPincode, setNewPincode] = useState("411001");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Sync state whenever context user changes
  useEffect(() => {
    if (user.name) setName(user.name);
    if (user.email) setEmail(user.email);
    if (user.dob) setDob(user.dob);
    if (user.avatar) setSelectedAvatar(user.avatar);
    setWhatsappOptIn(user.whatsappOptIn || false);
  }, [user]);

  // Fill address form with user info defaults
  useEffect(() => {
    if (user.name && !newFullName) setNewFullName(user.name);
    if (user.phone && !newPhone) setNewPhone(user.phone.replace("+91", ""));
  }, [user, newFullName, newPhone]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        avatar: selectedAvatar,
        dob,
        whatsappOptIn,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine1.trim() || !newFullName.trim() || !newPhone.trim() || !newPincode.trim()) {
      alert("Please fill in all mandatory address fields.");
      return;
    }

    setIsAddingAddress(true);
    try {
      await addAddress({
        label: newLabel,
        fullName: newFullName.trim(),
        phone: newPhone.startsWith("+91") ? newPhone : `+91${newPhone.replace(/\D/g, "")}`,
        line1: newLine1.trim(),
        line2: newLine2.trim() || undefined,
        city: newCity.trim(),
        state: newState.trim(),
        pincode: newPincode.trim(),
        latitude: 18.5204,
        longitude: 73.8567,
        isDefault: newIsDefault,
      });

      setShowAddAddressModal(false);
      setNewLine1("");
      setNewLine2("");
    } catch (err: any) {
      alert("Failed to save address: " + err.message);
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleSignOut = async () => {
    setShowLogoutConfirm(false);
    try {
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    document.cookie = "kmart_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser({
      name: "",
      phone: "",
      email: "",
      isVerified: false,
      avatar: "/profile-avatar.png",
      whatsappOptIn: false,
    });
    router.push("/login");
    router.refresh();
  };

  const handleReorder = (orderItems: any[]) => {
    orderItems.forEach((it) => {
      addToCart(it.product, it.quantity);
    });
    router.push("/cart");
  };

  // If user is not logged in, show enticing login prompt
  const isLoggedIn = user.isVerified || !!currentCustomer;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] pb-20">
        {/* Top Breadcrumb */}
        <div className="bg-white border-b border-gray-200/80 shadow-2xs">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <Link href="/" className="hover:text-[#E11A22] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-gray-900">My Profile</span>
            </div>
            <Link href="/categories" className="text-xs font-bold text-[#E11A22] hover:underline">
              Explore Products
            </Link>
          </div>
        </div>

        {/* Not Logged In State Card */}
        <div className="max-w-2xl mx-auto px-4 pt-12 sm:pt-16 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100/50 rounded-full blur-2xl pointer-events-none" />

            <div className="w-20 h-20 mx-auto rounded-full bg-red-50 text-[#E11A22] flex items-center justify-center mb-6 shadow-inner">
              <User className="w-10 h-10" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
              Welcome to K MART Profile
            </h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Sign in with your mobile number to view your personal details, manage delivery addresses, track live orders, and unlock member rewards!
            </p>

            {/* Quick Benefits list */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <Truck className="w-4 h-4 text-[#E11A22] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-gray-800 block">First 3 Deliveries Free</span>
                  <span className="text-gray-500">Auto-applied on your first orders</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-gray-800 block">Saved Addresses</span>
                  <span className="text-gray-500">1-click express checkout</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <Package className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-gray-800 block">Live Order Tracking</span>
                  <span className="text-gray-500">Real-time status updates</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-gray-800 block">Verified Profile</span>
                  <span className="text-gray-500">Secure OTP authentication</span>
                </div>
              </div>
            </div>

            {/* Login CTA */}
            <div className="mt-8">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#E11A22] hover:bg-[#c8141b] text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Login with Mobile Number</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Link href="/" className="hover:text-[#E11A22] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900">My Profile</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Profile Header Hero Card */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#123154] to-[#0A2540] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-red-600/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            {/* User Identity info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white/20 bg-blue-500 shadow-lg shrink-0">
                  <img
                    src={user.avatar || "/profile-avatar.png"}
                    alt={user.name || "User Avatar"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-[#0A2540]" title="Verified Customer">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {user.name || "K MART Customer"}
                  </h1>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-300">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{user.phone || "No phone linked"}</span>
                  </span>
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{user.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action: Sign Out Button */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-red-600/80 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-center sm:text-left max-w-sm">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-medium block">Total Orders</span>
              <span className="text-xl sm:text-2xl font-black text-white">{orders.length}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <span className="text-[11px] text-gray-400 font-medium block">Saved Addresses</span>
              <span className="text-xl sm:text-2xl font-black text-white">{addresses.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="bg-white rounded-2xl p-1.5 shadow-2xs border border-gray-100 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "details"
                ? "bg-[#0A2540] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Details</span>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "addresses"
                ? "bg-[#0A2540] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#0A2540] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Recent Orders ({orders.length})</span>
          </button>
        </div>

        {/* Tab 1: Personal Details & Edit Profile */}
        {activeTab === "details" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0A2540]">
                  Edit Profile & Preferences
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update your display name, contact info, and delivery notifications.
                </p>
              </div>
            </div>

            {saveSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Your profile has been saved successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patil"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#0A2540] outline-none transition-all"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ramesh@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#0A2540] outline-none transition-all"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Mobile Number (Read-only / verified) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Mobile Number (Verified)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={user.phone || "+91 98765 43210"}
                      className="w-full pl-10 pr-20 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-600 cursor-not-allowed"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Mobile number is linked to your OTP authentication.
                  </span>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Date of Birth (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#0A2540] outline-none transition-all"
                    />
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Receive surprise discounts & vouchers on your birthday!
                  </span>
                </div>
              </div>

              {/* WhatsApp notification opt-in */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Get Live Delivery & Order Updates on WhatsApp
                    </span>
                    <span className="text-[11px] text-emerald-700 block mt-0.5">
                      We send live dispatch notifications, OTP receipts, and bill copies straight to your WhatsApp. No spam, ever.
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#E11A22] hover:bg-[#c8141b] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Saved Delivery Addresses */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0A2540]">
                  Saved Delivery Addresses
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage your home, office, and family delivery locations for faster 15-25 minute express checkout.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLocationOpen(true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#E11A22]" />
                  <span>Map Picker</span>
                </button>
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="px-4 py-2 bg-[#E11A22] hover:bg-[#c8141b] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>
            </div>

            {/* Addresses Grid */}
            {addresses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-red-50 text-[#E11A22] flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-gray-800">No Saved Addresses Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Add your home or work address so your grocery deliveries arrive quickly without repeated typing.
                </p>
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="mt-5 px-6 py-2.5 bg-[#E11A22] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#c8141b] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Address Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "border-[#E11A22] ring-2 ring-red-100 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 shadow-2xs"
                      }`}
                    >
                      <div>
                        {/* Header badge & default tag */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {addr.label === "Home" && <Home className="w-3 h-3 text-[#E11A22]" />}
                            {addr.label === "Work" && <Briefcase className="w-3 h-3 text-blue-600" />}
                            {addr.label !== "Home" && addr.label !== "Work" && <MapPin className="w-3 h-3 text-gray-600" />}
                            <span>{addr.label}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {addr.isDefault && (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                DEFAULT
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] font-black text-[#E11A22] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Name & phone */}
                        <p className="text-sm font-bold text-gray-900">{addr.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{addr.phone}</span>
                        </p>

                        {/* Full street address */}
                        <p className="text-xs text-gray-700 mt-2.5 leading-relaxed font-medium">
                          {addr.line1}
                          {addr.line2 && `, ${addr.line2}`}
                          <br />
                          {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {!isSelected && (
                            <button
                              onClick={() => setSelectedAddress(addr)}
                              className="text-[11px] font-bold text-[#E11A22] hover:bg-red-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              Deliver Here
                            </button>
                          )}
                          {!addr.isDefault && (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              Make Default
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this address?")) {
                              deleteAddress(addr.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Recent Orders & Quick Reorder */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0A2540]">
                  Recent Grocery Orders
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track ongoing shipments or re-order household staples with a single click.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {orders.length > 1 && (
                  <button
                    onClick={async () => {
                      const orderToRemove = orders[orders.length - 1];
                      if (!orderToRemove) return;
                      const num = orderToRemove.orderNumber || orderToRemove.id?.slice(0, 8);
                      if (confirm(`Remove older Order #${num}?`)) {
                        await removeOrder(orderToRemove.id || orderToRemove.orderNumber);
                      }
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-[#E11A22] border border-red-200 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Older Order</span>
                  </button>
                )}

                <Link
                  href="/orders"
                  className="px-4 py-2 bg-[#0A2540] hover:bg-[#123154] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <span>Full Orders Page</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-red-50 text-[#E11A22] flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-gray-800">No Orders Placed Yet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Your pantry essentials and daily favorites will appear here once you place your first order.
                </p>
                <Link
                  href="/categories"
                  className="mt-5 px-6 py-2.5 bg-[#E11A22] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#c8141b] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Start Shopping</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id || order.orderNumber}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A2540] flex items-center justify-center font-bold">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-gray-900">
                              Order #{order.orderNumber || order.id?.slice(0, 8)}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {order.status || "Order Confirmed"}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "Recent Order"}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-base font-black text-[#0A2540] block">
                          ₹{order.totalAmount}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"} • {order.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Preview of items */}
                    <div className="py-3 flex items-center gap-3 overflow-x-auto">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl shrink-0">
                          <img
                            src={it.product.image}
                            alt={it.product.name}
                            className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-gray-200"
                          />
                          <div className="text-left max-w-[140px]">
                            <p className="text-xs font-bold text-gray-800 truncate">{it.product.name}</p>
                            <p className="text-[10px] text-gray-500">Qty: {it.quantity} • ₹{it.product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Slot: {order.deliverySlot?.time || "Morning (8:00 AM - 12:00 PM)"}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReorder(order.items || [])}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#E11A22] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reorder All</span>
                        </button>
                        <Link
                          href="/orders"
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <span>Track</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={async () => {
                            const num = order.orderNumber || order.id?.slice(0, 8);
                            if (confirm(`Are you sure you want to remove Order #${num}?`)) {
                              await removeOrder(order.id || order.orderNumber);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Remove Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


      </div>

      {/* Add New Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative my-6 text-left">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#0A2540]">Add New Delivery Address</h3>
                <p className="text-xs text-gray-500">Provide accurate details for quick doorstep delivery</p>
              </div>
              <button
                onClick={() => setShowAddAddressModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="p-6 space-y-4">
              {/* Address Label Choice */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Address Type
                </label>
                <div className="flex items-center gap-2">
                  {(["Home", "Work", "Other"] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewLabel(lbl)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newLabel === lbl
                          ? "bg-[#0A2540] text-white border-[#0A2540]"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:border-[#0A2540] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:border-[#0A2540] outline-none"
                  />
                </div>
              </div>

              {/* House / Flat / Building / Street */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Flat, House No., Building, Street <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLine1}
                  onChange={(e) => setNewLine1(e.target.value)}
                  placeholder="e.g. Flat 402, Green Meadows, MG Road"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:border-[#0A2540] outline-none"
                />
              </div>

              {/* Landmark / Area */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Area, Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={newLine2}
                  onChange={(e) => setNewLine2(e.target.value)}
                  placeholder="e.g. Near City Garden"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white focus:border-[#0A2540] outline-none"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Make Default Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsDefault}
                    onChange={(e) => setNewIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#E11A22] rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-700 font-semibold">Make this my default delivery address</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAddress}
                  className="px-6 py-2 bg-[#E11A22] hover:bg-[#c8141b] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAddingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 text-center shadow-xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Sign Out of K MART?</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              You will need to verify with OTP next time you want to place orders or view saved addresses.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Round Help Popup */}
      <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end">
        {isHelpChatOpen && (
          <div className="mb-3 w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-140px)] rounded-3xl shadow-2xl border border-gray-200/80 bg-white overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <HelpChatBox onClose={() => setIsHelpChatOpen(false)} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsHelpChatOpen((prev) => !prev)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0A2540] hover:bg-[#E11A22] text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white focus:outline-none cursor-pointer"
          aria-label={isHelpChatOpen ? "Close Help Chat" : "Open Help Chat"}
        >
          {isHelpChatOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
              {/* Online pulsing dot */}
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
              {/* Tooltip on hover (desktop) */}
              <span className="hidden sm:group-hover:flex absolute right-16 px-3 py-1.5 rounded-xl bg-[#0A2540] text-white text-xs font-bold whitespace-nowrap shadow-lg items-center gap-1.5 pointer-events-none">
                Need Help?
              </span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
