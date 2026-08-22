"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, Check, X, Clock } from "lucide-react";
import { gsap } from "gsap";

export default function NotificationsPage() {
  const { userEmail } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      fetchRequests();
    }
  }, [userEmail]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/connections?email=${encodeURIComponent(userEmail!)}`);
      const json = (await res.json()) as any;
      if (json.success) {
        setRequests(json.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        ".request-item",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [loading, requests]);

  const handleAction = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      // Optimistic update
      setRequests(prev => prev.filter(r => r.id !== id));
      
      await fetch("/api/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch (e) {
      console.error("Failed to update status", e);
      fetchRequests(); // Revert on failure
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 font-sans text-white">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-[#ccf063]/10 flex items-center justify-center border border-[#ccf063]/20">
          <Bell className="w-5 h-5 text-[#ccf063]" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold">Notifications</h1>
          <p className="text-sm text-white/50">Manage your connection requests</p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-16 bg-[#1f1f1f] rounded-2xl border border-white/5">
            <Bell className="w-12 h-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/50 text-sm">You have no pending requests.</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="request-item bg-[#1f1f1f] border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/20 transition-colors shadow-lg">
              <div className="flex flex-col">
                <p className="font-semibold text-lg">{req.senderEmail}</p>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(req.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleAction(req.id, "ACCEPTED")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#ccf063] hover:bg-[#b8d957] text-black px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  <Check className="w-4 h-4" /> Allow
                </button>
                <button
                  onClick={() => handleAction(req.id, "REJECTED")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  <X className="w-4 h-4" /> Not Allow
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
