"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  DollarSign,
  TrendingUp,
  MessageSquare,
  Send,
  Users,
  ShieldCheck,
  Award,
  PlayCircle
} from "lucide-react";


export default function InvestorAuctionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bids, setBids] = useState([
    { bidder: "Investor 3 (Family Office)", amount: "$500K", valuation: "$25.0M", time: "Just now" },
    { bidder: "Investor 1 (Lead VC)", amount: "$1.5M", valuation: "$26.0M", time: "2 mins ago" },
    { bidder: "Investor 2 (Angel)", amount: "$250K", valuation: "$24.0M", time: "10 mins ago" }
  ]);
  const [amount, setAmount] = useState("");
  const [valuation, setValuation] = useState("");

  const handlePlaceBid = () => {
    if (!amount || !valuation) return;
    setBids((prev) => [
      { bidder: "You (Investor Lead)", amount: `$${amount}K`, valuation: `$${valuation}M`, time: "Just now" },
      ...prev
    ]);

    setAmount("");
    setValuation("");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto font-sans pb-12 flex flex-col h-[calc(100vh-140px)] justify-between">
      
      {/* Top Header */}
      <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white font-serif">Live Auction Room</h2>
          <span className="flex items-center gap-1 bg-[#ccf063]/10 border border-[#ccf063]/30 px-2 py-0.5 rounded-full text-[9px] font-bold text-[#ccf063] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#ccf063] rounded-full animate-pulse mr-1" /> Live Session
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#c5c9b2]">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 12 Active Bidders</span>
        </div>
      </div>

      {/* Main Panel Work area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6 flex-1 overflow-hidden">
        
        {/* Left: Chat log */}
        <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-sm font-bold text-white font-serif mb-4 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#ccf063]" /> Anonymous Chat
            </h3>
            <div className="space-y-3 text-xs overflow-y-auto max-h-[300px]">
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                <span className="text-[#ccf063] font-bold">Investor 1:</span> What is the projected ARR run rate post-funding?
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                <span className="text-[#ccf063] font-bold">Investor 2:</span> Looking to co-invest. Do we have a lead yet?
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Send message..."
              className="flex-1 bg-black/40 border border-[#454937]/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#ccf063]"
            />
            <button className="bg-white/10 p-2.5 rounded-xl border border-white/10">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Center: Live Bids Ticker */}
        <div className="lg:col-span-2 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-full overflow-hidden">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">Live Bid Ticker</h3>
            <div className="space-y-3 overflow-y-auto max-h-[220px]">
              {bids.map((bid, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs hover:border-[#ccf063] transition-colors">
                  <div>
                    <h4 className="font-bold text-white">{bid.bidder}</h4>
                    <p className="text-[10px] text-[#c5c9b2]/60">{bid.time}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#ccf063] block">{bid.amount}</span>
                    <span className="text-[10px] text-[#c5c9b2]">at {bid.valuation} val cap</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Place Bid Form */}
          <div className="bg-black/35 border border-white/5 p-4 rounded-xl space-y-3 text-xs mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Bid Amount ($K)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black border border-[#454937]/50 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Valuation Cap ($M)</label>
                <input
                  type="number"
                  placeholder="25"
                  value={valuation}
                  onChange={(e) => setValuation(e.target.value)}
                  className="w-full bg-black border border-[#454937]/50 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handlePlaceBid}
              className="w-full py-3 bg-[#ccf063] text-black font-bold rounded-xl text-xs hover:scale-102 transition-transform shadow-md shadow-[#ccf063]/10"
            >
              Place Bid
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
