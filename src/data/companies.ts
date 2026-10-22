export type Company = {
  slug: string;
  name: string;
  city: string;
  services: string[];
  rating: number;
  reviews: number;
  priceFrom: number;
  description: string;
  phone: string;
  email: string;
  verified: boolean;
};

export const SERVICES = [
  "Mieszkania",
  "Biura",
  "Po remoncie",
  "Mycie okien",
  "Pranie tapicerki",
  "Sprzątanie generalne",
];

export const companies: Company[] = [
  { slug: "lsniacy-dom", name: "Lśniący Dom", city: "Warszawa", services: ["Mieszkania", "Sprzątanie generalne", "Mycie okien"], rating: 4.9, reviews: 212, priceFrom: 150, description: "Rodzinna firma z 10-letnim doświadczeniem. Ekologiczne środki czystości i stały zespół.", phone: "+48 600 100 200", email: "kontakt@lsniacydom.pl", verified: true },
  { slug: "biuro-clean", name: "BiuroClean", city: "Kraków", services: ["Biura", "Mycie okien"], rating: 4.7, reviews: 98, priceFrom: 300, description: "Kompleksowa obsługa powierzchni biurowych, również po godzinach pracy.", phone: "+48 600 200 300", email: "biuro@biuroclean.pl", verified: true },
  { slug: "po-remoncie-pro", name: "Po Remoncie PRO", city: "Wrocław", services: ["Po remoncie", "Sprzątanie generalne"], rating: 4.8, reviews: 143, priceFrom: 400, description: "Usuwamy pył, resztki farby i fug. Profesjonalny sprzęt przemysłowy.", phone: "+48 600 300 400", email: "info@poremonciepro.pl", verified: false },
  { slug: "swieza-kanapa", name: "Świeża Kanapa", city: "Gdańsk", services: ["Pranie tapicerki"], rating: 4.6, reviews: 67, priceFrom: 120, description: "Pranie ekstrakcyjne kanap, dywanów i materaców u klienta.", phone: "+48 600 400 500", email: "hej@swiezakanapa.pl", verified: true },
  { slug: "czyste-okna", name: "Czyste Okna 24", city: "Poznań", services: ["Mycie okien", "Biura"], rating: 4.5, reviews: 54, priceFrom: 100, description: "Mycie okien i witryn, także na wysokości z użyciem systemów teleskopowych.", phone: "+48 600 500 600", email: "zlecenia@czysteokna24.pl", verified: false },
  { slug: "perfekcyjny-porzadek", name: "Perfekcyjny Porządek", city: "Warszawa", services: ["Mieszkania", "Biura", "Po remoncie"], rating: 4.8, reviews: 176, priceFrom: 180, description: "Elastyczne terminy, sprzątanie jednorazowe i cykliczne.", phone: "+48 600 600 700", email: "kontakt@perfekcyjnyporzadek.pl", verified: true },
];
