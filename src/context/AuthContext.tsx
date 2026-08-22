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
  const [activeInvestorTeam, setActiveInvestorTeamState] = useState<InvestorTeam | null>(null);
  const [userInvestorTeams, setUserInvestorTeams] = useState<InvestorTeam[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>(defaultMeetings);

  // Restore active startup and active team from localStorage on mount
  useEffect(() => {
    try {
      const savedStartup = localStorage.getItem("ventureiq_active_startup");
      if (savedStartup) {
        const parsed = JSON.parse(savedStartup);
        if (parsed && parsed.name) {
          setActiveStartupState(parsed);
        }
      }

      const savedTeam = localStorage.getItem("ventureiq_active_investor_team");
      if (savedTeam) {
        const parsedTeam = JSON.parse(savedTeam);
        if (parsedTeam && parsedTeam.id) {
          setActiveInvestorTeamState(parsedTeam);
        }
      }
    } catch (e) {
      console.error("Failed to load active workspace from storage:", e);
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

  const setActiveInvestorTeam = (team: InvestorTeam | null) => {
    setActiveInvestorTeamState(team);
    try {
      if (team && team.id) {
        localStorage.setItem("ventureiq_active_investor_team", JSON.stringify(team));
      } else {
        localStorage.removeItem("ventureiq_active_investor_team");
      }
    } catch (e) {
      console.error("Failed to save active investor team to storage:", e);
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
          const stillExists = mappedTeams.find(t => t.id === activeInvestorTeam.id);
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
      localStorage.removeItem("ventureiq_active_investor_team");
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
