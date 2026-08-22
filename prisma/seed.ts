import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean up existing tables
  await prisma.startup.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();

  console.log("Existing records cleared.");

  // 1.5 Seed Users for Auth
  const hashedPassword = bcrypt.hashSync("password123", 10);
  const users = await prisma.user.createMany({
    data: [
      {
        email: "himanshu25b@gmail.com",
        name: "Himanshu",
        password: hashedPassword,
        role: "investor",
        roles: ["investor"],
        onboarded: true,
      },
      {
        email: "sarah@apexhorizon.com",
        name: "Sarah Chen",
        password: hashedPassword,
        role: "investor",
        roles: ["investor"],
        onboarded: true,
      },
      {
        email: "david@nexuscap.com",
        name: "David Vance",
        password: hashedPassword,
        role: "investor",
        roles: ["investor"],
        onboarded: true,
      },
      {
        email: "founder@startup.com",
        name: "Swapn Kumar",
        password: hashedPassword,
        role: "founder",
        roles: ["founder"],
        onboarded: true,
      }
    ]
  });
  console.log(`Seeded ${users.count} users for authentication (Password: password123).`);

  // 2. Seed Startups
  const startups = await prisma.startup.createMany({
    data: [
      {
        id: "st-01",
        name: "NeuralFlux AI",
        tagline: "Autonomous Agent Workflow Orchestration Engine",
        category: "DeepTech / AI",
        stage: "Series A",
        valuation: "$45M",
        targetAmount: "$8M",
        raisedAmount: "$5.2M",
        founder: "Alex Rivera",
        location: "San Francisco, CA",
        traction: "+340% YoY ARR Growth ($3.8M ARR)",
        pitchDeckUrl: "#",
        verified: true,
      },
      {
        id: "st-02",
        name: "QuantumGrid Energy",
        tagline: "Next-gen Solid State Energy Storage Grid Systems",
        category: "CleanTech",
        stage: "Seed",
        valuation: "$18M",
        targetAmount: "$3.5M",
        raisedAmount: "$2.8M",
        founder: "Dr. Elena Rostova",
        location: "Boston, MA",
        traction: "3 Utility Pilots Signed with 12MWh pipeline",
        pitchDeckUrl: "#",
        verified: true,
      },
      {
        id: "st-03",
        name: "BioHelix Synthetics",
        tagline: "Cell-free Protein Engineering for Targeted Therapeutics",
        category: "Biotech",
        stage: "Pre-Series A",
        valuation: "$28M",
        targetAmount: "$5M",
        raisedAmount: "$4.1M",
        founder: "Marcus Vance",
        location: "Cambridge, UK",
        traction: "2 Patents Granted, FDA Phase 1 clearance pending",
        pitchDeckUrl: "#",
        verified: true,
      },
      {
        id: "st-04",
        name: "VentureIQ Core",
        tagline: "AI-driven Cap Table Optimization and Deal Flow Engine",
        category: "FinTech",
        stage: "Seed",
        valuation: "$15M",
        targetAmount: "$2.5M",
        raisedAmount: "$1.9M",
        founder: "Swapn Kumar",
        location: "New York, NY",
        traction: "120+ Micro-VCs and 450 Angels onboarding",
        pitchDeckUrl: "#",
        verified: true,
      },
    ],
  });
  console.log(`Seeded ${startups.count} startups.`);

  // 3. Seed Investors
  const investors = await prisma.investor.createMany({
    data: [
      {
        id: "inv-himanshu",
        email: "himanshu25b@gmail.com",
        name: "Himanshu",
        firm: "Apex Horizon Capital",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
        investorType: "Micro-VC",
        role: "Managing Partner",
        focusSectors: ["AI/ML", "DeepTech", "FinTech", "SaaS"],
        preferredStages: ["Pre-Seed", "Seed", "Series A"],
        preferredInstruments: ["SAFE", "Priced Equity"],
        minCheckSize: "$100K",
        maxCheckSize: "$500K",
        checkSize: "$100K - $500K",
        thesis: "Backing ambitious technical founders building high-margin AI infrastructure and next-gen enterprise tools.",
        verified: true,
        accreditationStatus: "Accredited Investor (Verified)",
        activityStatus: "Actively deploying this quarter",
        portfolioCompanies: ["NeuralFlux AI", "QuantumGrid", "Stripe", "OpenAI"],
        portfolioCount: 18,
        valueAdd: ["GTM Strategy & Enterprise Sales Loop", "Engineering Recruitment Network", "Follow-on Capital Connections"],
        geoPreferences: "Global (US, Europe, India)",
        investmentStyle: "Active Lead / Board Observer",
        decisionSpeed: "1-2 weeks",
        followOnCapacity: "Yes - 50% pro-rata reserved",
        responseRate: "99%",
        trustScore: "9.9/10",
        location: "San Francisco, CA",
        linkedIn: "https://linkedin.com/in/himanshu",
        twitter: "https://x.com/himanshu",
      },
      {
        id: "inv-01",
        email: "sarah@apexhorizon.com",
        name: "Sarah Chen",
        firm: "Apex Horizon Ventures",
        role: "Managing Partner",
        focusSectors: ["DeepTech", "AI", "SaaS"],
        checkSize: "$500K - $3M",
        portfolioCount: 42,
        verified: true,
        location: "San Francisco, CA",
      },
      {
        id: "inv-02",
        email: "david@nexuscap.com",
        name: "David Vance",
        firm: "Nexus Capital Partners",
        role: "General Partner",
        focusSectors: ["FinTech", "CleanTech", "Crypto"],
        checkSize: "$1M - $5M",
        portfolioCount: 68,
        verified: true,
        location: "New York, NY",
      },
    ],
  });
  console.log(`Seeded ${investors.count} investors.`);

  // 4. Seed Negotiations
  const negotiations = await prisma.negotiation.createMany({
    data: [
      {
        id: "neg-101",
        startupName: "NeuralFlux AI",
        investorFirm: "Apex Horizon Ventures",
        roundStage: "Series A",
        proposedValuation: "$42.5M",
        checkAmount: "$4.0M",
        termSheetStatus: "Under Review",
        lastUpdated: "10 mins ago",
      },
      {
        id: "neg-102",
        startupName: "QuantumGrid Energy",
        investorFirm: "Nexus Capital Partners",
        roundStage: "Seed",
        proposedValuation: "$18.0M",
        checkAmount: "$2.5M",
        termSheetStatus: "Term Sheet Signed",
        lastUpdated: "2 hours ago",
      },
    ],
  });
  console.log(`Seeded ${negotiations.count} negotiations.`);

  // 5. Seed Meetings
  const meetings = await prisma.meeting.createMany({
    data: [
      {
        id: "meet-01",
        investorName: "Elena Rivero",
        firm: "Capital One Ventures",
        startupName: "VentureIQ Core",
        date: "5 Aug",
        time: "7:30 PM",
        mode: "Google Meet",
        link: "https://meet.google.com/abc-defg-hij",
        status: "Confirmed",
        agenda: "Series A roadmap deep-dive, initial Go-To-Market strategy review, and check-in on developer metrics.",
        pitchDeck: "NeuralNexus_SeriesA_v3.pdf",
        notes: "Elena is highly interested in our enterprise subscription loops. Prepare to talk about pilot accounts.",
      },
      {
        id: "meet-02",
        investorName: "Marcus Thorne",
        firm: "Apex Horizon Ventures",
        startupName: "VentureIQ Core",
        date: "6 Aug",
        time: "10:00 AM",
        mode: "Google Meet",
        link: "https://meet.google.com/xyz-mno-pqr",
        status: "Confirmed",
        agenda: "Fireside chat about carbon-neutral compute credits and standard ticket validation.",
        pitchDeck: "Apex_EcoCharge_Backing.pdf",
        notes: "Need to highlight the carbon credit margin offsets.",
      },
      {
        id: "meet-03",
        investorName: "Sarah Chen",
        firm: "Apex Horizon",
        startupName: "VentureIQ Core",
        date: "8 Aug",
        time: "4:00 PM",
        mode: "Google Meet",
        link: "https://meet.google.com/abc-defg-hij",
        status: "Pending",
        agenda: "Review observer seat requirements on the term sheet.",
        pitchDeck: "NeuralNexus_SeriesA_v3.pdf",
        notes: "",
      },
    ],
  });
  console.log(`Seeded ${meetings.count} meetings.`);

  // 6. Seed Founders
  await prisma.founder.deleteMany();
  const founders = await prisma.founder.createMany({
    data: [
      {
        id: "fnd-himanshu",
        email: "himanshu25b@gmail.com",
        fullName: "Himanshu",
        roleTitle: "CEO & Technical Co-Founder",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaz0vajZVDPtuLJjcSxPL8p5BWx3GiZsjMemx6e_8R9511kM3AJXp1l4vL5dp9CNwHwsgdL0vd0Fi4xbCkKcxduivKJr89MWcpGq2_nDytgxZJ2t4JbrUfVHN_f-UgvO7qGaW5AhM0cRj77HbCy6EiUr4fV_UFPt8WeXW8HwfkA8-kqiThdFmDG57SPwkUQbNTzWTem3yezpexHGnlB1ctN_RhQVb4kIUWh8jxU95PK9XugWpw0qir",
        location: "San Francisco, CA",
        linkedinUrl: "https://linkedin.com/in/himanshu",
        commitment: "Full-time",
        equityStake: "32.5",
        startupName: "NeuralNexus AI",
        startupLink: "/founder/profile-venture",
        aboutQuote: "Building autonomous agent workflow engines for high-velocity engineering teams.",
        aboutText: "10+ years in AI systems and distributed infrastructure. Serial founder focused on high-performance deeptech solutions and enterprise agent automation.",
        domainExpertise: ["AI/ML Systems", "Distributed Infrastructure", "Enterprise Automation"],
        keySkills: ["Product Strategy", "System Architecture", "Go-To-Market Execution"],
        teamSize: "3",
        verificationBadge: "Identity Verified (Tier 1)",
        introVideoUrl: "https://vimeo.com/123456789",
        background: [
          { degree: "M.S. Computer Science", org: "Stanford University" },
          { degree: "Founder of SolarLink", org: "Acquired by NextEra 2021" }
        ],
      },
      {
        id: "fnd-swapn",
        email: "founder@startup.com",
        fullName: "Swapn Kumar",
        roleTitle: "CEO & Technical Co-Founder",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
        location: "San Francisco, CA",
        linkedinUrl: "https://linkedin.com/in/swapnkumar",
        commitment: "Full-time",
        equityStake: "28.5",
        startupName: "EcoCharge",
        startupLink: "/founder/profile-venture",
        aboutQuote: "Building the next generation of modular EV charging infrastructure.",
        aboutText: "10+ years in renewable energy systems. Focused on high-performance energy storage solutions and scalable grid integration.",
        domainExpertise: ["Renewable Energy", "Grid Storage", "Embedded Systems"],
        keySkills: ["Product Strategy", "Hardware Engineering", "Team Management"],
        teamSize: "3",
        verificationBadge: "Identity Verified (Tier 1)",
        introVideoUrl: "https://vimeo.com/123456789",
        background: [
          { degree: "M.S. Electrical Engineering", org: "Stanford University" },
          { degree: "Founder of SolarLink", org: "Acquired by NextEra 2021" }
        ],
      }
    ],
  });
  console.log(`Seeded ${founders.count} founders.`);

  // 7. Seed ConnectionRequests
  await prisma.connectionRequest.deleteMany();
  const connectionRequests = await prisma.connectionRequest.createMany({
    data: [
      {
        id: "conn-req-1",
        senderEmail: "sarah@apexhorizon.com",
        receiverEmail: "himanshu25b@gmail.com",
        status: "PENDING"
      },
      {
        id: "conn-req-2",
        senderEmail: "himanshu25b@gmail.com",
        receiverEmail: "david@nexuscap.com",
        status: "ACCEPTED"
      }
    ]
  });
  console.log("Seeded ConnectionRequests.");

  // 8. Seed DealInteractions
  await prisma.dealInteraction.deleteMany();
  const dealInteractions = await prisma.dealInteraction.createMany({
    data: [
      {
        id: "deal-int-1",
        investorId: "inv-himanshu",
        startupId: "st-02",
        state: "INTRO_REQUESTED"
      },
      {
        id: "deal-int-2",
        investorId: "inv-himanshu",
        startupId: "st-03",
        state: "MUTUAL_MATCH"
      }
    ]
  });
  console.log("Seeded DealInteractions.");

  // 9. Seed ChatRooms & ChatMessages
  await prisma.chatRoom.deleteMany();
  await prisma.chatMessage.deleteMany();

  // Create chat room for connection with david
  const connChatRoom = await prisma.chatRoom.create({
    data: {
      id: "room-conn-1",
      founderId: "david@nexuscap.com", // For connection, we pass the email as founderId
      investorId: "himanshu25b@gmail.com",
      status: "ACCEPTED",
      initiatedBy: "himanshu25b@gmail.com"
    }
  });

  // Create chat room for deal interaction with BioHelix (st-03)
  const dealChatRoom = await prisma.chatRoom.create({
    data: {
      id: "room-deal-1",
      founderId: "st-03", // For deal interaction, founderId is the startupId
      investorId: "himanshu25b@gmail.com",
      status: "ACCEPTED",
      initiatedBy: "founder@startup.com"
    }
  });

  // Add sample messages to deal room
  await prisma.chatMessage.createMany({
    data: [
      {
        id: "msg-1",
        chatRoomId: dealChatRoom.id,
        senderId: "founder@startup.com",
        encryptedPayload: JSON.stringify({ type: "TEXT", text: "Hi Himanshu! Excited to connect and discuss BioHelix Synthetics. Let me know when you have time for a brief introduction call." }),
        iv: "demo-iv-no-encrypt"
      },
      {
        id: "msg-2",
        chatRoomId: dealChatRoom.id,
        senderId: "himanshu25b@gmail.com",
        encryptedPayload: JSON.stringify({ type: "TEXT", text: "Hi Marcus, thanks for reaching out. I reviewed your profile and the biotech scope is very impressive." }),
        iv: "demo-iv-no-encrypt"
      }
    ]
  });

  // 10. Seed Notifications
  await prisma.notification.deleteMany();
  await prisma.notification.createMany({
    data: [
      {
        id: "notif-conn-1",
        userEmail: "himanshu25b@gmail.com",
        type: "CONNECTION_REQUEST",
        title: "Connection Request Received",
        message: "sarah@apexhorizon.com wants to connect with you on VentureIQ.",
        timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        read: false,
        category: "connection",
        metadata: {
          connectionId: "conn-req-1",
          email: "sarah@apexhorizon.com",
          status: "PENDING"
        }
      },
      {
        id: "notif-conn-2",
        userEmail: "himanshu25b@gmail.com",
        type: "CONNECTION_REQUEST",
        title: "Connection Accepted",
        message: "david@nexuscap.com accepted your connection request.",
        timestamp: new Date(Date.now() - 3600000 * 12), // 12 hours ago
        read: true,
        category: "connection",
        metadata: {
          connectionId: "conn-req-2",
          email: "david@nexuscap.com",
          status: "ACCEPTED"
        }
      },
      {
        id: "notif-deal-1",
        userEmail: "himanshu25b@gmail.com",
        type: "INTRO_REQUEST",
        title: "Intro Request Pending",
        message: "You requested an introduction to QuantumGrid Energy. Awaiting founder approval.",
        timestamp: new Date(Date.now() - 3600000 * 6), // 6 hours ago
        read: true,
        category: "request",
        metadata: {
          startupId: "st-02",
          startupName: "QuantumGrid Energy",
          state: "INTRO_REQUESTED"
        }
      },
      {
        id: "notif-deal-2",
        userEmail: "himanshu25b@gmail.com",
        type: "CHAT_MOVEMENT",
        title: "Deal Room Unlocked",
        message: "Mutual Match! BioHelix Synthetics accepted your intro request. Chat is now active.",
        timestamp: new Date(Date.now() - 3600000 * 4), // 4 hours ago
        read: false,
        category: "chat",
        metadata: {
          startupId: "st-03",
          startupName: "BioHelix Synthetics",
          state: "MUTUAL_MATCH"
        }
      },
      {
        id: "notif-reco-1",
        userEmail: "himanshu25b@gmail.com",
        type: "RECOMMENDATION",
        title: "New Venture Recommendation",
        message: "Recommendation Engine: NeuralFlux AI matches 90% of your investment thesis in DeepTech / AI.",
        timestamp: new Date(Date.now() - 3600000 * 24), // 24 hours ago
        read: false,
        category: "recommendation",
        metadata: {
          startupId: "st-01",
          startupName: "NeuralFlux AI",
          matchScore: 90
        }
      },
      {
        id: "notif-tag-1",
        userEmail: "himanshu25b@gmail.com",
        type: "TAGGED",
        title: "Mentioned in Discussion",
        message: "Sarah Chen tagged you in a diligence thread: \"Check out the unit economics of NeuralFlux. Looks highly promising.\"",
        timestamp: new Date(Date.now() - 60000 * 45), // 45 mins ago
        read: false,
        category: "mention",
        metadata: {
          taggedBy: "Sarah Chen",
          thread: "NeuralFlux Diligence"
        }
      }
    ]
  });
  console.log("Seeded Notifications.");

  console.log("Seeded ChatRooms & ChatMessages.");
  // 11. Seed Connect Hub Posts
  const posts = await prisma.post.createMany({
    data: [
      {
        id: "post-1",
        authorEmail: "founder@startup.com",
        authorName: "Swapn Kumar",
        authorRole: "Founder",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
        content: "Just deployed our new modular EV charging grid in beta! Exciting times for EcoCharge. Let me know if anyone wants a demo of our load-balancing algorithm.",
        tags: ["CleanTech", "BetaLaunch", "EV"],
        likes: 12,
        likedBy: ["himanshu25b@gmail.com", "sarah@apexhorizon.com"]
      },
      {
        id: "post-2",
        authorEmail: "himanshu25b@gmail.com",
        authorName: "Himanshu",
        authorRole: "Investor",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
        content: "I'm seeing a massive shift in how enterprise SaaS is adopting agentic workflows. If you are building autonomous orchestrators in DeepTech, my DMs are open.",
        tags: ["AgenticAI", "DeepTech", "VentureCapital"],
        likes: 45,
        likedBy: ["founder@startup.com"]
      }
    ]
  });
  console.log(`Seeded ${posts.count} Connect Hub Posts.`);

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
