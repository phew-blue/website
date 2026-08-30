// Personal information configuration
// Update these values in one place and they'll be used throughout the site

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  github: string;
  location: string;
  // SEO and structured data
  professionalDescription: string;
  areasServed: string[];
  technicalSkills: string[];
  occupationSkills: string[];
}

export const personalInfo: PersonalInfo = {
  name: "Robert Sumner",
  title: "VT & Edit Guarantee",
  email: "rob@phew.blue",
  linkedin: "https://www.linkedin.com/in/robert-sumner-91672661/",
  github: "https://github.com/phew-blue",

  location: "UK",

  // SEO and structured data
  professionalDescription: "VT & Edit Guarantee specialising in Outside Broadcast productions and post-production workflows. Experience with major broadcasters and broadcast technology.",
  areasServed: [
    "United Kingdom",
    "Europe"
  ],
  technicalSkills: [
    "EVS XT3/XT-VIA",
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
    "ST 2110"
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
