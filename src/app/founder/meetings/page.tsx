"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { NativeVideoCall } from "@/components/NativeVideoCall";
import { gsap } from "gsap";
import {
  Pin,
  Reply,
  Smile,
  CheckCheck,
  Image as ImageIcon,
  Mail,
  Filter,
  CheckCircle2,
  ShieldAlert,
  X,
  FileText,
  User,
  MessageSquare,
  Send,
  FileCode,
  Calendar,
  Handshake,
  Lock,
  Plus,
  Paperclip,
  Check,
  Building2,
  MoreVertical,
  ChevronRight,
  FileCheck,
  Bell
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  generateE2EEKeyPair,
  exportPublicKey,
  exportPrivateKey,
  encryptPayload,
  decryptPayload
} from "@/lib/crypto";

// Constants

interface Interaction {
  id: string;
  investorId: string;
  startupId: string;
  state: "INTRO_REQUESTED" | "MUTUAL_MATCH" | "PASSED";
  updatedAt: string;
  investor: {
    name: string;
    firm: string;
    avatarUrl: string;
    checkSize: string;
    location: string;
    trustScore: string;
    email?: string | null;
  };
}

interface Connection {
  id: string;
  senderEmail: string;
  receiverEmail: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

// ─── Invites Panel ───────────────────────────────────────────────
function InvitesPanel({ userEmail }: { userEmail: string | null | undefined }) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/user/invitations?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then((json: any) => {
        if (json.success) setInvites(json.invitations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userEmail]);

  const handleRespond = async (inviteId: string, action: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch("/api/user/invitations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: inviteId, status: action, userEmail })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        if (action === "ACCEPTED") router.refresh();
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-6 text-center text-white/40 text-xs animate-pulse">Loading invites...</div>;
  if (invites.length === 0) return (
    <div className="p-8 text-center space-y-2">
      <Bell className="w-10 h-10 text-white/10 mx-auto" />
      <p className="text-white/40 text-sm">No pending invites</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {invites.map((inv: any) => (
        <div key={inv.id} className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ccf063]/10 text-[#ccf063] flex items-center justify-center shrink-0 font-bold text-sm">
              {(inv.invitedBy || inv.ventureId || "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">{inv.ventureName || inv.ventureId || "Collaboration Invite"}</p>
              <p className="text-white/50 text-xs mt-0.5">Invited by <span className="text-[#ccf063]">{inv.invitedBy}</span></p>
              <p className="text-white/30 text-[10px] font-mono mt-0.5 uppercase tracking-wider">{inv.role || "COLLABORATOR"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRespond(inv.id, "ACCEPTED")}
              className="flex-1 py-2 bg-[#b0d449] hover:bg-[#a1c43f] text-black font-bold rounded-xl text-xs transition-colors"
            >Accept</button>
            <button
              onClick={() => handleRespond(inv.id, "REJECTED")}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl text-xs transition-colors border border-white/10"
            >Decline</button>
          </div>
        </div>
      ))}

    </div>
  );
}

interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  encryptedPayload: string; // JSON string
  createdAt: string;
}

export default function FounderNotificationsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { activeStartup, userEmail, addMeeting } = useAuth();

  const [activeTab, setActiveTab] = useState<"DEALS" | "CONNECTIONS">("DEALS");

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat Room State
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  
  // Social Features State
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);


  // Cryptographic Keys State
  const [publicKeyBase64, setPublicKeyBase64] = useState<string | null>(null);
  const [privateKeyBase64, setPrivateKeyBase64] = useState<string | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);

  // Key Pair Initialization
  useEffect(() => {
    if (!userEmail) return;
    const initKeys = async () => {
      try {
        let pubKey = sessionStorage.getItem(`e2e_pub_${userEmail}`);
        let privKey = sessionStorage.getItem(`e2e_priv_${userEmail}`);
        if (!pubKey || !privKey) {
          const keyPair = await generateE2EEKeyPair();
          pubKey = await exportPublicKey(keyPair.publicKey);
          privKey = await exportPrivateKey(keyPair.privateKey);
          sessionStorage.setItem(`e2e_pub_${userEmail}`, pubKey);
          sessionStorage.setItem(`e2e_priv_${userEmail}`, privKey);
          
          // Register public key in database via API
          await fetch("/api/chat/keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicKey: pubKey })
          });
        }
        setPublicKeyBase64(pubKey);
        setPrivateKeyBase64(privKey);
      } catch (err) {
        console.error("Failed to initialize E2E keys:", err);
      }
    };
    initKeys();
  }, [userEmail]);

