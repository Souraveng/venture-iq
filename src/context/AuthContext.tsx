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

interface Team {
  id: string;
  name: string;
  description?: string | null;
  teamType: string;
  memberRole?: string;
  modulePermissions?: any;
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

interface InvestorTeam {
  id: string;
  name: string;
  role: string;
  teamType?: string;
  description?: string;
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
  userTeams: Team[];
  activeTeam: Team | null;
  setActiveTeam: (team: Team | null) => void;
  fetchUserTeams: () => Promise<void>;
  activeInvestorTeam: InvestorTeam | null;
  setActiveInvestorTeam: (team: InvestorTeam | null) => void;
  userInvestorTeams: InvestorTeam[];
  fetchUserInvestorTeams: () => Promise<void>;
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
  userTeams: [],
  activeTeam: null,
  setActiveTeam: () => {},
  fetchUserTeams: async () => {},
  activeInvestorTeam: null,
  setActiveInvestorTeam: () => {},
  userInvestorTeams: [],
  fetchUserInvestorTeams: async () => {},
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
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [activeTeamState, setActiveTeamState] = useState<Team | null>(null);
  const [activeInvestorTeam, setActiveInvestorTeamState] = useState<InvestorTeam | null>(null);
  const [userInvestorTeams, setUserInvestorTeams] = useState<InvestorTeam[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>(defaultMeetings);

  // Restore active startup and active team from sessionStorage on mount/session update
  useEffect(() => {
    if (typeof window === "undefined" || !userEmail) return;
    try {
      const emailKey = userEmail.toLowerCase().trim();
      const savedStartup = sessionStorage.getItem(`ventureiq_${emailKey}_active_startup`);
      if (savedStartup) {
        const parsed = JSON.parse(savedStartup);
        if (parsed && parsed.name) {
          setActiveStartupState(parsed);
        }
      }

      const savedTeam = sessionStorage.getItem(`ventureiq_${emailKey}_active_investor_team`);
      if (savedTeam) {
        const parsedTeam = JSON.parse(savedTeam);
        if (parsedTeam && parsedTeam.id) {
          setActiveInvestorTeamState(parsedTeam);
        }
      }
    } catch (e) {
      console.error("Failed to load active workspace from sessionStorage:", e);
    }
  }, [userEmail]);

  const setActiveStartup = (startup: Startup) => {
    setActiveStartupState(startup);
    if (typeof window === "undefined" || !userEmail) return;
    try {
      const emailKey = userEmail.toLowerCase().trim();
      if (startup && startup.name) {
        sessionStorage.setItem(`ventureiq_${emailKey}_active_startup`, JSON.stringify(startup));
      } else {
        sessionStorage.removeItem(`ventureiq_${emailKey}_active_startup`);
      }
    } catch (e) {
      console.error("Failed to save active startup to sessionStorage:", e);
    }
  };

  const setActiveInvestorTeam = (team: InvestorTeam | null) => {
    setActiveInvestorTeamState(team);
    if (typeof window === "undefined" || !userEmail) return;
    try {
      const emailKey = userEmail.toLowerCase().trim();
      if (team && team.id) {
        sessionStorage.setItem(`ventureiq_${emailKey}_active_investor_team`, JSON.stringify(team));
      } else {
        sessionStorage.removeItem(`ventureiq_${emailKey}_active_investor_team`);
      }
    } catch (e) {
      console.error("Failed to save active investor team to sessionStorage:", e);
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

  // Restore active team from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ventureiq_active_team");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          setActiveTeamState(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load active team from storage:", e);
    }
  }, []);

  const setActiveTeam = (team: Team | null) => {
    setActiveTeamState(team);
    try {
      if (team && team.id) {
        localStorage.setItem("ventureiq_active_team", JSON.stringify(team));
      } else {
        localStorage.removeItem("ventureiq_active_team");
      }
      
      // Save history to backend asynchronously if userEmail is set
      if (userEmail) {
        fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-email": userEmail },
          body: JSON.stringify({ activeTeamId: team?.id || null }),
        }).catch(console.error);
      }
    } catch (e) {
      console.error("Failed to save active team to storage:", e);
    }
  };

  const fetchUserTeams = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch("/api/user/teams", {
        headers: { "x-user-email": userEmail },
      });
      const data = (await res.json()) as any;
      if (data.success && data.teams) {
        setUserTeams(data.teams);
        
        if (activeTeamState) {
          const activeExists = data.teams.find((t: any) => t.id === activeTeamState.id);
          if (!activeExists) {
            setActiveTeam(null);
          }
        } else if (!localStorage.getItem("ventureiq_active_team") && data.lastActiveTeamId) {
          // Fall back to database memory if local storage is clean and we have a history
          const memoryTeam = data.teams.find((t: any) => t.id === data.lastActiveTeamId);
          if (memoryTeam) {
            setActiveTeam(memoryTeam);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch user teams:", err);
    }
  };

  const fetchUserInvestorTeams = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch("/api/teams", {
        headers: { "x-user-email": userEmail }
      });
      const data = (await res.json()) as any;
      if (data.success && data.teams) {
        const mappedTeams: InvestorTeam[] = data.teams.map((t: any) => {
          const myMember = t.members?.find((m: any) => m.userEmail?.toLowerCase() === userEmail?.toLowerCase());
          return {
            id: t.id,
            name: t.name,
            role: myMember?.role || "VIEWER",
            teamType: t.teamType,
            description: t.description
          };
        });
        setUserInvestorTeams(mappedTeams);

        // Validate active team is still a valid active membership
        if (activeInvestorTeam) {
          const stillExists = mappedTeams.find((t: any) => t.id === activeInvestorTeam.id);
          if (!stillExists) {
            setActiveInvestorTeam(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch investor teams:", err);
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
      setUserTeams([]);
      setActiveTeamState(null);
      setUserInvestorTeams([]);
      setActiveInvestorTeam(null);
    }
  }, [session, status]);

  // Fetch ventures or teams when email is set
  useEffect(() => {
    if (userEmail) {
      if (role === "founder") {
        fetchUserVentures();
      } else if (role === "investor") {
        fetchUserInvestorTeams();
      }
    }
  }, [userEmail, role]);

  // Fetch teams when email is set
  useEffect(() => {
    if (userEmail) {
      fetchUserTeams();
    }
  }, [userEmail]);

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
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
      // Force clear session cookies
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
        userTeams,
        activeTeam: activeTeamState,
        setActiveTeam,
        fetchUserTeams,
        activeInvestorTeam,
        setActiveInvestorTeam,
        userInvestorTeams,
        fetchUserInvestorTeams,
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
