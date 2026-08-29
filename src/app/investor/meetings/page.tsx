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
import WorkspaceSwitcher from "@/components/investor/WorkspaceSwitcher";
import {
  generateE2EEKeyPair,
  exportPublicKey,
  exportPrivateKey,
  encryptPayload,
  decryptPayload
} from "@/lib/crypto";

interface Interaction {
  id: string;
  startupId: string;
  state: "INTRO_REQUESTED" | "MUTUAL_MATCH" | "PASSED";
  updatedAt: string;
  startup: {
    name: string;
    firm?: string;
    avatarUrl?: string;
    category?: string;
    stage?: string;
    checkSize?: string;
    location?: string;
    trustScore?: string;
    founderEmail?: string | null;
  };
}

interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  encryptedPayload: string; // JSON string
  createdAt: string;
}

interface Connection {
  id: string;
  senderEmail: string;
  receiverEmail: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export default function InvestorMeetingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { userEmail, addMeeting, activeInvestorTeam } = useAuth();

  const [activeTab, setActiveTab] = useState<"DEALS" | "CONNECTIONS">("DEALS");

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat Room State
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [activeChatRoom, setActiveChatRoom] = useState<any>(null);
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

  // Decrypt all messages when they load
  useEffect(() => {
    const decryptAll = async () => {
      const decrypted = await Promise.all(
        messages.map(async (msg) => {
          const isMe = msg.senderId?.toLowerCase() === (userEmail || "").toLowerCase();
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
  }, [userEmail, activeInvestorTeam]);

  const fetchConnections = async () => {
    try {
      const res = await fetch(`/api/connections?email=${encodeURIComponent(userEmail || '')}`);
      const json = (await res.json()) as any;
      if (json.success) {
        setConnections(json.requests);
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    }
  };

  const fetchInteractions = async () => {
    if (!userEmail) return;
    try {
      const teamQuery = activeInvestorTeam?.id ? `&teamId=${encodeURIComponent(activeInvestorTeam.id)}` : "";
      const res = await fetch(`/api/interactions/investor?investorEmail=${encodeURIComponent(userEmail)}${teamQuery}`);
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
      initAndFetchChatRoom(selectedInteraction.startupId, userEmail);
    } else if (activeTab === "CONNECTIONS" && selectedConnection && selectedConnection.status === "ACCEPTED") {
      const partnerEmail = selectedConnection.senderEmail.toLowerCase() === userEmail.toLowerCase() 
        ? selectedConnection.receiverEmail.toLowerCase() 
        : selectedConnection.senderEmail.toLowerCase();
      const [p1, p2] = [userEmail.toLowerCase(), partnerEmail].sort();
      initAndFetchChatRoom(p1, p2);
    } else {
      setActiveChatRoomId(null);
      setActiveChatRoom(null);
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
  }, [activeChatRoomId, userEmail]);

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
  }, [loading, userEmail]);

  const initAndFetchChatRoom = async (p1: string, p2?: string) => {
    try {
      const partner = p2 || userEmail || "investor";
      // 1. Get or Create room
      const roomRes = await fetch("/api/deal-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founderId: p1, investorId: partner }),
      });
      const roomJson = (await roomRes.json()) as any;
      
      if (roomJson.success) {
        const roomId = roomJson.data.id;
        setActiveChatRoomId(roomId);
        setActiveChatRoom(roomJson.data);
        
        // 2. Fetch messages
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

  // Generic Send Message function
  const sendChatMessage = async (payload: any) => {
    if (!activeChatRoomId) return;
    setIsSending(true);

    try {
      // Determine recipient email
      let recipientEmail = "";
      if (activeTab === "DEALS" && selectedInteraction) {
        recipientEmail = selectedInteraction.startup.founderEmail || "founder@startup.com";
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
          senderId: userEmail,
          messagePayload: encryptedPayload,
        }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setMessages(prev => [...prev, json.data]);
        if (activeChatRoom && !activeChatRoom.initiatedBy) {
          setActiveChatRoom({ ...activeChatRoom, initiatedBy: userEmail, status: "PENDING" });
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
      setPlusMenuOpen(false);
    }
  };

  const handleDMRequestAction = async (action: "accept" | "reject") => {
    if (!activeChatRoomId) return;
    try {
      const res = await fetch("/api/deal-rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRoomId: activeChatRoomId, action })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setActiveChatRoom({ ...activeChatRoom, status: action === "accept" ? "ACCEPTED" : "REJECTED" });
      }
    } catch (e) {
      console.error("Failed to update DM request:", e);
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

  const sendContact = () => {
    sendChatMessage({
      type: "CONTACT",
      name: "Investor Contact",
      role: "Partner",
      email: userEmail || "investor@firm.com",
      phone: "+91 98765 43210"
    });
  };

  const handleExecuteContract = async (messageId: string, parsedPayload: any) => {
    const updatedPayload = {
      ...parsedPayload,
      status: "SIGNED"
    };

    let recipientEmail = "";
    if (activeTab === "DEALS" && selectedInteraction) {
      recipientEmail = selectedInteraction.startup.founderEmail || "founder@startup.com";
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

  // Message Renderer
  const renderMessageBubble = (msg: any) => {
    const isMe = (msg.senderId || "").toLowerCase().trim() === (userEmail || "").toLowerCase().trim();
    const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const payload = msg.parsedPayload || (typeof msg.encryptedPayload === "string" ? { type: "TEXT", text: msg.encryptedPayload } : { type: "TEXT", text: "..." });

    const wrapperClass = `flex items-end gap-2.5 max-w-[85%] mb-4 ${isMe ? "ml-auto flex-row-reverse" : ""}`;
    const bubbleClass = `p-3 rounded-2xl leading-relaxed relative group ${
      isMe 
        ? "bg-[#b0d449] text-black font-semibold rounded-br-sm" 
        : "bg-black/45 text-[#c5c9b2] border border-white/5 rounded-bl-sm"
    }`;

    switch (payload.type) {
      case "TEXT":
        return (
          <div key={msg.id} className={wrapperClass}>
            {!isMe && (
               <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                 {selectedInteraction?.startup.avatarUrl ? (
                   <img src={selectedInteraction?.startup.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <User className="w-4 h-4 text-white/50" />
                 )}
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
                <button className={`w-full py-1.5 rounded-lg text-sm font-bold mt-2 transition-colors ${
                  isMe ? "bg-black/10 hover:bg-black/20" : "bg-[#ccf063]/10 text-[#ccf063] hover:bg-[#ccf063]/20"
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
                     <a href={payload.link} target="_blank" className={`inline-block w-full text-center py-2 rounded-lg font-bold transition-colors ${
                        isMe ? "bg-black text-[#ccf063] hover:bg-black/80" : "bg-[#ccf063] text-black hover:bg-[#c2e45d]"
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
    <div ref={containerRef} className="max-w-[1400px] mx-auto font-sans h-[calc(100vh-80px)] flex flex-col pb-4 text-white">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-4 mb-4 shrink-0">
        <div className="animate-item">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] inline-block">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-2xl font-bold text-white font-serif inline-block italic">Meetings & Inbox</h2>
          </div>
          <p className="text-[11px] text-[#c5c9b2]">
            Schedule meetings, manage connections, and communicate with founders in secure rooms.
          </p>
        </div>

        {/* Workspace Switcher */}
        <div className="animate-item self-end sm:self-auto shrink-0">
          <WorkspaceSwitcher />
        </div>
      </div>

      {/* Main App Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT COLUMN: Request List */}
        <div className="lg:col-span-4 flex flex-col min-h-0 animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          
          <div className="p-4 border-b border-white/10 bg-black/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider font-mono">Inbox</h3>
              {activeTab === "DEALS" && (
                <span className="text-sm bg-[#ccf063]/10 text-[#ccf063] px-2 py-0.5 rounded-full font-bold">
                  {interactions.filter(i => i.state === 'INTRO_REQUESTED').length} Pending
                </span>
              )}
            </div>
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
              <button 
                onClick={() => { setActiveTab("DEALS"); setSelectedConnection(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === "DEALS" ? "bg-[#b0d449] text-black font-bold" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Deal Requests
              </button>
              <button 
                onClick={() => { setActiveTab("CONNECTIONS"); setSelectedInteraction(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === "CONNECTIONS" ? "bg-[#b0d449] text-black font-bold" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Connections
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#1a1a1a]">
            {activeTab === "DEALS" && (
              <>
                {interactions.map((interaction) => {
                  const isSelected = selectedInteraction?.id === interaction.id;
                  const isMatch = interaction.state === "MUTUAL_MATCH";
                  
                  return (
                    <div
                      key={interaction.id}
                      onClick={() => setSelectedInteraction(interaction)}
                      className={`p-4 border-b border-white/5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white/10 border-l-4 border-l-[#ccf063]"
                          : "hover:bg-white/5 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0 relative bg-white/10 flex items-center justify-center">
                            {interaction.startup.avatarUrl ? (
                              <img src={interaction.startup.avatarUrl} alt={interaction.startup.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white/50" />
                            )}
                            {isMatch && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#ccf063] rounded-full border-2 border-[#1f1f1f]"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{interaction.startup.name}</h4>
                            <p className="text-xs text-[#c5c9b2]/70">{interaction.startup.category}</p>
                          </div>
                        </div>
                      </div>

                      {!isMatch ? (
                        <div className="text-xs font-bold text-[#c5c9b2] flex items-center gap-1.5 opacity-80">
                          <Lock className="w-3.5 h-3.5" /> Pending Founder Approval
                        </div>
                      ) : (
                        <div className="text-xs text-[#c5c9b2] flex items-center justify-between">
                           <span className="opacity-70 truncate max-w-[150px]">Click to view chat room...</span>
                           <span className="text-white/40 text-[10px]">
                             {new Date(interaction.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {interactions.length === 0 && (
                  <div className="p-8 text-center text-[#c5c9b2] text-xs">
                    Inbox zero. No pending requests.
                  </div>
                )}
              </>
            )}

            {activeTab === "CONNECTIONS" && (
              <>
                {connections.length === 0 && (
                  <div className="p-8 text-center text-[#c5c9b2]/60 text-xs">
                    No connection requests found.
                  </div>
                )}
                {connections.map((conn) => {
                  const isIncoming = conn.receiverEmail === userEmail;
                  const isSelected = selectedConnection?.id === conn.id;
                  const displayName = isIncoming ? conn.senderEmail : conn.receiverEmail;
                  
                  return (
                    <div 
                      key={conn.id}
                      onClick={() => { if (conn.status === "ACCEPTED") setSelectedConnection(conn); }}
                      className={`p-4 border-b border-white/5 transition-all ${conn.status === "ACCEPTED" ? "cursor-pointer" : ""} ${
                        isSelected 
                          ? "bg-white/10 border-l-4 border-l-[#ccf063]" 
                          : "hover:bg-white/5 border-l-4 border-l-transparent"
                      }`}
                    >
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
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs text-[#c5c9b2]/60 truncate max-w-[120px]">
                                {isIncoming ? "Incoming Request" : "Outgoing Request"}
                              </p>
                              <p className="text-[10px] text-white/40 font-mono">
                                {new Date(conn.createdAt).toLocaleString()}
                              </p>
                            </div>
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

        {/* Right Side: Unified Chat Interface */}
        <div className="lg:col-span-8 bg-[#1f1f1f] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-0 animate-item relative">
          {(selectedInteraction || selectedConnection) ? (
            <>
              {/* Header */}
              <div className="bg-black/40 border-b border-white/5 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 relative bg-white/10 flex items-center justify-center">
                    {activeTab === "DEALS" && selectedInteraction?.startup.avatarUrl ? (
                      <img src={selectedInteraction.startup.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white/50" />
                    )}
                    {activeTab === "DEALS" && selectedInteraction?.state === "MUTUAL_MATCH" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#ccf063] rounded-full border-2 border-[#1f1f1f]"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="font-bold text-white text-sm">
                         {activeTab === "DEALS" ? selectedInteraction?.startup.name : selectedConnection?.senderEmail === userEmail ? selectedConnection?.receiverEmail.split('@')[0] : selectedConnection?.senderEmail.split('@')[0]}
                       </h4>
                       {activeTab === "DEALS" && selectedInteraction?.state === "MUTUAL_MATCH" && (
                          <span className="bg-[#ccf063]/20 text-[#ccf063] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Matched</span>
                       )}
                    </div>
                    {activeTab === "DEALS" && (
                      <p className="text-sm text-[#c5c9b2] mt-0.5">{selectedInteraction?.startup.category} &middot; {selectedInteraction?.startup.stage}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                        <h3 className="text-xl font-serif text-white mb-2">Awaiting Founder</h3>
                        <p className="text-xs text-[#c5c9b2] leading-relaxed mb-6">
                           You have requested an intro to {selectedInteraction.startup.name}. Please wait for the founder to accept to unlock this Chat and begin secure communications.
                        </p>
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
                           This is the beginning of your private deal room with {activeTab === "DEALS" ? selectedInteraction?.startup?.name : (selectedConnection?.senderEmail === userEmail ? selectedConnection?.receiverEmail.split('@')[0] : selectedConnection?.senderEmail.split('@')[0])}. All messages, documents, and terms are logged.
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
                    
                    {activeChatRoom?.status === "PENDING" && activeChatRoom?.initiatedBy && activeChatRoom.initiatedBy !== userEmail ? (
                      <div className="flex flex-col items-center justify-center space-y-3 py-2">
                        <p className="text-xs text-[#c5c9b2] font-semibold text-center">
                          {activeTab === "DEALS" ? selectedInteraction?.startup.name : (selectedConnection?.senderEmail === userEmail ? selectedConnection?.receiverEmail.split('@')[0] : selectedConnection?.senderEmail.split('@')[0])} wants to start a Deal Room chat with you.
                        </p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleDMRequestAction("accept")}
                            className="bg-[#ccf063] hover:bg-[#c2e45d] text-black font-bold py-2 px-6 rounded-xl text-xs transition-colors"
                          >
                            Accept DM Request
                          </button>
                          <button 
                            onClick={() => handleDMRequestAction("reject")}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ) : activeChatRoom?.status === "PENDING" && activeChatRoom?.initiatedBy === userEmail ? (
                      <div className="py-3 text-center">
                         <p className="text-xs text-[#c5c9b2]/70 italic">Waiting for the other party to accept your DM request...</p>
                      </div>
                    ) : (
                      <>
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
                            placeholder={activeChatRoom?.status === "REJECTED" ? "DM Request Declined" : "Message or send an attachment..."}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                            disabled={isSending || activeChatRoom?.status === "REJECTED"}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ccf063] focus:bg-white/10 transition-all disabled:opacity-50"
                          />
                          <button
                            onClick={handleSendText}
                            disabled={!chatInput.trim() || isSending || activeChatRoom?.status === "REJECTED"}
                            className="bg-[#ccf063] hover:bg-[#c2e45d] disabled:bg-white/10 disabled:text-white/30 text-black w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                 </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#c5c9b2] text-xs">
              <MessageSquare className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-lg font-serif text-white mb-1">Your Deal Rooms & Conversations</p>
              <p>Select a deal request or connection from your inbox to open the unified workspace.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
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