  // Recipient public key fetcher
  const fetchRecipientPublicKey = async (recipientEmail: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/chat/keys?email=${encodeURIComponent(recipientEmail)}`);
      const json = (await res.json()) as any;
      if (json && json.publicKey) {
        return json.publicKey;
      }
    } catch (e) {
      console.error("Failed to fetch recipient public key:", e);
    }
    return null;
  };

  // Helper to encrypt message payload
  const encryptChatMessage = async (payload: any, recipientEmail: string) => {
    const payloadStr = JSON.stringify(payload);
    if (!publicKeyBase64) return payloadStr;
    try {
      const recipientPubKey = await fetchRecipientPublicKey(recipientEmail);
      const senderEnc = await encryptPayload(payloadStr, publicKeyBase64);
      const receiverEnc = recipientPubKey 
        ? await encryptPayload(payloadStr, recipientPubKey)
        : senderEnc;
      return JSON.stringify({
        ...payload,
        senderEncrypted: senderEnc,
        receiverEncrypted: receiverEnc
      });
    } catch (err) {
      console.warn("Encryption fallback to structured payload:", err);
      return payloadStr;
    }
  };

  // Helper to decrypt message payload
  const decryptChatMessage = async (encryptedPayloadStr: string, isMe: boolean) => {
    if (!encryptedPayloadStr) return { type: "TEXT", text: "" };
    try {
      const data = typeof encryptedPayloadStr === "string" ? JSON.parse(encryptedPayloadStr) : encryptedPayloadStr;
      
      // If it's already a decoded structured payload with a type, return directly
      if (data && data.type && data.type !== "ENCRYPTED") {
        return data;
      }

      if (data && (data.senderEncrypted || data.receiverEncrypted)) {
        if (privateKeyBase64) {
          try {
            const encryptedData = isMe 
              ? (data.senderEncrypted || data.receiverEncrypted) 
              : (data.receiverEncrypted || data.senderEncrypted);
            const decryptedStr = await decryptPayload(encryptedData, privateKeyBase64);
            return JSON.parse(decryptedStr);
          } catch (decErr) {
            console.warn("Could not decrypt payload with current private key:", decErr);
          }
        }
        if (data.text) return { type: "TEXT", text: data.text };
        return { type: "TEXT", text: "🔒 [Encrypted Message]" };
      }
      return data;
    } catch {
      return { type: "TEXT", text: encryptedPayloadStr };
    }
  };

  const currentSenderId = userEmail || "";

  // Decrypt all messages when they load
  useEffect(() => {
    const decryptAll = async () => {
      const decrypted = await Promise.all(
        messages.map(async (msg) => {
          const isMe = msg.senderId?.toLowerCase() === (userEmail || "").toLowerCase() || msg.senderId === currentSenderId;
          const payload = await decryptChatMessage(msg.encryptedPayload, isMe);
          return {
            ...msg,
            parsedPayload: payload
          };
        })
      );
      setDecryptedMessages(decrypted);
    };
    decryptAll();
  }, [messages, privateKeyBase64, userEmail, currentSenderId]);

  // Modals
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const [activeCallPeerEmail, setActiveCallPeerEmail] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("Partner");
  const [contactPhone, setContactPhone] = useState("");

  const [termSheetOpen, setTermSheetOpen] = useState(false);
  const [tsTitle, setTsTitle] = useState("Seed Round Term Sheet");
  const [tsValuation, setTsValuation] = useState("₹10 Cr");
  const [tsAsk, setTsAsk] = useState("₹2 Cr");

  const [meetingTime, setMeetingTime] = useState("Tomorrow, 11:30 AM");
  const [meetingLoc, setMeetingLoc] = useState("Google Meet");

  useEffect(() => {
    fetchInteractions();
    if (userEmail) fetchConnections();
  }, [userEmail]);

  const fetchConnections = async () => {
    try {
      const res = await fetch(`/api/connections?email=${encodeURIComponent(userEmail)}`);
      const json = (await res.json()) as any;
      if (json.success) {
        setConnections(json.requests);
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    }
  };

  const fetchInteractions = async () => {
    try {
      const res = await fetch(`/api/interactions/founder?startupName=${encodeURIComponent(activeStartup.name)}`);
      const json = (await res.json()) as any;
      if (json.success) {
        setInteractions(json.data);
      }
    } catch (err) {
      console.error("Failed to load interactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Accept/Reject Connection
  const handleConnectionAction = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch("/api/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setConnections(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load chat room when a Mutual Match or Accepted Connection is selected
  useEffect(() => {
    if (!userEmail) return;
    if (activeTab === "DEALS" && selectedInteraction && selectedInteraction.state === "MUTUAL_MATCH") {
      const partner = selectedInteraction.investor?.email || selectedInteraction.investorId;
      initAndFetchChatRoom(selectedInteraction.startupId, partner);
    } else if (activeTab === "CONNECTIONS" && selectedConnection && selectedConnection.status === "ACCEPTED") {
      const partnerEmail = selectedConnection.senderEmail.toLowerCase() === userEmail.toLowerCase() 
        ? selectedConnection.receiverEmail.toLowerCase() 
        : selectedConnection.senderEmail.toLowerCase();
      const [p1, p2] = [userEmail.toLowerCase(), partnerEmail].sort();
      initAndFetchChatRoom(p1, p2);
    } else {
      setActiveChatRoomId(null);
      setMessages([]);
    }
  }, [selectedInteraction, selectedConnection, activeTab, userEmail]);

  // Real-time polling for new messages every 3 seconds
  useEffect(() => {
    if (!activeChatRoomId) return;
    const interval = setInterval(() => {
      fetch(`/api/deal-rooms/messages?chatRoomId=${activeChatRoomId}&email=${encodeURIComponent(userEmail || '')}`)
        .then((res) => res.json())
        .then((json: any) => {
          if (json.success && Array.isArray(json.data)) {
            setMessages(json.data);
          }
        })
        .catch(() => { });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChatRoomId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // GSAP initial load
  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".animate-item",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, activeStartup]);

  const initAndFetchChatRoom = async (founderId: string, investorId: string) => {
    try {
      // 1. Get or Create Room in DB
      const roomRes = await fetch("/api/deal-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founderId, investorId }),
      });
      const roomJson = (await roomRes.json()) as any;

      if (roomJson.success) {
        const roomId = roomJson.data.id;
        setActiveChatRoomId(roomId);

        // 2. Fetch room messages
        const msgsRes = await fetch(`/api/deal-rooms/messages?chatRoomId=${roomId}&email=${encodeURIComponent(userEmail || '')}`);
        const msgsJson = (await msgsRes.json()) as any;
        if (msgsJson.success) {
          setMessages(msgsJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to initialize chat room:", err);
    }
  };

  const handleAction = async (interactionId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch("/api/interactions/founder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interactionId, action }),
      });
      const json = (await res.json()) as any;

      if (json.success) {
        if (action === "accept") {
          setInteractions(prev => prev.map(i => i.id === interactionId ? { ...i, state: "MUTUAL_MATCH" } : i));
          if (selectedInteraction?.id === interactionId) {
            setSelectedInteraction(prev => prev ? { ...prev, state: "MUTUAL_MATCH" } : null);
          }
        } else {
          setInteractions(prev => prev.filter(i => i.id !== interactionId));
          if (selectedInteraction?.id === interactionId) setSelectedInteraction(null);
        }
      }
    } catch (err) {
      console.error("Failed to update interaction:", err);
    }
  };

  // Generic Send Message function
  const handleChatAction = async (msgId: string, action: string, data?: any) => {
    try {
      const payload = { messageId: msgId, action, email: userEmail, ...data };
      const res = await fetch("/api/deal-rooms/messages/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...json.data } : m));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendChatMessage = async (payload: any) => {
    if (!activeChatRoomId) return;
    setIsSending(true);

    try {
      // Determine recipient email
      let recipientEmail = "";
      if (activeTab === "DEALS" && selectedInteraction) {
        recipientEmail = selectedInteraction.investor.email || "";
      } else if (activeTab === "CONNECTIONS" && selectedConnection) {
        recipientEmail = selectedConnection.senderEmail === userEmail ? selectedConnection.receiverEmail : selectedConnection.senderEmail;
      }

      // Encrypt the message payload
      const encryptedPayload = await encryptChatMessage(payload, recipientEmail);

      const res = await fetch("/api/deal-rooms/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: activeChatRoomId,
          senderId: currentSenderId,
          messagePayload: encryptedPayload,
          ...(replyingTo ? { replyToId: replyingTo.id } : {})
        }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setMessages(prev => [...prev, json.data]);
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
      setPlusMenuOpen(false);
    }
  };

  const handleSendText = () => {
    if (!chatInput.trim()) return;
    sendChatMessage({ type: "TEXT", text: chatInput });
    setChatInput("");
  };

  // Complex widget actions
  const sendMeetingLink = () => {
    let meetingLink = "";
    if (meetingLoc === "Google Meet" || meetingLoc === "Zoom Link") {
      meetingLink = "native-webrtc";
    } else {
      meetingLink = "";
    }

    sendChatMessage({
      type: "MEET_LINK",
      title: "Introductory Sync Call",
      time: meetingTime,
      location: meetingLoc,
      link: meetingLink
    });
    setScheduleOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      let uploadUrl = "";
      try {
        const configRes = await fetch("/api/upload-config");
        const config = (await configRes.json()) as any;
        if (config.workerUrl) {
          const uniqueFileName = `${Date.now()}-${file.name}`;
          const res = await fetch(`${config.workerUrl}/${uniqueFileName}`, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              "Authorization": `Bearer ${config.workerSecret}`,
            },
            body: file,
          });
          if (res.ok) {
            uploadUrl = `${config.workerUrl}/${uniqueFileName}`;
          }
        }
      } catch (err) {
        console.warn("Upload worker not available, using fallback url:", err);
      }

      if (!uploadUrl) {
        throw new Error("Upload worker URL not configured. Please set NEXT_PUBLIC_UPLOAD_WORKER_URL.");
      }

      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      sendChatMessage({
        type: "FILE",
        name: file.name,
        size: sizeStr,
        url: uploadUrl
      });
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendContract = () => {
    setTermSheetOpen(true);
    setPlusMenuOpen(false);
  };
  
  const submitContract = () => {
    sendChatMessage({
      type: "CONTRACT",
      title: tsTitle,
      valuation: tsValuation,
      ask: tsAsk,
      status: "PENDING_SIGNATURE"
    });
    setTermSheetOpen(false);
  };

  const sendDocument = () => {
    fileInputRef.current?.click();
  };

  const handleExecuteContract = async (messageId: string, parsedPayload: any) => {
    const updatedPayload = {
      ...parsedPayload,
      status: "SIGNED"
    };

    let recipientEmail = "";
    if (activeTab === "DEALS" && selectedInteraction) {
      recipientEmail = selectedInteraction.investor.email || "";
    } else if (activeTab === "CONNECTIONS" && selectedConnection) {
      recipientEmail = selectedConnection.senderEmail === userEmail ? selectedConnection.receiverEmail : selectedConnection.senderEmail;
    }

    try {
      const encryptedString = await encryptChatMessage(updatedPayload, recipientEmail);
      const res = await fetch("/api/deal-rooms/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          encryptedPayload: encryptedString
        })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? json.data : m));
      }
    } catch (e) {
      console.error("Failed to execute contract:", e);
    }
  };

  const sendContact = () => {
    setContactOpen(true);
    setPlusMenuOpen(false);
  };
  
  const submitContact = () => {
    sendChatMessage({
      type: "CONTACT",
      name: contactName || "Contact Info",
      role: contactRole,
      email: userEmail || "",
      phone: contactPhone
    });
    setContactOpen(false);
  };

  // Message Renderer
  const renderMessageBubble = (msg: any) => {
    const isMe = (msg.senderId || "").toLowerCase().trim() === (userEmail || "").toLowerCase().trim() || msg.senderId === currentSenderId;
    const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload = msg.parsedPayload || (typeof msg.encryptedPayload === "string" ? { type: "TEXT", text: msg.encryptedPayload } : { type: "TEXT", text: "..." });

    const wrapperClass = `flex items-end gap-2.5 max-w-[85%] mb-4 ${isMe ? "ml-auto flex-row-reverse" : ""}`;
    const bubbleClass = `p-3 rounded-2xl leading-relaxed relative group ${isMe
      ? "bg-[#b0d449] text-black font-semibold rounded-br-sm"
      : "bg-black/45 text-[#c5c9b2] border border-white/5 rounded-bl-sm"
      }`;

    switch (payload.type) {
      case "TEXT":
        return (
          <div key={msg.id} className={wrapperClass} onMouseEnter={() => setHoveredMessage(msg.id)} onMouseLeave={() => setHoveredMessage(null)}>
            {!isMe && (
              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                <img src={selectedInteraction?.investor.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="relative group/bubble flex items-center">
              {/* WhatsApp Hover Menu */}
              {hoveredMessage === msg.id && (
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-[#2a2a2a] border border-black/10 dark:border-white/10 rounded-full px-2 py-1 shadow-lg z-20 ${isMe ? "right-[105%]" : "left-[105%]"}`}>
                  <button onClick={() => handleChatAction(msg.id, "react", { reaction: "👍" })} className="hover:scale-125 transition-transform">👍</button>
                  <button onClick={() => handleChatAction(msg.id, "react", { reaction: "❤️" })} className="hover:scale-125 transition-transform">❤️</button>
                  <button onClick={() => setReplyingTo({ id: msg.id, text: payload.text })} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-zinc-500 dark:text-zinc-400 ml-1"><Reply className="w-3.5 h-3.5" /></button>
                </div>
              )}

              <div className={bubbleClass}>
                {/* Instagram/WhatsApp Reply Snippet */}
                {msg.replyToId && (
                  <div className={`mb-2 p-2 rounded-lg text-[11px] border-l-2 ${isMe ? "bg-black/5 border-black/20 text-black/70" : "bg-white/5 border-[#ccf063] text-white/70"}`}>
                    <div className="font-bold mb-0.5">{isMe ? "You" : "Them"} replied</div>
                    <div className="truncate opacity-80">Quoted message...</div>
                  </div>
                )}
                
                <p>{payload.text}</p>
                
                <div className={`flex items-center justify-end gap-1 mt-1 opacity-60 ${isMe ? "text-black" : "text-white"}`}>
                  <span className="text-[10px]">{timeString}</span>
                  {/* WhatsApp Read Receipts */}
                  {isMe && (
                    msg.readAt ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5" />
                  )}
                </div>
                
                {/* Reactions Display */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className={`absolute -bottom-3 flex gap-1 ${isMe ? "right-2" : "left-2"}`}>
                    {Object.entries(msg.reactions).map(([r, users]: [string, any]) => (
                      <span key={r} className="bg-white dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 text-xs rounded-full px-1.5 py-0.5 shadow-sm">
                        {r} {users.length > 1 && users.length}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "FILE":
        const isImage = payload.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        return (
          <div key={msg.id} className={wrapperClass}>
            {!isMe && <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/10" />}
            <div className={`${bubbleClass} ${isImage ? "!p-1" : "!p-4 min-w-[220px]"}`}>
              {isImage ? (
                <div>
                  <img src={payload.url} alt={payload.name} className="w-full max-w-[240px] rounded-xl" />
                  <div className={`flex justify-end gap-1 px-2 pb-1 pt-1 opacity-80 ${isMe ? "text-black" : "text-white"}`}>
                    <span className="text-[10px]">{timeString}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${isMe ? 'bg-black/10' : 'bg-[#ccf063]/10 text-[#ccf063]'}`}>
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold leading-tight truncate max-w-[120px]">{payload.name}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{payload.size}</p>
                    </div>
                  </div>
                  <button onClick={() => window.open(payload.url)} className={`w-full py-1.5 rounded-lg text-xs font-bold mt-2 transition-colors ${isMe ? "bg-black/10 hover:bg-black/20" : "bg-[#ccf063]/10 text-[#ccf063] hover:bg-[#ccf063]/20"}`}>
                    Download
                  </button>
                  <span className={`text-[10px] block text-right mt-2 opacity-60 ${isMe ? "text-black" : "text-white"}`}>{timeString}</span>
                </>
              )}
            </div>
          </div>
        );

      case "MEET_LINK":
        return (
          <div key={msg.id} className={wrapperClass}>
            {!isMe && <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/10" />}
            <div className={`${bubbleClass} !p-0 overflow-hidden min-w-[260px]`}>
              <div className={`px-4 py-3 border-b ${isMe ? 'border-black/10' : 'border-white/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase tracking-wider">{payload.title}</span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2 text-xs">
                <div>
                  <span className="opacity-70 text-sm block uppercase font-bold">Time</span>
                  <span>{payload.time}</span>
                </div>
                <div>
                  <span className="opacity-70 text-sm block uppercase font-bold">Platform</span>
                  <span>{payload.location}</span>
                </div>
                <div className="pt-2">
                  {payload.link === "native-webrtc" ? (
                    <button onClick={() => {
                        setActiveCallRoom(msg.chatRoomId);
                        let peerEmail = "";
                        if (activeTab === "DEALS" && selectedInteraction) {
                           peerEmail = selectedInteraction.investor.email || "";
                        } else if (activeTab === "CONNECTIONS" && selectedConnection) {
                           peerEmail = selectedConnection.senderEmail === userEmail ? selectedConnection.receiverEmail : selectedConnection.senderEmail;
                        }
                        setActiveCallPeerEmail(peerEmail);
                    }} className={`inline-block w-full text-center py-2 rounded-lg font-bold transition-colors ${isMe ? "bg-black text-[#ccf063] hover:bg-black/80" : "bg-[#ccf063] text-black hover:bg-[#c2e45d]"}`}>
                      Join Native Video Call
                    </button>
                  ) : (
                    <a href={payload.link} target="_blank" className={`inline-block w-full text-center py-2 rounded-lg font-bold transition-colors ${isMe ? "bg-black text-[#ccf063] hover:bg-black/80" : "bg-[#ccf063] text-black hover:bg-[#c2e45d]"}`}>
                      Join Meeting
                    </a>
                  )}
                </div>
              </div>
              <div className={`px-4 pb-2 text-sm text-right opacity-60 ${isMe ? "text-black" : "text-white"}`}>{timeString}</div>
            </div>
          </div>
        );

      case "CONTRACT":
        const isSigned = payload.status === "SIGNED";
        return (
          <div key={msg.id} className={wrapperClass}>
            {!isMe && <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/10" />}
            <div className={`${bubbleClass} !p-0 overflow-hidden min-w-[280px]`}>
              <div className={`px-4 py-3 border-b ${isMe ? 'border-black/10' : 'border-white/5'} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase tracking-wider">{payload.title}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${isSigned ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isMe ? 'bg-black/5' : 'bg-white/5'}`}>
                    <span className="opacity-70 text-sm block uppercase font-bold mb-0.5">Pre-Money Val</span>
                    <span className="font-bold">{payload.valuation}</span>
                  </div>
                  <div className={`p-2 rounded-lg ${isMe ? 'bg-black/5' : 'bg-white/5'}`}>
                    <span className="opacity-70 text-sm block uppercase font-bold mb-0.5">Investment Ask</span>
                    <span className="font-bold">{payload.ask}</span>
                  </div>
                </div>
                <button 
                  onClick={() => !isSigned && handleExecuteContract(msg.id, payload)}
                  disabled={isSigned}
                  className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                    isSigned
                      ? "bg-green-600/20 text-green-400 cursor-default"
                      : isMe ? "bg-black text-[#ccf063] hover:bg-black/80" : "bg-[#ccf063] text-black hover:bg-[#c2e45d]"
                  }`}
                >
                  {isSigned ? (
                    <>
                      <Check className="w-4 h-4" /> Term Sheet Executed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Execute Term Sheet
                    </>
                  )}
                </button>
              </div>
              <div className={`px-4 pb-2 text-sm text-right opacity-60 ${isMe ? "text-black" : "text-white"}`}>{timeString}</div>
            </div>
          </div>
        );

      case "CONTACT":
        return (
          <div key={msg.id} className={wrapperClass}>
            {!isMe && <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/10" />}
            <div className={`${bubbleClass} !p-4 min-w-[220px]`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMe ? 'bg-black/10' : 'bg-[#ccf063]/10 text-[#ccf063]'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold leading-tight">{payload.name}</p>
                  <p className="text-sm opacity-70 mt-0.5">{payload.role}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px] mb-2 font-mono">
                <p>{payload.email}</p>
                <p>{payload.phone}</p>
              </div>
              <span className={`text-sm block text-right mt-2 opacity-60 ${isMe ? "text-black" : "text-white"}`}>{timeString}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center font-sans relative">
        <div className="text-xs text-[#c5c9b2] animate-pulse">
          Fetching Deal Rooms...
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-[1400px] mx-auto font-sans h-[calc(100vh-80px)] flex flex-col pb-4">

      <div className="flex h-full w-full relative z-10 overflow-hidden rounded-2xl border border-black/10 dark:border-white/5 bg-[#f0f0f0] dark:bg-[#111111]">

        {/* LEFT COLUMN: Request List */}
        <div className={`w-full md:w-[380px] bg-white/80 dark:bg-black/40 backdrop-blur-xl border-r border-black/10 dark:border-white/5 flex flex-col shrink-0 relative overflow-hidden transition-all ${(selectedInteraction || selectedConnection) ? "hidden md:flex" : "flex"
          }`}>

          <div className="p-4 sm:p-6 pb-4 border-b border-white/5 bg-gradient-to-b from-black to-transparent">
            <h1 className="text-2xl sm:text-3xl font-serif text-white mb-2">Inbox</h1>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              <button
                onClick={() => { setActiveTab("DEALS"); setSelectedConnection(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === "DEALS" ? "bg-[#b0d449] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                Deal Requests
              </button>
              <button
                onClick={() => { setActiveTab("CONNECTIONS"); setSelectedInteraction(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === "CONNECTIONS" ? "bg-[#b0d449] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                Connections
              </button>
              <button
                onClick={() => { (setActiveTab as any)("INVITES"); setSelectedInteraction(null); setSelectedConnection(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors relative ${(activeTab as string) === "INVITES" ? "bg-[#b0d449] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                Invites
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">

            {(activeTab as string) === "INVITES" && (
              <InvitesPanel userEmail={userEmail} />
            )}

            {activeTab === "DEALS" && (
              <>
                {interactions.length === 0 && !loading && (
                  <div className="p-6 text-center text-[#c5c9b2]/60 text-sm">
                    No deal interactions found.
                  </div>
                )}
                {interactions.map((interaction, i) => {
                  const isMatch = interaction.state === "MUTUAL_MATCH";
                  const isSelected = selectedInteraction?.id === interaction.id;

                  return (
                    <div
                      key={interaction.id}
                      onClick={() => setSelectedInteraction(interaction)}
                      className={`request-item p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden group ${isSelected
                        ? "bg-white/10 border-white/20 shadow-lg shadow-black/20"
                        : "bg-black/20 border-white/5 hover:bg-white/5"
                        }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b0d449]"></div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0 relative bg-white/10 flex items-center justify-center">
                            {interaction.investor.avatarUrl ? (
                              <img src={interaction.investor.avatarUrl} alt={interaction.investor.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white/50" />
                            )}
                            {isMatch && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#b0d449] rounded-full border-2 border-[#1f1f1f]"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{interaction.investor.name}</h4>
                            <p className="text-xs text-[#c5c9b2]/60 truncate max-w-[140px]">{interaction.investor.firm}</p>
                          </div>
                        </div>
                      </div>

                      {!isMatch ? (
                        <div className="flex gap-2 mt-4 relative z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(interaction.id, "accept"); }}
                            className="flex-1 bg-[#b0d449] hover:bg-[#a1c43f] text-black font-bold py-2 rounded-xl text-xs transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(interaction.id, "reject"); }}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                          >
                            Pass
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-[#c5c9b2] flex items-center justify-between">
                          <span className="opacity-70 truncate max-w-[150px]">Click to view chat room...</span>
                          <span className="text-white/30 text-[10px]">
                            {new Date(interaction.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === "CONNECTIONS" && (
              <>
                {connections.length === 0 && (
                  <div className="p-6 text-center text-[#c5c9b2]/60 text-sm">
                    No connection requests found.
                  </div>
                )}
                {connections.map((conn, i) => {
                  const isIncoming = conn.receiverEmail === userEmail;
                  const isSelected = selectedConnection?.id === conn.id;
                  const displayName = isIncoming ? conn.senderEmail : conn.receiverEmail;

                  return (
                    <div
                      key={conn.id}
                      onClick={() => { if (conn.status === "ACCEPTED") setSelectedConnection(conn); }}
                      className={`request-item p-4 rounded-2xl ${conn.status === "ACCEPTED" ? "cursor-pointer" : ""} transition-all border relative overflow-hidden group ${isSelected
                        ? "bg-white/10 border-white/20 shadow-lg shadow-black/20"
                        : "bg-black/20 border-white/5 hover:bg-white/5"
                        }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b0d449]"></div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0 relative bg-white/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-white/50" />
                            {conn.status === "ACCEPTED" && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#b0d449] rounded-full border-2 border-[#1f1f1f]"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm truncate max-w-[160px]">{displayName.split('@')[0]}</h4>
                            <p className="text-xs text-[#c5c9b2]/60 truncate max-w-[120px]">
                              {isIncoming ? "Incoming Request" : "Outgoing Request"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {conn.status === "PENDING" && isIncoming ? (
                        <div className="flex gap-2 mt-4 relative z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConnectionAction(conn.id, "ACCEPTED"); }}
                            className="flex-1 bg-[#b0d449] hover:bg-[#a1c43f] text-black font-bold py-2 rounded-xl text-xs transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConnectionAction(conn.id, "REJECTED"); }}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                          >
                            Ignore
                          </button>
                        </div>
                      ) : conn.status === "PENDING" && !isIncoming ? (
                        <div className="text-xs text-[#c5c9b2]/50 italic">Waiting for response...</div>
                      ) : conn.status === "ACCEPTED" ? (
                        <div className="text-xs text-[#c5c9b2] flex items-center justify-between">
                          <span className="opacity-70 truncate max-w-[150px]">Connected. Click to chat.</span>
                        </div>
                      ) : (
                        <div className="text-xs text-red-400/50 italic">Rejected</div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Chat Room / Active Deal Room */}
        <div className={`flex-1 flex flex-col bg-[#f0f0f0] dark:bg-[#111111] relative border-l border-black/10 dark:border-white/5 ${(!selectedInteraction && !selectedConnection) ? "hidden md:flex" : "flex"
          }`}>
          {!activeChatRoomId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <MessageSquare className="w-12 h-12 mb-4 text-white/20" />
              <p className="text-base font-serif text-white/60 max-w-xs">Select a deal match or connection from the inbox to open the encrypted chat room</p>
            </div>
          ) : (
            <>
              <div className="bg-black/40 border-b border-white/5 p-3 sm:p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => {
                      setSelectedInteraction(null);
                      setSelectedConnection(null);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white md:hidden transition-colors"
                    title="Back to inbox"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 relative shrink-0">
                    <img src={activeTab === "DEALS" ? selectedInteraction?.investor.avatarUrl : undefined} alt="Avatar" className="w-full h-full object-cover" />
                    {activeTab === "DEALS" && selectedInteraction?.state === "MUTUAL_MATCH" && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#ccf063] rounded-full border-2 border-[#1f1f1f]"></div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                        {activeTab === "DEALS" ? selectedInteraction?.investor.name : selectedConnection?.senderEmail === userEmail ? selectedConnection?.receiverEmail.split('@')[0] : selectedConnection?.senderEmail.split('@')[0]}
                      </h4>
                      {activeTab === "DEALS" && selectedInteraction?.state === "MUTUAL_MATCH" && (
                        <span className="bg-[#ccf063]/20 text-[#ccf063] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">Matched</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#c5c9b2] truncate">{selectedInteraction?.investor?.firm} &middot; {selectedInteraction?.investor?.checkSize}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                    <Building2 className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#f4f4f4] dark:bg-[#161616] flex flex-col">

                {activeTab === "DEALS" && selectedInteraction?.state === "INTRO_REQUESTED" ? (
                  // PENDING REQUEST VIEW
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                    <div className="w-16 h-16 bg-white/5 text-[#c5c9b2] rounded-full flex items-center justify-center border border-white/10">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm">
                      <h3 className="text-xl font-serif text-white mb-2">Intro Request Pending</h3>
                      <p className="text-xs text-[#c5c9b2] leading-relaxed mb-6">
                        Accept the intro request from {selectedInteraction.investor.name} to unlock this Deal Room and begin secure communications.
                      </p>
                      <button
                        onClick={() => handleAction(selectedInteraction.id, "accept")}
                        className="w-full py-3 bg-[#ccf063] hover:bg-[#c2e45d] text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Accept Intro to Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  // ACTIVE DEAL ROOM (CHAT FEED)
                  <>
                    <div className="text-center pb-8 pt-4">
                      <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/40 uppercase tracking-widest font-bold">
                        End-to-End Encrypted Room
                      </div>
                      <p className="text-[11px] text-[#c5c9b2] mt-4 max-w-md mx-auto">
                        This is the beginning of your private deal room with {activeTab === "DEALS" ? selectedInteraction?.investor?.name : (selectedConnection?.senderEmail === userEmail ? selectedConnection?.receiverEmail.split('@')[0] : selectedConnection?.senderEmail.split('@')[0])}. All messages, documents, and terms are logged.
                      </p>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {decryptedMessages.map(renderMessageBubble)}
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                )}
              </div>

              {/* Input Area (Only if Matched or Connected) */}
              {((activeTab === "DEALS" && selectedInteraction?.state === "MUTUAL_MATCH") || (activeTab === "CONNECTIONS" && selectedConnection?.status === "ACCEPTED")) && (
                <div className="p-4 bg-black/40 border-t border-white/5 shrink-0 relative">

                  {/* Reply Bar Snippet */}
                  {replyingTo && (
                    <div className="absolute bottom-full left-0 right-0 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 p-3 flex items-center justify-between z-10">
                      <div className="flex gap-3 items-center min-w-0">
                        <Reply className="w-4 h-4 text-[#ccf063]" />
                        <div className="truncate">
                          <p className="text-[10px] font-bold text-[#ccf063] uppercase tracking-wider">Replying to</p>
                          <p className="text-xs text-black/70 dark:text-white/70 truncate">{replyingTo.text}</p>
                        </div>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Action Menu Popover */}
                  {plusMenuOpen && (
                    <div className="absolute bottom-[70px] left-4 bg-[#1f1f1f] border border-white/10 rounded-2xl p-2 w-56 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2">
                      <button onClick={sendDocument} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center"><Paperclip className="w-4 h-4" /></div>
                        <span className="text-xs font-bold text-white">Upload Document</span>
                      </button>
                      <button onClick={() => { setPlusMenuOpen(false); setScheduleOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-colors">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                        <span className="text-xs font-bold text-white">Schedule Meeting</span>
                      </button>
                      <button onClick={sendContract} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-colors">
                        <div className="w-8 h-8 rounded-full bg-[#ccf063]/10 text-[#ccf063] flex items-center justify-center"><FileCheck className="w-4 h-4" /></div>
                        <span className="text-xs font-bold text-white">Send Term Sheet</span>
                      </button>
                      <button onClick={sendContact} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-colors">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center"><User className="w-4 h-4" /></div>
                        <span className="text-xs font-bold text-white">Share Contact Info</span>
                      </button>
                    </div>
                  )}
                  {plusMenuOpen && <div className="fixed inset-0 z-10" onClick={() => setPlusMenuOpen(false)} />}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${plusMenuOpen ? 'bg-[#ccf063] text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      <Plus className={`w-5 h-5 transition-transform ${plusMenuOpen ? 'rotate-45' : ''}`} />
                    </button>
                    <input
                      type="text"
                      placeholder="Message or send an attachment..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                      disabled={isSending}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ccf063] focus:bg-white/10 transition-all disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendText}
                      disabled={!chatInput.trim() || isSending}
                      className="bg-[#ccf063] hover:bg-[#c2e45d] disabled:bg-white/10 disabled:text-white/30 text-black w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal (Same as before but integrates into chat) */}
      {scheduleOpen && (selectedInteraction || selectedConnection) && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setScheduleOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm font-serif">Schedule Sync</h4>
                <p className="text-sm text-white/40">Drop a meeting card into the chat</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Date & Time</label>
                <input
                  type="text"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  placeholder="e.g. Tomorrow, 11:30 AM"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Conference Platform</label>
                <select
                  value={meetingLoc}
                  onChange={(e) => setMeetingLoc(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom Link">Zoom</option>
                  <option value="San Francisco HQ Office">HQ Office (In-Person)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 text-xs font-bold">
              <button
                onClick={sendMeetingLink}
                className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Send to Chat
              </button>
              <button
                onClick={() => setScheduleOpen(false)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

            {contactOpen && (selectedInteraction || selectedConnection) && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setContactOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm font-serif">Share Contact Info</h4>
                <p className="text-sm text-white/40">Drop your details in chat</p>
              </div>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Role / Title</label>
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="e.g. Managing Partner"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 000-0000"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setContactOpen(false)} className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={submitContact} className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold transition-colors">
                Share Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {termSheetOpen && (selectedInteraction || selectedConnection) && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setTermSheetOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm font-serif">Send Term Sheet</h4>
                <p className="text-sm text-white/40">Propose deal terms in chat</p>
              </div>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Term Sheet Title</label>
                <input
                  type="text"
                  value={tsTitle}
                  onChange={(e) => setTsTitle(e.target.value)}
                  placeholder="e.g. Seed Round Term Sheet"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Proposed Valuation</label>
                <input
                  type="text"
                  value={tsValuation}
                  onChange={(e) => setTsValuation(e.target.value)}
                  placeholder="e.g. ₹10 Cr / $5M"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Investment Amount (Ask)</label>
                <input
                  type="text"
                  value={tsAsk}
                  onChange={(e) => setTsAsk(e.target.value)}
                  placeholder="e.g. ₹2 Cr / $1M"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setTermSheetOpen(false)} className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={submitContract} className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl text-sm font-bold transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                Send Term Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCallRoom && activeCallPeerEmail && (
        <NativeVideoCall
           chatRoomId={activeCallRoom}
           userEmail={userEmail || ""}
           peerEmail={activeCallPeerEmail}
           onEndCall={() => setActiveCallRoom(null)}
        />
      )}
    </div>
  );
}





