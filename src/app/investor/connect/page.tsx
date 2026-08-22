"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  UserPlus,
  Check,
  Send,
  MessageSquare,
  Search,
  Filter,
  Share2,
  FileText,
  Clock,
  Compass,
  ArrowRight,
  Handshake,
  CheckCircle2,
  Plus,
  Image as ImageIcon,
  Loader2,
  X,
  Sparkles,
  Heart
} from "lucide-react";

function getRelativeTime(dateString: string) {
  const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return diff + " sec ago";
  if (diff < 3600) return Math.floor(diff / 60) + " mins ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hours ago";
  return Math.floor(diff / 86400) + " days ago";
}

export default function ConnectHubPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userEmail, role, userName } = useAuth() as any;
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Create Post Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFixingText, setIsFixingText] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Comment toggle state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Comment input state
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const submitComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments + 1,
          postComments: [...(p.postComments || []), {
            id: Math.random().toString(),
            text,
            authorName: userName || "You",
            authorInitial: userName?.charAt(0) || "U",
            avatar: "",
            time: "just now",
            isAuthor: p.email === userEmail
          }]
        };
      }
      return p;
    }));
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));

    // API call
    try {
      await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorEmail: userEmail,
          authorName: userName,
          content: text
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLike = async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ));

    // API call
    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Modal State
  const [selectedProfileEmail, setSelectedProfileEmail] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);


  // Initial Fetch
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const json = (await res.json()) as any;
      if (json.success) {
        // map db posts to UI posts
        setPosts(json.posts.map((p: any) => ({
          id: p.id,
          name: p.authorName,
          role: p.authorRole,
          email: p.authorEmail,
          avatar: p.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
          time: `uploaded ${getRelativeTime(p.createdAt)}`,
          text: p.content,
          mediaUrl: p.mediaUrl,
          tags: p.tags,
          connected: false,
          likes: p.likes || 0,
          comments: p.comments ? p.comments.length : 0,
          liked: p.likedBy ? p.likedBy.includes(userEmail) : false,
          postComments: (p.comments || []).map((c: any) => ({
            id: c.id,
            text: c.content,
            authorName: c.authorName,
            authorInitial: c.authorName.charAt(0),
            avatar: c.authorAvatar,
            time: getRelativeTime(c.createdAt),
            isAuthor: c.authorEmail === userEmail
          }))
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Initial animation
  useEffect(() => {
    if (!loadingPosts) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".animate-item",
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loadingPosts]);

  // Modal Animation
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.2)" }
      );
    }
  }, [isModalOpen]);

  const handleConnectClick = async (postId: string, receiverEmail: string) => {
    if (!userEmail || !receiverEmail) return;
    
    // Optimistic UI Update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, connected: true } : p));

    try {
      await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail: userEmail, receiverEmail })
      });
    } catch (e) {
      console.error(e);
      // Revert on error
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, connected: false } : p));
    }
  };



  const handlePostCreate = async () => {
    if (!newPostText.trim()) return;
    setIsUploading(true);
    let mediaUrl = "";

    try {
      if (selectedFile) {
        try {
          // Upload to Cloudflare Worker R2
          const fileKey = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`;
          const uploadUrl = `${process.env.NEXT_PUBLIC_UPLOAD_WORKER_URL}/${fileKey}`;
          
          const res = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_UPLOAD_WORKER_SECRET}`,
              "Content-Type": selectedFile.type
            },
            body: selectedFile
          });
          
          if (res.ok) {
            mediaUrl = uploadUrl; // Worker GET requests serve the file
          } else {
            throw new Error("Worker upload returned non-ok status");
          }
        } catch (uploadError) {
          console.warn("Upload to worker failed, falling back to local object URL for preview", uploadError);
          mediaUrl = URL.createObjectURL(selectedFile);
        }
      }

      // Create Post DB Entry
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorEmail: userEmail,
          authorName: userName || "User",
          authorRole: role || "User",
          content: newPostText,
          mediaUrl,
          tags: []
        })
      });

      setIsModalOpen(false);
      setNewPostText("");
      setSelectedFile(null);
      fetchPosts(); // Refresh feed
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
        body: JSON.stringify({ text: newPostText })
      });
      const json = (await res.json()) as any;
      if (json.success && json.text) {
        setNewPostText(json.text);
      }
    } catch (e) {
      console.error("Failed to fix text:", e);
    } finally {
      setIsFixingText(false);
    }
  };
  const filteredPosts = posts.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchProfile = async (email: string) => {
    setSelectedProfileEmail(email);
    setLoadingProfile(true);
    setProfileData(null);
    try {
      const res = await fetch(`/api/users/public-profile?email=${encodeURIComponent(email)}`);
      const json = (await res.json()) as any;
      
      if (json.success && json.data) {
        setProfileData({
          name: json.data.name,
          tagline: json.data.tagline,
          logoUrl: json.data.logoUrl,
          category: json.data.category,
          stage: json.data.stage,
          gatedFields: json.data.gatedFields,
          startupName: json.data.startupName,
          firm: json.data.firm,
          details: json.data.details,
          type: json.type
        });
      } else {
        // Fallback if not in DB
        const post = posts.find(p => p.email === email);
        setProfileData({
          name: post?.name || "User Profile",
          tagline: post?.role || "User",
          logoUrl: post?.avatar || "",
          category: "Technology",
          stage: "General",
          gatedFields: "[]",
          details: "No additional profile details found."
        });
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const post = posts.find(p => p.email === email);
      setProfileData({
        name: post?.name || "User Profile",
        tagline: post?.role || "User",
        logoUrl: post?.avatar || "",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto font-sans pb-12 pt-0">
      
      {/* Header Banner */}
      <div className="sticky top-0 bg-[#0e0e0e] z-30 pt-1 pb-6 mb-6 animate-item flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5">
        <div>
          <h2 className="text-4xl font-serif text-white italic">Connect Hub</h2>
          <p className="text-xs text-[#c5c9b2] mt-1">Share venture updates, collaborate on syndicates, and connect directly with verified founders and investors.</p>
        </div>
        
        {/* Search Bar moved to Header for a unique place */}
        <div className="w-full sm:w-80">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-white/40 shrink-0" />
            <input 
              type="text"
              placeholder="Search by name, username or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f1f1f]/50 border border-white/10 rounded-full py-2.5 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ccf063]/50 focus:bg-[#1f1f1f] transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="max-w-3xl mx-auto pt-6">

        <div className="space-y-5">
          
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl hover:border-white/20 transition-all"
            >
              {/* Header profile row */}
              <div className="flex justify-between items-start">
                <div 
                  className="flex gap-3 cursor-pointer group" 
                  onClick={() => fetchProfile(post.email)}
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 bg-slate-800 group-hover:border-[#ccf063] transition-colors">
                    <img src={post.avatar} alt={post.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5 group-hover:text-[#ccf063] transition-colors">
                      {post.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ccf063] fill-black" />
                      <span className="bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] rounded px-1.5 py-0.5 text-[8px] font-bold">
                        {post.match}
                      </span>
                    </h4>
                    <p className="text-[10px] text-[#c5c9b2]/60 mt-0.5">{post.role} · {post.time}</p>
                  </div>
                </div>

                {post.email !== userEmail && (
                  <button
                    onClick={() => handleConnectClick(post.id, post.email)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      post.connected
                        ? "bg-white/5 border border-white/10 text-white/55"
                        : "bg-[#ccf063] hover:bg-[#c2e45d] text-black"
                    }`}
                  >
                    {post.connected ? (
                      <>
                        <Check className="w-3 h-3" /> Pending
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" /> Connect
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Text content body */}
              <p className="text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap">
                {post.text}
              </p>

              {/* Optional Media */}
              {post.mediaUrl && (
                <div className="rounded-xl overflow-hidden border border-white/5 bg-black mt-3">
                  <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[300px] object-cover" />
                </div>
              )}

              {/* Tags */}
              <div className="flex gap-2 flex-wrap text-[9px] font-bold">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-black/35 border border-white/5 text-[#c5c9b2] px-2 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-4 text-xs font-medium text-white/50 px-2">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors ${post.liked ? 'text-[#ccf063]' : 'hover:text-white'}`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-[#ccf063]' : ''}`} /> {post.likes} Likes
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> {post.comments} Comments
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments[post.id] && (
                <div className="pt-3 border-t border-white/5 space-y-3">
                  {post.postComments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                        {comment.avatar ? (
                          <img src={comment.avatar} alt={comment.authorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800 text-white text-[10px] font-bold">
                            {comment.authorInitial}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-white">{comment.authorName}</span>
                            {comment.isAuthor && (
                              <span className="bg-[#ccf063]/20 border border-[#ccf063]/30 text-[#ccf063] px-1 py-0 rounded text-[8px] font-bold">Author</span>
                            )}
                          </div>
                          <span className="text-[9px] text-white/40">{comment.time}</span>
                        </div>
                        <p className="text-[11px] text-white/80">{comment.text}</p>
                        <div className="mt-2 flex gap-3 text-[10px] font-bold text-white/40">
                          <button 
                            onClick={() => {
                              setPosts(prev => prev.map(p => {
                                if (p.id === post.id) {
                                  return {
                                    ...p,
                                    postComments: p.postComments.map((c: any) => 
                                      c.id === comment.id 
                                        ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
                                        : c
                                    )
                                  };
                                }
                                return p;
                              }));
                            }}
                            className={`transition-colors flex items-center gap-1 ${comment.liked ? 'text-[#ccf063]' : 'hover:text-[#ccf063]'}`}
                          >
                            <Heart className={`w-3 h-3 ${comment.liked ? 'fill-[#ccf063]' : ''}`} /> {comment.likes}
                          </button>
                          <button className="hover:text-white transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Comment Input */}
                  <div className="flex gap-3 mt-3 items-center pt-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 shrink-0 border border-white/10 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800 text-white text-[10px] font-bold">
                        {userName?.charAt(0) || "U"}
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        placeholder="Write a comment..." 
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitComment(post.id);
                        }}
                        className="w-full bg-[#1f1f1f] border border-white/10 rounded-full py-1.5 pl-3 pr-8 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#ccf063]/50 transition-colors"
                      />
                      <button 
                        onClick={() => submitComment(post.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#ccf063] transition-colors"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-[#ccf063] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(204,240,99,0.3)] hover:scale-110 transition-transform z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div ref={modalRef} className="bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/20 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                Create a Post
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 relative">
              <div className="relative">
                <textarea
                  placeholder="What's happening in your network?"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#ccf063]/50 min-h-[140px] resize-none pb-12"
                />
                
                {/* AI Fix Text Button */}
                <button
                  onClick={handleFixText}
                  disabled={!newPostText.trim() || isFixingText}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  title="Fix grammar and tone with AI"
                >
                  {isFixingText ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isFixingText ? "Fixing..." : "AI Editor"}
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <input 
                    type="file" 
                    id="media-upload" 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="media-upload" className="flex items-center gap-2 text-sm text-[#ccf063] cursor-pointer hover:text-white transition-colors bg-[#ccf063]/5 px-3 py-2 rounded-xl border border-[#ccf063]/20">
                    <ImageIcon className="w-4 h-4" /> 
                    <span className="truncate max-w-[150px]">{selectedFile ? selectedFile.name : "Attach Media"}</span>
                  </label>
                </div>
                
                <button
                  onClick={handlePostCreate}
                  disabled={!newPostText.trim() || isUploading}
                  className="bg-[#ccf063] hover:bg-[#b8d957] text-black px-8 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedProfileEmail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProfileEmail(null)} />
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <button 
              className="absolute top-4 right-4 text-white/50 hover:text-white"
              onClick={() => setSelectedProfileEmail(null)}
            >
              <X className="w-5 h-5" />
            </button>
            {loadingProfile ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/50 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-[#ccf063]" />
                Loading Profile...
              </div>
            ) : profileData ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img src={profileData.logoUrl} alt={profileData.name} className="w-16 h-16 rounded-full object-cover border border-white/10 bg-white/5" />
                  <div>
                    <h3 className="text-xl font-bold text-white font-serif">{profileData.name}</h3>
                    <p className="text-sm text-[#ccf063]">{profileData.tagline}</p>
                  </div>
                </div>
                <button
                   onClick={() => router.push(`/${profileData.type || "investor"}/profile?email=${encodeURIComponent(selectedProfileEmail)}`)}
                   className="w-full py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-bold transition-colors mt-2"
                >
                  View Full Profile
                </button>
                <button
                   onClick={() => handleConnectClick(posts.find(p => p.email === selectedProfileEmail)?.id || "", selectedProfileEmail)}
                   className="w-full py-3 bg-[#ccf063] hover:bg-[#bce650] text-black rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
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
