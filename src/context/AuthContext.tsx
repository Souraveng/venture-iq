"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";

type UserRole = "guest" | "founder" | "investor";

interface Startup {
  id?: string;
  name: string;
  verified: boolean;
  role?: string; // added to track role in the UI if needed
}

interface Meeting {
  name: string;
  firm: string;
  time: string;
  loc: string;
  type: string;
  agenda: string;
  link?: string;
}

interface AuthContextType {
  role: UserRole;
  userEmail: string | null;
  userName: string | null;
  userImage: string | null;
  showVerifyModal: boolean;
  setShowVerifyModal: (show: boolean) => void;
  activeStartup: Startup;
  setActiveStartup: (startup: Startup) => void;
  userVentures: Startup[];
  fetchUserVentures: () => Promise<void>;
  meetings: Meeting[];
  addMeeting: (meeting: Meeting) => void;
  loginAsFounder: (email: string, name?: string) => void;
  loginAsInvestor: (email: string, name?: string) => void;
  logout: () => void;
}

const defaultStartup: Startup = { name: "", verified: false };

const defaultMeetings: Meeting[] = [];

const AuthContext = createContext<AuthContextType>({
  role: "guest",
  userEmail: null,
  userName: null,
  userImage: null,
  showVerifyModal: false,
  setShowVerifyModal: () => {},
  activeStartup: defaultStartup,
  setActiveStartup: () => {},
  userVentures: [],
  fetchUserVentures: async () => {},
  meetings: defaultMeetings,
  addMeeting: () => {},
  loginAsFounder: () => {},
  loginAsInvestor: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <AuthInnerProvider>{children}</AuthInnerProvider>
    </SessionProvider>
  );
};

const AuthInnerProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<UserRole>("guest");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [activeStartup, setActiveStartupState] = useState<Startup>(defaultStartup);
  const [userVentures, setUserVentures] = useState<Startup[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>(defaultMeetings);

  // Restore active startup from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ventureiq_active_startup");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          setActiveStartupState(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load active startup from storage:", e);
    }
  }, []);

  const setActiveStartup = (startup: Startup) => {
    setActiveStartupState(startup);
    try {
      if (startup && startup.name) {
        localStorage.setItem("ventureiq_active_startup", JSON.stringify(startup));
      } else {
        localStorage.removeItem("ventureiq_active_startup");
      }
    } catch (e) {
      console.error("Failed to save active startup to storage:", e);
    }
  };

  const fetchUserVentures = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch("/api/user/ventures", {
        headers: { "x-user-email": userEmail },
      });
      const data = (await res.json()) as any;
      if (data.success && data.ventures) {
        setUserVentures(data.ventures);
        
        // If there's no active startup or the active one isn't in the list, set default
        const activeExists = data.ventures.find((v: any) => v.id === activeStartup.id);
        if (!activeExists && data.ventures.length > 0) {
          setActiveStartup(data.ventures[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user ventures:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUserEmail(session.user.email || null);
      setUserName(session.user.name || null);
      setUserImage(session.user.image || null);
      setRole((session.user as any).role || "founder");
    } else if (status === "unauthenticated") {
      setRole("guest");
      setUserEmail(null);
      setUserName(null);
      setUserImage(null);
      setUserVentures([]);
    }
  }, [session, status]);

  // Fetch ventures when email is set and user is founder
  useEffect(() => {
    if (userEmail && role === "founder") {
      fetchUserVentures();
    }
  }, [userEmail, role]);

  const loginAsFounder = (email: string, name?: string) => {
    setRole("founder");
    setUserEmail(email);
    setUserName(name || "");
  };

  const loginAsInvestor = (email: string, name?: string) => {
    setRole("investor");
    setUserEmail(email);
    setUserName(name || "");
  };

  const addMeeting = (meeting: Meeting) => {
    setMeetings((prev) => [meeting, ...prev]);
  };

  const logout = () => {
    try {
      localStorage.removeItem("ventureiq_active_startup");
      // Force clear any stranded custom NextAuth cookies from previous misconfigurations
      document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "ventureiq_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch (e) {}
    signOut({ callbackUrl: "/" });
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        userEmail,
        userName,
        userImage,
        showVerifyModal,
        setShowVerifyModal,
        activeStartup,
        setActiveStartup,
        userVentures,
        fetchUserVentures,
        meetings,
        addMeeting,
        loginAsFounder,
        loginAsInvestor,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
