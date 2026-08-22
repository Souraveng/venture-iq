"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
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
const FOUNDER_MOCK_ID = "demo-founder-id"; // Represents the current logged in founder

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

  // Cryptographic Keys State
  const [publicKeyBase64, setPublicKeyBase64] = useState<string | null>(null);
  const [privateKeyBase64, setPrivateKeyBase64] = useState<string | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);

  // Key Pair Initialization
  useEffect(() => {
    if (!userEmail) return;
    const initKeys = async () => {
      try {
        let pubKey = localStorage.getItem(`e2e_pub_${userEmail}`);
        let privKey = localStorage.getItem(`e2e_priv_${userEmail}`);
        if (!pubKey || !privKey) {
          const keyPair = await generateE2EEKeyPair();
          pubKey = await exportPublicKey(keyPair.publicKey);
          privKey = await exportPrivateKey(keyPair.privateKey);
          localStorage.setItem(`e2e_pub_${userEmail}`, pubKey);
          localStorage.setItem(`e2e_priv_${userEmail}`, privKey);
          
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
    const recipientPubKey = await fetchRecipientPublicKey(recipientEmail);
    try {
      const senderEnc = await encryptPayload(payloadStr, publicKeyBase64);
      const receiverEnc = recipientPubKey 
        ? await encryptPayload(payloadStr, recipientPubKey)
        : senderEnc;
      return JSON.stringify({
        senderEncrypted: senderEnc,
        receiverEncrypted: receiverEnc
      });
    } catch (err) {
      console.error("Encryption failed, falling back to plaintext:", err);
      return payloadStr;
    }
  };

  // Helper to decrypt message payload
  const decryptChatMessage = async (encryptedPayloadStr: string, isMe: boolean) => {
    if (!privateKeyBase64) {
      try { return JSON.parse(encryptedPayloadStr); } 
      catch { return { type: "TEXT", text: encryptedPayloadStr }; }
    }
    try {
      const data = JSON.parse(encryptedPayloadStr);
      if (data.senderEncrypted && data.receiverEncrypted) {
        const encryptedData = isMe ? data.senderEncrypted : data.receiverEncrypted;
        const decryptedStr = await decryptPayload(encryptedData, privateKeyBase64);
        return JSON.parse(decryptedStr);
      }
      return data;
    } catch (err) {
      return { type: "TEXT", text: encryptedPayloadStr };
    }
  };

  // Decrypt all messages when they load
  useEffect(() => {
    const decryptAll = async () => {
      const decrypted = await Promise.all(
        messages.map(async (msg) => {
          const isMe = msg.senderId === currentSenderId || msg.senderId === userEmail || msg.senderId === FOUNDER_MOCK_ID;
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
  }, [messages, privateKeyBase64, userEmail]);

  // Modals
  const [scheduleOpen, setScheduleOpen] = useState(false);
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

  const currentSenderId = userEmail || FOUNDER_MOCK_ID;

  // Load chat room when a Mutual Match or Accepted Connection is selected
  useEffect(() => {
    if (activeTab === "DEALS" && selectedInteraction && selectedInteraction.state === "MUTUAL_MATCH") {
      initAndFetchChatRoom(selectedInteraction.startupId || selectedInteraction.id, selectedInteraction.investorId || selectedInteraction.investor.name);
    } else if (activeTab === "CONNECTIONS" && selectedConnection && selectedConnection.status === "ACCEPTED") {
      const partnerEmail = selectedConnection.senderEmail === userEmail ? selectedConnection.receiverEmail : selectedConnection.senderEmail;
      initAndFetchChatRoom(userEmail || "founder", partnerEmail);
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
  const sendChatMessage = async (payload: any) => {
    if (!activeChatRoomId) return;
    setIsSending(true);

    try {
      // Determine recipient email
      let recipientEmail = "";
      if (activeTab === "DEALS" && selectedInteraction) {
        recipientEmail = selectedInteraction.investor.email || "investor@firm.com";
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
        }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setMessages(prev => [...prev, json.data]);
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
    let meetingLink = "https://meet.google.com/xyz-demo-link";
    if (meetingLoc === "Zoom") {
      meetingLink = "https://zoom.us/j/9876543210?pwd=demo";
    } else if (meetingLoc === "Microsoft Teams") {
      meetingLink = "https://teams.microsoft.com/l/meetup-join/demo";
    } else if (meetingLoc === "In-Person" || meetingLoc === "Phone Call") {
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
        uploadUrl = `/files/mock-uploaded-${Date.now()}-${file.name}`;
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
    sendChatMessage({
      type: "CONTRACT",
      title: "Seed Round Term Sheet",
      valuation: "₹10 Cr",
      ask: "₹2 Cr",
      status: "PENDING_SIGNATURE"
    });
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
      recipientEmail = selectedInteraction.investor.email || "investor@firm.com";
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
    sendChatMessage({
      type: "CONTACT",
      name: (activeStartup as any).founder || "Founder Name",
      role: "CEO",
      email: "founder@venture.com",
      phone: "+91 98765 43210"
    });
  };

  // Message Renderer
  const renderMessageBubble = (msg: any) => {
    const isMe = msg.senderId === currentSenderId || msg.senderId === userEmail || msg.senderId === FOUNDER_MOCK_ID;
    const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload = msg.parsedPayload || { type: "TEXT", text: "Decrypting..." };

    const wrapperClass = `flex items-end gap-2.5 max-w-[85%] mb-4 ${isMe ? "ml-auto flex-row-reverse" : ""}`;
    const bubbleClass = `p-3 rounded-2xl leading-relaxed relative group ${isMe
      ? "bg-[#b0d449] text-black font-semibold rounded-br-sm"
      : "bg-black/45 text-[#c5c9b2] border border-white/5 rounded-bl-sm"
      }`;

    switch (payload.type) {
      case "TEXT":
        return (
          <div key={msg.id} className={wrapperClass}>
            {!isMe && (
              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                <img src={selectedInteraction?.investor.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={bubbleClass}>
              <p>{payload.text}</p>
              <span className={`text-sm block text-right mt-1 opacity-60 ${isMe ? "text-black" : "text-white"}`}>{timeString}</span>
            </div>
          </div>
        );

      case "FILE":
        return (
          <div key={msg.id} className={wrapperClass}>
            {!isMe && <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/10" />}
            <div className={`${bubbleClass} !p-4 min-w-[220px]`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isMe ? 'bg-black/10' : 'bg-[#ccf063]/10 text-[#ccf063]'}`}>
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold leading-tight">{payload.name}</p>
                  <p className="text-sm opacity-70 mt-0.5">{payload.size} &middot; PDF Document</p>
                </div>
              </div>
              <button className={`w-full py-1.5 rounded-lg text-sm font-bold mt-2 transition-colors ${isMe ? "bg-black/10 hover:bg-black/20" : "bg-[#ccf063]/10 text-[#ccf063] hover:bg-[#ccf063]/20"
                }`}>
                Download File
              </button>
              <span className={`text-sm block text-right mt-2 opacity-60 ${isMe ? "text-black" : "text-white"}`}>{timeString}</span>
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
                  <a href={payload.link} target="_blank" className={`inline-block w-full text-center py-2 rounded-lg font-bold transition-colors ${isMe ? "bg-black text-[#ccf063] hover:bg-black/80" : "bg-[#ccf063] text-black hover:bg-[#c2e45d]"
                    }`}>
                    Join Meeting
                  </a>
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

      <div className="flex h-full w-full relative z-10 overflow-hidden rounded-2xl border border-white/5 bg-[#111111]">

        {/* LEFT COLUMN: Request List */}
        <div className={`w-full md:w-[380px] bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 relative overflow-hidden transition-all ${(selectedInteraction || selectedConnection) ? "hidden md:flex" : "flex"
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
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">

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
        <div className={`flex-1 flex flex-col bg-[#111111] relative border-l border-white/5 ${(!selectedInteraction && !selectedConnection) ? "hidden md:flex" : "flex"
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
              <div className="flex-1 overflow-y-auto p-6 bg-[#161616] flex flex-col">

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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
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

    </div>
  );
}
