"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  Bell,
  CheckCircle2,
  Clock,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Bookmark,
  Share2,
  Trash2,
  Tag,
  Search,
  Check,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  type: "PROFILE_UPDATE" | "CONNECTION_REQUEST" | "CHAT_MOVEMENT" | "TAGGED" | "RECOMMENDATION" | "INTRO_REQUEST" | "AUTONOMOUS_RECOMMENDATION";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: "profile" | "connection" | "chat" | "request" | "recommendation" | "mention";
  metadata?: any;
}

export default function InvestorNotificationsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userEmail } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    if (userEmail) {
      fetchNotifications();
    }
  }, [userEmail]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/investor/notifications?email=${encodeURIComponent(userEmail || "")}`);
      const json = (await res.json()) as any;
      if (json.success) {
        setNotifications(json.notifications);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  // GSAP animations
  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".notification-card",
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, filter, categoryFilter]);

  // Actions
  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/investor/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true })
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/investor/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true, email: userEmail })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/investor/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Direct action handlers
  const handleAcceptConnection = async (notificationId: string, connectionId: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: connectionId, status: "ACCEPTED" })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        // Update notification description & status
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? {
                  ...n,
                  read: true,
                  title: "Connection Request Accepted",
                  message: `You accepted the connection request. You can now chat in Meetings.`,
                  metadata: { ...n.metadata, status: "ACCEPTED" }
                }
              : n
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIgnoreConnection = async (notificationId: string, connectionId: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: connectionId, status: "REJECTED" })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        // Delete notification or modify
        handleDelete(notificationId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Notifications List
  const filteredNotifications = notifications.filter(n => {
    // Read status filter
    if (filter === "UNREAD" && n.read) return false;
    if (filter === "READ" && !n.read) return false;

    // Category filter
    if (categoryFilter !== "ALL" && n.category !== categoryFilter) return false;

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Icon mapping helper
  const getIcon = (type: string) => {
    switch (type) {
      case "CONNECTION_REQUEST":
        return <UserCheck className="w-5 h-5 text-blue-400" />;
      case "PROFILE_UPDATE":
        return <Bookmark className="w-5 h-5 text-yellow-400" />;
      case "CHAT_MOVEMENT":
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case "INTRO_REQUEST":
        return <Share2 className="w-5 h-5 text-purple-400" />;
      case "RECOMMENDATION":
      case "AUTONOMOUS_RECOMMENDATION":
        return <TrendingUp className="w-5 h-5 text-[#ccf063]" />;
      case "TAGGED":
        return <Tag className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto py-8 px-4 font-sans text-white">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="p-2 rounded-xl bg-[#ccf063]/10 border border-[#ccf063]/20 text-[#ccf063] inline-block">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif italic">Notification Centre</h1>
          </div>
          <p className="text-xs text-[#c5c9b2] mt-0.5">
            Stay updated with profile changes, deal actions, connection requests, and system recommendations.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs font-bold text-[#ccf063] hover:text-[#bce055] flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 bg-white/5 border border-white/10 px-4.5 py-2 rounded-xl"
          >
            <Check className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Filters Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Read/Unread Tabs */}
          <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-2 flex flex-row lg:flex-col gap-1">
            <button
              onClick={() => setFilter("ALL")}
              className={`flex-1 lg:flex-initial text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                filter === "ALL" ? "bg-[#b0d449] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>All notifications</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === "ALL" ? "bg-black/10 text-black font-extrabold" : "bg-white/10 text-white/50"}`}>
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setFilter("UNREAD")}
              className={`flex-1 lg:flex-initial text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                filter === "UNREAD" ? "bg-[#b0d449] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === "UNREAD" ? "bg-black/20 text-black font-extrabold" : "bg-[#ccf063] text-black font-extrabold animate-pulse"}`}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilter("READ")}
              className={`flex-1 lg:flex-initial text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                filter === "READ" ? "bg-[#b0d449] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Read</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === "READ" ? "bg-black/10 text-black font-extrabold" : "bg-white/10 text-white/50"}`}>
                {notifications.filter(n => n.read).length}
              </span>
            </button>
          </div>

          {/* Category List */}
          <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-4 hidden lg:block space-y-2">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono mb-3">Categories</h4>
            
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                categoryFilter === "ALL" ? "text-[#ccf063] font-bold bg-[#ccf063]/5" : "text-white/50 hover:text-white"
              }`}
            >
              <span>All categories</span>
            </button>

            {[
              { id: "connection", label: "Connections" },
              { id: "profile", label: "Profile Updates" },
              { id: "request", label: "Deal Requests" },
              { id: "recommendation", label: "Recommendations" },
              { id: "mention", label: "Mentions" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  categoryFilter === cat.id ? "text-[#ccf063] font-bold bg-[#ccf063]/5" : "text-white/50 hover:text-white"
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] text-white/20">
                  {notifications.filter(n => n.category === cat.id).length}
                </span>
              </button>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Notifications Feed */}
        <div className="lg:col-span-9 space-y-3.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20 bg-[#1f1f1f] border border-white/10 rounded-2xl">
              <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/60 font-serif text-lg">No Notifications Found</p>
              <p className="text-xs text-white/40 mt-1">There are no updates matching your active criteria.</p>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id)}
                className={`notification-card bg-[#1f1f1f] border rounded-2xl p-4.5 transition-all flex items-start gap-4 relative overflow-hidden group hover:border-white/20 ${
                  !item.read ? "border-white/15 bg-white/[0.02]" : "border-white/5 opacity-75"
                }`}
              >
                {/* Unread indicator sidebar */}
                {!item.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ccf063]" />
                )}

                {/* Left Category Icon */}
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  !item.read 
                    ? "bg-white/5 border-white/10" 
                    : "bg-black/10 border-white/5"
                }`}>
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#c5c9b2] mt-1.5 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-white/40 mt-3 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}</span>
                    </div>

                    <span>&bull;</span>
                    <span className="uppercase tracking-wider text-[9px] text-[#ccf063] font-bold font-sans">
                      {item.category}
                    </span>
                  </div>

                  {/* Actions Container depending on Type */}
                  <div className="flex flex-wrap gap-2.5 mt-4">
                    {item.type === "CONNECTION_REQUEST" && item.metadata?.status === "PENDING" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptConnection(item.id, item.metadata.connectionId);
                          }}
                          className="px-4 py-1.5 bg-[#ccf063] hover:bg-[#bce055] text-black font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Request
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIgnoreConnection(item.id, item.metadata.connectionId);
                          }}
                          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-xs rounded-lg transition-colors"
                        >
                          Ignore
                        </button>
                      </>
                    )}

                    {item.type === "CHAT_MOVEMENT" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/investor/meetings");
                        }}
                        className="px-4 py-1.5 bg-[#ccf063] hover:bg-[#bce055] text-black font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Open Deal Room
                      </button>
                    )}

                    {item.type === "RECOMMENDATION" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/investor/feed");
                        }}
                        className="px-4 py-1.5 bg-[#ccf063]/10 hover:bg-[#ccf063]/25 border border-[#ccf063]/25 text-[#ccf063] font-extrabold text-xs rounded-lg transition-colors"
                      >
                        Evaluate Deal
                      </button>
                    )}

                    {item.type === "AUTONOMOUS_RECOMMENDATION" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/investor/feed");
                        }}
                        className="px-4 py-1.5 bg-[#ccf063] text-black font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-[0_0_15px_rgba(204,240,99,0.3)] hover:scale-105"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> View AI Top Pick
                      </button>
                    )}

                    {item.type === "PROFILE_UPDATE" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/investor/feed");
                        }}
                        className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-xs rounded-lg transition-colors"
                      >
                        View Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Close / Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="absolute top-4 right-4 text-white/30 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100"
                  title="Remove notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
