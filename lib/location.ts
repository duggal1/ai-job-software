export interface Country {
  code: string;
  name: string;
  flag: string;
  cities: string[];
}

export const COUNTRIES: Country[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    cities: ["New York", "San Francisco", "Los Angeles", "Chicago", "Seattle", "Austin", "Boston", "Denver"],
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    cities: ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary"],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Canberra"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    cities: ["London", "Manchester", "Edinburgh", "Birmingham", "Cambridge"],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart"],
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nantes"],
  },
  {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    cities: ["Amsterdam", "Rotterdam", "Eindhoven", "Utrecht"],
  },
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    cities: ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"],
  },
  {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    cities: ["Madrid", "Barcelona", "Valencia", "Seville"],
  },
];

export function formatLocation(city: string, countryCode: string): string {
  return `${city}, ${countryCode}`;
}

export function parseLocation(location: string): { city: string; countryCode: string } | null {
  const parts = location.split(", ");
  if (parts.length !== 2) return null;
  const [city, countryCode] = parts;
  if (!city || !countryCode) return null;
  return { city, countryCode };
}
