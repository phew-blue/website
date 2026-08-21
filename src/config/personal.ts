// Personal information configuration
// Update these values in one place and they'll be used throughout the site

export interface PersonalInfo {
  name: string;
  title: string;
  subtitle: string;
  email: string;
  mobile: string;
  linkedin: string;
  github: string;
  experience: string;
  location: string;
  summary: string;
  expertise: string[];
  // SEO and structured data
  professionalDescription: string;
  areasServed: string[];
  technicalSkills: string[];
  occupationSkills: string[];
}

export const personalInfo: PersonalInfo = {
  name: "Robert Sumner",
  title: "VT & Edit Guarantee",
  subtitle: "Professional broadcast technology specialist",
  email: "rob@phew.blue",
  mobile: "07545311816",
  linkedin: "https://www.linkedin.com/in/robert-sumner-91672661/",
  github: "https://github.com/phew-blue",
  experience: "10+ years",

  // Location and other details
  location: "UK", // Add if needed

  // Professional summary
  summary: "VT/EVS/Edit Guarantee with extensive experience across both live Outside Broadcast productions and post-production workflows.",

  expertise: [
    "EVS XT3/VIA Operation",
  ],

  // SEO and structured data
  professionalDescription: "VT & Edit Guarantee specializing in Outside Broadcast productions and post-production workflows. Experience with major broadcasters and broadcast technology.",
  areasServed: [
    "United Kingdom",
    "Europe"
  ],
  technicalSkills: [
    "EVS XT3/VIA",
    "LSM-VIA",
    "XTAccess",
    "IPDirector",
    "Avid Media Composer",
    "Adobe Premiere Pro",
    "DaVinci Resolve",
    "Sony MVS",
    "GV Kahuna",
    "Broadcast Technology",
    "Outside Broadcast",
    "Post Production",
    "Workflow Design",
    "UHD/HDR Production",
    "IP Workflows",
    "ST2110"
  ],
  occupationSkills: [
    "EVS Systems Deployment and Configuration",
    "Workflow Design",
    "Team Leadership",
    "Broadcast Compliance",
    "UHD/HDR Production",
    "IP Workflows"
  ]
} as const;
