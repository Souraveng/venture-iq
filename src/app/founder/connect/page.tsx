"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  UserPlus, Check, Send, MessageSquare, Search, Share2,
  CheckCircle2, Plus, Image as ImageIcon, Loader2, X,
  Sparkles, Heart, Bookmark, BookmarkCheck, Repeat2, TrendingUp,
  BarChart3, Flame, Hash, Users, PlusCircle, Trash2
} from "lucide-react";

const REACTIONS = [
  { emoji: "\ud83d\udd25", label: "Fire", key: "fire" },
  { emoji: "\ud83d\udca1", label: "Insight", key: "insight" },
  { emoji: "\ud83e\udd1d", label: "Vibe", key: "vibe" },
  { emoji: "\ud83d\ude80", label: "Launch", key: "launch" },
  { emoji: "\u2764\ufe0f", label: "Love", key: "love" },
];

function getRelativeTime(dateString: string) {
  const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return diff + "s";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  return Math.floor(diff / 86400) + "d";
}

function ReactionBar({
  post,
  userEmail,
  onReact,
}: {
  post: any;
  userEmail: string;
  onReact: (postId: string, key: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const total = REACTIONS.reduce((acc, r) => acc + (post.reactionCounts?.[r.key] || 0), 0);
  const myReaction = REACTIONS.find((r) => post.myReaction === r.key);

  return (
    <div className="relative flex items-center gap-1">
      <button
        className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-white/50 hover:text-zinc-800 dark:hover:text-white transition-colors"
        onClick={() => setShowPicker((v) => !v)}
      >
        <span className="text-base">{myReaction ? myReaction.emoji : "\u2764\ufe0f"}</span>
        <span>{total > 0 ? total : "React"}</span>
      </button>
      {showPicker && (
        <div className="absolute bottom-8 left-0 bg-white dark:bg-[#1f1f1f] border border-zinc-200 dark:border-white/10 rounded-full shadow-2xl flex items-center gap-1 px-2 py-1.5 z-50">
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              title={r.label}
              onClick={() => {
                onReact(post.id, r.key);
                setShowPicker(false);
              }}
              className={`text-xl hover:scale-125 transition-transform p-0.5 rounded-full ${
                post.myReaction === r.key ? "bg-[#ccf063]/20" : ""
              }`}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConnectHubPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userEmail, role, userName, userAvatar } = useAuth() as any;

  // Feed state
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Stories
  const [stories, setStories] = useState<any[]>([]);

  // Trending tags
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);

  // Follow state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  // Bookmarks (client-side only — could be moved to DB later)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Create post modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleSharePost = async (post: any) => {
    const url = `${window.location.origin}/founder/connect#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.name} on VentureIQ`, text: post.text, url });
        setShareNotice("Post shared.");
      } else {
        const text = `${post.text}\n\n${url}`;
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else {
          const field = document.createElement("textarea");
          field.value = text;
          document.body.appendChild(field);
          field.select();
          document.execCommand("copy");
          field.remove();
        }
        setShareNotice("Link copied to clipboard.");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") setShareNotice("Unable to share this post.");
    } finally {
      window.setTimeout(() => setShareNotice(null), 2500);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!userEmail || !window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/posts/${postId}?email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Could not delete this post.");
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete this post.");
    }
  };
  const [isUploading, setIsUploading] = useState(false);
  const [isFixingText, setIsFixingText] = useState(false);
  const [postType, setPostType] = useState<"post" | "poll">("post");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Profile quick-view
  const [selectedProfileEmail, setSelectedProfileEmail] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ── Data Fetchers ─────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const json = (await res.json()) as any;
      if (!json.success) return;
      const mapped = json.posts.map((p: any) => ({
        id: p.id,
        name: p.authorName,
        username: p.authorUsername,
        role: p.authorRole,
        email: p.authorEmail,
        avatar: p.authorAvatar || "",
        time: getRelativeTime(p.createdAt),
        text: p.content,
        mediaUrl: p.mediaUrl,
        tags: p.tags || [],
        connected: false,
        likes: p.likes || 0,
        comments: p.comments ? p.comments.length : 0,
        liked: p.likedBy ? p.likedBy.includes(userEmail) : false,
        myReaction: null as string | null,
        reactionCounts: {} as Record<string, number>,
        postComments: (p.comments || []).map((c: any) => ({
          id: c.id,
          text: c.content,
          authorName: c.authorName,
          authorInitial: c.authorName.charAt(0),
          avatar: c.authorAvatar,
          time: getRelativeTime(c.createdAt),
          isAuthor: c.authorEmail === userEmail,
        })),
      }));
      // Fetch reactions for each post in parallel
      const withReactions = await Promise.all(
        mapped.map(async (post: any) => {
          try {
            const r = await fetch(
              `/api/reactions?postId=${post.id}&userEmail=${encodeURIComponent(userEmail || "")}`
            );
            const rj = (await r.json()) as any;
            if (rj.success) {
              return { ...post, reactionCounts: rj.counts || {}, myReaction: rj.myReaction };
            }
          } catch {}
          return post;
        })
      );
      setPosts(withReactions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  }, [userEmail]);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/stories?userEmail=${encodeURIComponent(userEmail || "")}`
      );
      const json = (await res.json()) as any;
      if (json.success) setStories(json.stories || []);
    } catch (e) {
      console.error(e);
    }
  }, [userEmail]);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const res = await fetch("/api/posts/trending-tags");
      const json = (await res.json()) as any;
      if (json.success) setTrendingTags(json.tags || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchFollowData = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/follows?email=${encodeURIComponent(userEmail)}`);
      const json = (await res.json()) as any;
      if (json.success) {
        setFollowed(new Set(json.following || []));
        setSuggestions(json.suggestions || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchPosts();
    fetchStories();
    fetchTrendingTags();
    fetchFollowData();
  }, [fetchPosts, fetchStories, fetchTrendingTags, fetchFollowData]);

  useEffect(() => {
    if (!loadingPosts) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".animate-item",
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loadingPosts]);

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.2)" }
      );
    }
  }, [isModalOpen]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggleComments = (postId: string) =>
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));

  const submitComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments + 1,
          postComments: [
            ...(p.postComments || []),
            {
              id: Math.random().toString(),
              text,
              authorName: userName || "You",
              authorInitial: userName?.charAt(0) || "U",
              avatar: userAvatar || "",
              time: "just now",
              isAuthor: true,
            },
          ],
        };
      })
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    try {
      await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail: userEmail, authorName: userName, content: text }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReact = async (postId: string, key: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const prevR = p.myReaction;
        const counts = { ...(p.reactionCounts || {}) };
        if (prevR) counts[prevR] = Math.max(0, (counts[prevR] || 1) - 1);
        const newReaction = prevR === key ? null : key;
        if (newReaction) counts[newReaction] = (counts[newReaction] || 0) + 1;
        return { ...p, myReaction: newReaction, reactionCounts: counts };
      })
    );
    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userEmail, reaction: key }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepost = (post: any) => {
    setPosts((prev) => [
      {
        ...post,
        id: Math.random().toString(),
        time: "just now",
        isRepost: true,
        repostedBy: userName || "You",
        likes: 0,
        comments: 0,
        liked: false,
        myReaction: null,
        reactionCounts: {},
      },
      ...prev,
    ]);
  };

  const toggleBookmark = (postId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleFollow = async (followingEmail: string) => {
    // Optimistic
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(followingEmail)) next.delete(followingEmail);
      else next.add(followingEmail);
      return next;
    });
    try {
      await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerEmail: userEmail, followingEmail }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const votePoll = (postId: string, optionIdx: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || p.votedIdx !== undefined) return p;
        const votes = [...(p.pollVotes || p.pollOptions.map(() => 0))];
        votes[optionIdx]++;
        return { ...p, votedIdx: optionIdx, pollVotes: votes };
      })
    );
  };

  const handleConnectClick = async (postId: string, receiverEmail: string) => {
    if (!userEmail || !receiverEmail) return;
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, connected: true } : p)));
    try {
      await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail: userEmail, receiverEmail }),
      });
    } catch (e) {
      console.error(e);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, connected: false } : p)));
    }
  };

  const handlePostCreate = async () => {
    if (!newPostText.trim()) return;
    setIsUploading(true);
    let mediaUrl = "";
    try {
      if (selectedFile) {
        try {
          const fileKey = `${Date.now()}-${selectedFile.name.replace(/\s+/g, "-")}`;
          const uploadUrl = `${process.env.NEXT_PUBLIC_UPLOAD_WORKER_URL}/${fileKey}`;
          const res = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPLOAD_WORKER_SECRET}`,
              "Content-Type": selectedFile.type,
            },
            body: selectedFile,
          });
          if (res.ok) mediaUrl = uploadUrl;
          else throw new Error("Upload failed");
        } catch {
          mediaUrl = URL.createObjectURL(selectedFile);
        }
      }
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorEmail: userEmail,
          authorName: userName || "User",
          authorRole: role || "User",
          authorAvatar: userAvatar || "",
          content: newPostText,
          mediaUrl,
          tags: [],
          ...(postType === "poll"
            ? { pollOptions: pollOptions.filter((o) => o.trim()) }
            : {}),
        }),
      });

      // Post story if posting
      if (postType === "post") {
        await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorEmail: userEmail,
            authorName: userName || "User",
            authorAvatar: userAvatar || "",
            authorRole: role || "Founder",
            text: newPostText.slice(0, 200),
            mediaUrl,
          }),
        });
      }

      setIsModalOpen(false);
      setNewPostText("");
      setSelectedFile(null);
      setPollOptions(["", ""]);
      setPostType("post");
      fetchPosts();
      fetchStories();
      fetchTrendingTags();
    } catch (e) {
      console.error("Failed to post:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFixText = async () => {
    if (!newPostText.trim()) return;
    setIsFixingText(true);
    try {
      const res = await fetch("/api/ai/fix-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newPostText }),
      });
      const json = (await res.json()) as any;
      if (json.success && json.text) setNewPostText(json.text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFixingText(false);
    }
  };

  const fetchProfile = async (email: string) => {
    setSelectedProfileEmail(email);
    setLoadingProfile(true);
    setProfileData(null);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const post = posts.find((p) => p.email === email);
      setProfileData({
        name: post?.name || "User",
        tagline: post?.role || "Founder",
        logoUrl: post?.avatar || "",
        type: post?.role?.toLowerCase().includes("investor") ? "investor" : "founder",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !activeFilterTag || (p.tags || []).includes(activeFilterTag);
    return matchesSearch && matchesTag;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto font-sans pb-16 pt-0">
      {shareNotice && <div className="fixed right-5 top-5 z-[100] rounded-xl bg-[#ccf063] px-4 py-3 text-xs font-bold text-black shadow-2xl">{shareNotice}</div>}

      {/* Sticky Header */}
      <div className="sticky top-0 bg-zinc-50/95 dark:bg-[#0e0e0e]/95 backdrop-blur-md z-30 pt-1 pb-4 mb-4 animate-item border-b border-zinc-200 dark:border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-4xl font-serif text-zinc-900 dark:text-white italic">Connect Hub</h2>
            <p className="text-xs text-zinc-500 dark:text-[#c5c9b2] mt-1">
              Share updates, discover founders and investors, and grow your venture network.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search posts, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1f1f1f]/60 border border-zinc-200 dark:border-white/10 rounded-full py-2.5 pl-9 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#ccf063]/60 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── Feed Column ── */}
        <div className="flex-1 min-w-0 space-y-4 max-w-2xl mx-auto lg:mx-0">

          {/* Stories Bar */}
          <div className="animate-item bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/8 rounded-2xl p-4 shadow-sm">
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {/* Add your story */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-300 dark:border-white/20 flex items-center justify-center bg-zinc-50 dark:bg-white/5 hover:border-[#ccf063] hover:bg-[#ccf063]/5 transition-all group"
                >
                  <PlusCircle className="w-5 h-5 text-zinc-400 dark:text-white/40 group-hover:text-[#ccf063] transition-colors" />
                </button>
                <span className="text-[10px] text-zinc-500 dark:text-white/50 font-medium">Your story</span>
              </div>
              {stories.length === 0 && !loadingPosts && (
                <div className="flex items-center text-[11px] text-zinc-400 dark:text-white/30 pl-2">
                  No stories yet
                </div>
              )}
              {stories.map((s: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                  <div
                    className={`w-14 h-14 rounded-full p-0.5 ${
                      s.hasNew
                        ? "bg-gradient-to-tr from-[#ccf063] via-[#b3d94a] to-[#8fc73a]"
                        : "bg-zinc-200 dark:bg-white/10"
                    }`}
                  >
                    {s.authorAvatar ? (
                      <img
                        src={s.authorAvatar}
                        alt={s.authorName}
                        className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#1a1a1a]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-lg font-bold border-2 border-white dark:border-[#1a1a1a]">
                        {s.authorName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600 dark:text-white/60 font-medium truncate max-w-[56px] text-center">
                    {s.authorName?.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Tag Filters */}
          {trendingTags.length > 0 && (
            <div className="animate-item flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => setActiveFilterTag(null)}
                className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  !activeFilterTag
                    ? "bg-[#ccf063] text-black border-transparent"
                    : "bg-white dark:bg-white/5 text-zinc-600 dark:text-white/60 border-zinc-200 dark:border-white/10 hover:border-[#ccf063]/50"
                }`}
              >
                <Flame className="w-3 h-3" /> All
              </button>
              {trendingTags.slice(0, 7).map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setActiveFilterTag(activeFilterTag === t.tag ? null : t.tag)}
                  className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    activeFilterTag === t.tag
                      ? "bg-[#ccf063] text-black border-transparent"
                      : "bg-white dark:bg-white/5 text-zinc-600 dark:text-white/60 border-zinc-200 dark:border-white/10 hover:border-[#ccf063]/50"
                  }`}
                >
                  <Hash className="w-2.5 h-2.5" />
                  {t.tag}
                </button>
              ))}
            </div>
          )}

          {/* Quick Post Box */}
          <div className="animate-item bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/8 rounded-2xl p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-sm font-bold">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userName?.charAt(0) || "U"
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 text-left bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-full px-4 py-2.5 text-sm text-zinc-400 dark:text-white/40 transition-colors"
              >
                What is on your mind, {userName?.split(" ")[0] || "Founder"}?
              </button>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
              <button
                onClick={() => { setPostType("post"); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-white/50 hover:text-[#ccf063] transition-colors"
              >
                <ImageIcon className="w-4 h-4" /> Photo/Video
              </button>
              <button
                onClick={() => { setPostType("poll"); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-white/50 hover:text-[#ccf063] transition-colors"
              >
                <BarChart3 className="w-4 h-4" /> Poll
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-white/50 hover:text-[#ccf063] transition-colors"
              >
                <Sparkles className="w-4 h-4" /> AI Draft
              </button>
            </div>
          </div>

          {/* Posts */}
          {loadingPosts ? (
            <div className="flex items-center justify-center py-16 gap-3 text-zinc-400 dark:text-white/40 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#ccf063]" /> Loading feed...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 dark:text-white/40 text-sm">
              No posts found. Be the first to share!
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className="animate-item bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/8 rounded-2xl shadow-sm hover:shadow-md dark:hover:border-white/15 transition-all overflow-hidden"
              >
                {post.isRepost && (
                  <div className="flex items-center gap-2 px-5 pt-3 text-[11px] text-zinc-400 dark:text-white/40">
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span className="font-semibold">{post.repostedBy}</span> reposted
                  </div>
                )}

                <div className="p-5 space-y-3.5">
                  {/* Post Header */}
                  <div className="flex justify-between items-start">
                    <div
                      className="flex gap-3 cursor-pointer group"
                      onClick={() => fetchProfile(post.email)}
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-zinc-100 dark:border-white/10 bg-zinc-100 dark:bg-slate-800 group-hover:border-[#ccf063] transition-colors shrink-0">
                        {post.avatar ? <img src={post.avatar} alt={post.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-sm font-bold text-[#ccf063]">{post.name?.slice(0, 1).toUpperCase() || "?"}</span>}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5 group-hover:text-[#ccf063] transition-colors">
                          {post.name}
                          {post.username && (
                            <span className="text-[10px] text-zinc-400 dark:text-[#c5c9b2]/60 font-mono font-normal">
                              @{post.username}
                            </span>
                          )}
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#ccf063] fill-black dark:fill-black" />
                        </h4>
                        <p className="text-[11px] text-zinc-400 dark:text-[#c5c9b2]/60 mt-0.5 flex items-center gap-1.5">
                          <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                            {post.role}
                          </span>
                          &middot; {post.time} ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {post.email !== userEmail && (
                        <button
                          onClick={() => handleConnectClick(post.id, post.email)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                            post.connected
                              ? "bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-white/55"
                              : "bg-[#ccf063] hover:bg-[#b8d942] text-black"
                          }`}
                        >
                          {post.connected ? (
                            <><Check className="w-3 h-3" /> Pending</>
                          ) : (
                            <><UserPlus className="w-3 h-3" /> Connect</>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => toggleBookmark(post.id)}
                        className="p-1.5 text-zinc-400 dark:text-white/40 hover:text-[#ccf063] transition-colors"
                      >
                        {bookmarks.has(post.id) ? (
                          <BookmarkCheck className="w-4 h-4 text-[#ccf063]" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                      {post.email?.toLowerCase() === userEmail?.toLowerCase() && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete your post"
                          className="p-1.5 text-zinc-400 dark:text-white/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-zinc-800 dark:text-white/90 leading-relaxed whitespace-pre-wrap">
                    {post.text}
                  </p>

                  {/* Media */}
                  {post.mediaUrl && (
                    <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-white/5">
                      <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[320px] object-cover" />
                    </div>
                  )}

                  {/* Poll */}
                  {post.pollOptions && post.pollOptions.length > 0 && (
                    <div className="space-y-2">
                      {post.pollOptions.map((opt: string, idx: number) => {
                        const votes = post.pollVotes || post.pollOptions.map(() => 0);
                        const total = votes.reduce((a: number, b: number) => a + b, 0);
                        const pct = total > 0 ? Math.round((votes[idx] / total) * 100) : 0;
                        const isVoted = post.votedIdx !== undefined;
                        return (
                          <button
                            key={idx}
                            onClick={() => votePoll(post.id, idx)}
                            disabled={isVoted}
                            className={`w-full text-left rounded-xl border overflow-hidden transition-all ${
                              isVoted ? "cursor-default" : "hover:border-[#ccf063]/50"
                            } ${
                              post.votedIdx === idx
                                ? "border-[#ccf063]"
                                : "border-zinc-200 dark:border-white/10"
                            }`}
                          >
                            <div className="relative px-4 py-2.5">
                              {isVoted && (
                                <div
                                  className={`absolute inset-0 ${
                                    post.votedIdx === idx
                                      ? "bg-[#ccf063]/20"
                                      : "bg-zinc-100 dark:bg-white/5"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              )}
                              <div className="relative flex justify-between text-sm font-medium text-zinc-800 dark:text-white/90">
                                <span>{opt}</span>
                                {isVoted && (
                                  <span className="text-xs text-zinc-500 dark:text-white/50">{pct}%</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      <p className="text-[10px] text-zinc-400 dark:text-white/40 font-mono">
                        {(post.pollVotes || []).reduce((a: number, b: number) => a + b, 0)} votes
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {post.tags.map((tag: string) => (
                        <button
                          key={tag}
                          onClick={() => setActiveFilterTag(tag)}
                          className="text-[10px] font-bold text-[#8a9e22] dark:text-[#ccf063] hover:underline"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reaction summary */}
                  {post.reactionCounts &&
                    Object.values(post.reactionCounts).some((v: any) => v > 0) && (
                      <div className="flex gap-2 text-xs text-zinc-500 dark:text-white/50 pt-1 border-t border-zinc-100 dark:border-white/5">
                        {REACTIONS.filter((r) => (post.reactionCounts?.[r.key] || 0) > 0).map((r) => (
                          <span key={r.key}>
                            {r.emoji} {post.reactionCounts[r.key]}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 dark:text-white/50 pt-1 border-t border-zinc-100 dark:border-white/5">
                    <ReactionBar post={post} userEmail={userEmail || ""} onReact={handleReact} />
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" /> {post.comments}
                    </button>
                    <button
                      onClick={() => handleRepost(post)}
                      className="flex items-center gap-1.5 hover:text-[#ccf063] transition-colors"
                    >
                      <Repeat2 className="w-4 h-4" /> Repost
                    </button>
                    <button onClick={() => handleSharePost(post)} className="flex items-center gap-1.5 hover:text-zinc-800 dark:hover:text-white transition-colors ml-auto">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>

                  {/* Comments */}
                  {expandedComments[post.id] && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-white/5 space-y-3">
                      {post.postComments?.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                            {comment.avatar ? (
                              <img src={comment.avatar} alt={comment.authorName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800 text-white text-[10px] font-bold">
                                {comment.authorInitial}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl p-3">
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-zinc-800 dark:text-white">
                                  {comment.authorName}
                                </span>
                                {comment.isAuthor && (
                                  <span className="bg-[#ccf063]/20 text-[#8a9e22] dark:text-[#ccf063] px-1 rounded text-[8px] font-bold">
                                    Author
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-zinc-400 dark:text-white/40">{comment.time}</span>
                            </div>
                            <p className="text-[11px] text-zinc-700 dark:text-white/80">{comment.text}</p>
                            <div className="mt-2 flex gap-3 text-[10px] font-bold text-zinc-400 dark:text-white/40">
                              <button className="hover:text-[#ccf063] flex items-center gap-1">
                                <Heart className="w-3 h-3" /> {comment.likes || 0}
                              </button>
                              <button className="hover:text-zinc-800 dark:hover:text-white">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-3 items-center pt-1">
                        <div className="w-7 h-7 rounded-full shrink-0 bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                          {userAvatar ? (
                            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                          ) : (
                            userName?.charAt(0) || "U"
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => { if (e.key === "Enter") submitComment(post.id); }}
                            className="w-full bg-zinc-100 dark:bg-[#1f1f1f] border border-zinc-200 dark:border-white/10 rounded-full py-1.5 pl-3 pr-8 text-[11px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#ccf063]/50 transition-colors"
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-white/30 hover:text-[#ccf063] transition-colors"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">

          {/* Who to Follow */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/8 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ccf063]" /> Who to Follow
            </h3>
            {suggestions.length === 0 ? (
              <p className="text-[11px] text-zinc-400 dark:text-white/40">
                No suggestions yet. Connect more founders!
              </p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((u: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-zinc-100 dark:border-white/10 bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-sm font-bold">
                      {u.authorAvatar ? (
                        <img src={u.authorAvatar} alt={u.authorName} className="w-full h-full object-cover" />
                      ) : (
                        u.authorName?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{u.authorName}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-white/40 truncate">{u.authorRole}</p>
                    </div>
                    <button
                      onClick={() => handleFollow(u.authorEmail)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                        followed.has(u.authorEmail)
                          ? "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-white/40"
                          : "bg-[#ccf063] border-transparent text-black hover:bg-[#b8d942]"
                      }`}
                    >
                      {followed.has(u.authorEmail) ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Topics */}
          {trendingTags.length > 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/8 rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ccf063]" /> Trending Topics
              </h3>
              <div className="space-y-1.5">
                {trendingTags.map((t, i) => (
                  <button
                    key={t.tag}
                    onClick={() => setActiveFilterTag(activeFilterTag === t.tag ? null : t.tag)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      activeFilterTag === t.tag
                        ? "bg-[#ccf063]/15 border border-[#ccf063]/30"
                        : "hover:bg-zinc-50 dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-white/30 w-4">{i + 1}</span>
                      <span className="font-bold text-zinc-800 dark:text-white">#{t.tag}</span>
                    </div>
                    <span className="text-zinc-400 dark:text-white/40 font-mono text-[10px]">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Posts */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/8 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white mb-2 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#ccf063]" /> Saved Posts
            </h3>
            {bookmarks.size === 0 ? (
              <p className="text-[11px] text-zinc-400 dark:text-white/40">
                No saved posts yet. Tap the bookmark icon to save.
              </p>
            ) : (
              <div className="space-y-2">
                {posts
                  .filter((p) => bookmarks.has(p.id))
                  .slice(0, 3)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="text-[11px] text-zinc-700 dark:text-white/70 border border-zinc-100 dark:border-white/5 rounded-lg p-2 line-clamp-2 bg-zinc-50 dark:bg-white/[0.02]"
                    >
                      {p.text}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-[#ccf063] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(204,240,99,0.4)] hover:scale-110 transition-transform z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div
            ref={modalRef}
            className="bg-white dark:bg-[#1f1f1f] border border-zinc-200 dark:border-white/15 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-serif font-bold text-zinc-900 dark:text-white">Create a Post</h3>
                <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10">
                  <button
                    onClick={() => setPostType("post")}
                    className={`px-3 py-1 text-xs font-bold transition-colors ${
                      postType === "post"
                        ? "bg-[#ccf063] text-black"
                        : "text-zinc-500 dark:text-white/50 hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                  >
                    Post
                  </button>
                  <button
                    onClick={() => setPostType("poll")}
                    className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                      postType === "poll"
                        ? "bg-[#ccf063] text-black"
                        : "text-zinc-500 dark:text-white/50 hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <BarChart3 className="w-3 h-3" /> Poll
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative">
                <textarea
                  placeholder={
                    postType === "poll"
                      ? "Ask your network a question..."
                      : "What is happening in your network?"
                  }
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl p-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#ccf063]/50 min-h-[120px] resize-none pb-12 placeholder:text-zinc-400 dark:placeholder:text-white/40"
                />
                <button
                  onClick={handleFixText}
                  disabled={!newPostText.trim() || isFixingText}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isFixingText ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isFixingText ? "Fixing..." : "AI Polish"}
                </button>
              </div>

              {postType === "poll" && (
                <div className="space-y-2">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const copy = [...pollOptions];
                          copy[i] = e.target.value;
                          setPollOptions(copy);
                        }}
                        className="flex-1 bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/40 focus:outline-none focus:border-[#ccf063]/50"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#8a9e22] dark:text-[#ccf063] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                {postType === "post" ? (
                  <div>
                    <input
                      type="file"
                      id="media-upload"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="media-upload"
                      className="flex items-center gap-2 text-xs text-[#8a9e22] dark:text-[#ccf063] cursor-pointer bg-[#ccf063]/5 px-3 py-2 rounded-xl border border-[#ccf063]/20 hover:bg-[#ccf063]/10 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">
                        {selectedFile ? selectedFile.name : "Attach Media"}
                      </span>
                    </label>
                  </div>
                ) : (
                  <div />
                )}
                <button
                  onClick={handlePostCreate}
                  disabled={!newPostText.trim() || isUploading}
                  className="bg-[#ccf063] hover:bg-[#b8d942] text-black px-7 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Quick-View Modal */}
      {selectedProfileEmail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedProfileEmail(null)}
          />
          <div className="relative bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <button
              className="absolute top-4 right-4 text-zinc-400 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white"
              onClick={() => setSelectedProfileEmail(null)}
            >
              <X className="w-5 h-5" />
            </button>
            {loadingProfile ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400 dark:text-white/50 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-[#ccf063]" /> Loading Profile...
              </div>
            ) : profileData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-100 dark:border-white/10 bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold">
                    {profileData.logoUrl ? (
                      <img src={profileData.logoUrl} alt={profileData.name} className="w-full h-full object-cover" />
                    ) : (
                      profileData.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-serif">
                      {profileData.name}
                    </h3>
                    <p className="text-sm text-[#8a9e22] dark:text-[#ccf063]">{profileData.tagline}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    router.push(
                      `/${profileData.type || "founder"}/profile?email=${encodeURIComponent(
                        selectedProfileEmail
                      )}`
                    )
                  }
                  className="w-full py-2.5 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-800 dark:text-white border border-zinc-200 dark:border-white/20 rounded-xl text-sm font-bold transition-colors"
                >
                  View Full Profile
                </button>
                <button
                  onClick={() =>
                    handleConnectClick(
                      posts.find((p) => p.email === selectedProfileEmail)?.id || "",
                      selectedProfileEmail
                    )
                  }
                  className="w-full py-2.5 bg-[#ccf063] hover:bg-[#b8d942] text-black rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Connect with {profileData.name}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
