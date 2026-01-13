
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, ArrowRight, Camera, Mic, Lock, Fingerprint, Trash2, StopCircle, Upload, CheckCircle2, Play, Pause, RotateCcw, Search, ChevronDown, Download, Share2, Star, BadgeCheck } from 'lucide-react';
import { Capsule } from '../types';

interface CapsuleFormProps {
  onClose: () => void;
  onSuccess: (capsule: Capsule) => void;
}

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

// Statische lijst met veelvoorkomende steden per land
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool", "Leeds", "Edinburgh", "Bristol", "Cardiff", "Belfast", "Newcastle", "Sheffield", "Leicester", "Coventry", "Nottingham", "Southampton", "Portsmouth", "Brighton", "Reading", "Plymouth"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem", "Arnhem", "Zaanstad", "Amersfoort", "Apeldoorn", "Hoofddorp", "Maastricht", "Leiden", "Dordrecht"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden", "Hannover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "Hospitalet", "Granada", "Vitoria", "A Coruña", "Elche"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste", "Brescia", "Taranto", "Prato", "Modena", "Reggio Calabria"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa", "Windsor", "Saskatoon", "Regina", "Sherbrooke", "St. John's", "Barrie"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Sunshine Coast", "Wollongong", "Hobart", "Geelong", "Townsville", "Cairns", "Toowoomba", "Darwin", "Ballarat", "Bendigo", "Albury", "Launceston"],
  "Japan": ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kawasaki", "Kyoto", "Saitama", "Hiroshima", "Sendai", "Chiba", "Kitakyushu", "Sakai", "Niigata", "Hamamatsu", "Shizuoka", "Okayama", "Kumamoto"],
  "China": ["Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Chengdu", "Hangzhou", "Wuhan", "Xi'an", "Nanjing", "Tianjin", "Suzhou", "Dongguan", "Chongqing", "Foshan", "Jinan", "Hefei", "Dalian", "Xiamen", "Kunming", "Zhengzhou"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Goiânia", "Belém", "Porto Alegre", "Guarulhos", "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Teresina"],
  "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez", "Torreón", "Querétaro", "San Luis Potosí", "Mérida", "Mexicali", "Aguascalientes", "Tampico", "Culiacán", "Cuernavaca", "Acapulco", "Toluca", "Morelia", "Chihuahua"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Tucumán", "La Plata", "Mar del Plata", "Salta", "Santa Fe", "San Juan", "Resistencia", "Santiago del Estero", "Corrientes", "Bahía Blanca", "Posadas", "Paraná", "Neuquén", "Formosa", "San Salvador de Jujuy", "La Rioja"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Kimberley", "Polokwane", "Nelspruit", "Rustenburg", "Welkom", "Pietermaritzburg", "Benoni", "Tembisa", "Vereeniging", "Boksburg", "Soweto", "Uitenhage", "Brakpan"],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Omsk", "Samara", "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Voronezh", "Perm", "Volgograd", "Krasnodar", "Saratov", "Tyumen", "Tolyatti", "Izhevsk"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Gaziantep", "Konya", "Kayseri", "Mersin", "Eskişehir", "Diyarbakır", "Samsun", "Denizli", "Şanlıurfa", "Adapazarı", "Malatya", "Erzurum", "Van", "Batman"],
  "Poland": ["Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice", "Białystok", "Gdynia", "Częstochowa", "Radom", "Sosnowiec", "Toruń", "Kielce", "Gliwice", "Zabrze", "Bytom"],
  "Belgium": ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "La Louvière", "Hasselt", "Kortrijk", "Ostend", "Sint-Niklaas", "Tournai", "Genk", "Seraing", "Roeselare"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Gävle", "Borås", "Södertälje", "Eskilstuna", "Karlstad", "Växjö", "Halmstad", "Sundsvall"],
  "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum", "Kristiansand", "Fredrikstad", "Sandnes", "Tromsø", "Sarpsborg", "Skien", "Ålesund", "Sandefjord", "Haugesund", "Tønsberg", "Moss", "Arendal", "Bodø", "Hamar", "Ytrebygda"],
  "Denmark": ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Hørsholm", "Helsingør", "Silkeborg", "Næstved", "Fredericia", "Viborg", "Køge", "Holstebro", "Taastrup"],
  "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Winterthur", "Lucerne", "St. Gallen", "Lugano", "Biel", "Thun", "Köniz", "La Chaux-de-Fonds", "Schaffhausen", "Fribourg", "Chur", "Neuchâtel", "Vernier", "Uster", "Sion"],
  "Portugal": ["Lisbon", "Porto", "Amadora", "Braga", "Setúbal", "Coimbra", "Queluz", "Funchal", "Cacém", "Vila Nova de Gaia", "Loures", "Felgueiras", "Évora", "Rio de Mouro", "Oeiras", "Aveiro", "Corroios", "Barreiro", "Montijo", "Almada"],
  "Greece": ["Athens", "Thessaloniki", "Patras", "Piraeus", "Larissa", "Heraklion", "Peristeri", "Kallithea", "Acharnes", "Kalamaria", "Nikaia", "Glyfada", "Volos", "Ilio", "Ilioupoli", "Keratsini", "Evosmos", "Chalandri", "Nea Smyrni", "Marousi"],
  "Ireland": ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Swords", "Dundalk", "Bray", "Navan", "Ennis", "Kilkenny", "Carlow", "Tralee", "Newbridge", "Naas", "Athlone", "Portlaoise", "Mullingar", "Wexford"],
  "New Zealand": ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier", "Palmerston North", "Rotorua", "New Plymouth", "Whangarei", "Invercargill", "Nelson", "Hastings", "Gisborne", "Dunedin", "Timaru", "Whanganui", "Masterton", "Blenheim", "Taupo"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Changwon", "Goyang", "Yongin", "Seongnam", "Bucheon", "Ansan", "Anyang", "Jeonju", "Cheonan", "Namyangju", "Hwaseong", "Gimhae"],
  "Singapore": ["Singapore"],
  "Thailand": ["Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai", "Hat Yai", "Udon Thani", "Pak Kret", "Khon Kaen", "Chaophraya Surasak", "Nakhon Si Thammarat", "Lat Phrao", "Phitsanulok", "Chon Buri", "Nakhon Pathom", "Ubon Ratchathani", "Nakhon Sawan", "Rayong", "Phuket", "Songkhla", "Pathum Thani"],
  "Philippines": ["Manila", "Quezon City", "Caloocan", "Davao", "Cebu", "Zamboanga", "Antipolo", "Pasig", "Cagayan de Oro", "Parañaque", "Las Piñas", "Makati", "Bacolod", "Valenzuela", "Muntinlupa", "San Jose del Monte", "Marikina", "Mandaue", "Bacoor", "Taguig"],
  "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Palembang", "Makassar", "Batam", "Pekanbaru", "Denpasar", "Padang", "Malang", "Samarinda", "Tangerang", "Pontianak", "Jambi", "Balikpapan", "Manado", "Cimahi", "Banjarmasin"],
  "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Haiphong", "Can Tho", "Bien Hoa", "Hue", "Nha Trang", "Vung Tau", "Rach Gia", "Quy Nhon", "Phan Thiet", "Long Xuyen", "Buon Ma Thuot", "Cam Ranh", "Cam Pha", "Thai Nguyen", "Ca Mau", "Bac Lieu", "Soc Trang"],
  "Egypt": ["Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "al-Mansura", "El-Mahalla El-Kubra", "Tanta", "Asyut", "Ismailia", "Faiyum", "Zagazig", "Damietta", "Aswan", "Minya", "Damanhur", "Beni Suef", "Qena"],
  "Morocco": ["Casablanca", "Rabat", "Fes", "Marrakech", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan", "Safi", "Mohammedia", "El Jadida", "Beni Mellal", "Nador", "Taza", "Khouribga", "Settat", "Larache", "Ksar El Kebir"],
  "Nigeria": ["Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Kaduna", "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin", "Oyo", "Enugu", "Abeokuta", "Onitsha", "Warri", "Calabar", "Akure", "Sokoto"],
  "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Garissa", "Kakamega", "Kisii", "Meru", "Machakos", "Nyeri", "Kericho", "Embu", "Narok", "Homa Bay", "Wajir", "Busia"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Abha", "Tabuk", "Buraydah", "Khamis Mushait", "Hail", "Najran", "Al Jubail", "Jizan", "Yanbu", "Al Kharj", "Arar", "Sakaka", "Jizan", "Abqaiq"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Khor Fakkan", "Kalba"],
  "Israel": ["Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beer Sheva", "Holon", "Bnei Brak", "Ramat Gan", "Rehovot", "Bat Yam", "Ashkelon", "Herzliya", "Kfar Saba", "Hadera", "Modiin", "Lod", "Nazareth"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Talca", "Arica", "Iquique", "Puerto Montt", "Los Ángeles", "Calama", "Copiapó", "Osorno", "Valdivia", "Quilpué", "Punta Arenas", "Curicó", "Villa del Mar"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Soledad", "Ibagué", "Bucaramanga", "Santa Marta", "Pereira", "Villavicencio", "Pasto", "Manizales", "Valledupar", "Montería", "Neiva", "Armenia", "Sincelejo", "Popayán"],
  "Peru": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Cusco", "Chimbote", "Huancayo", "Pucallpa", "Tacna", "Ica", "Juliaca", "Sullana", "Chincha Alta", "Huanuco", "Ayacucho", "Cajamarca", "Puno", "Tumbes"],
  "Venezuela": ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "Barcelona", "Maturín", "Ciudad Bolívar", "San Cristóbal", "Cumaná", "Barinas", "Mérida", "Cabimas", "Puerto La Cruz", "Punto Fijo", "Turmero", "Guarenas", "Acarigua", "Los Teques"],
  "Ecuador": ["Guayaquil", "Quito", "Cuenca", "Santo Domingo", "Machala", "Durán", "Manta", "Portoviejo", "Loja", "Ambato", "Esmeraldas", "Quevedo", "Riobamba", "Milagro", "Ibarra", "Babahoyo", "Sangolquí", "Daule", "Latacunga", "Tulcán"],
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1, duration: 0.8 }
  },
  exit: { opacity: 0, transition: { duration: 0.4 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const InputGroup: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <motion.div 
      className="space-y-2"
      animate={isFocused ? {
        filter: 'drop-shadow(0 0 8px rgba(30, 41, 59, 0.08))'
      } : {
        filter: 'drop-shadow(0 0 0px rgba(30, 41, 59, 0))'
      }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <label className="text-[9px] uppercase tracking-[0.25em] text-[#64748b]/80 font-black block">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      placeholder={placeholder}
        className="w-full bg-transparent border-b border-[#e2e8f0] py-3 md:py-4 text-xl md:text-2xl lg:text-3xl font-serif font-light tracking-tight focus:border-[#1e293b] outline-none transition-colors duration-600 placeholder:text-[#64748b]/30 text-[#1e293b]"
    />
    </motion.div>
);
};

// Custom dropdown component for date selects (replaces native select to fix scroll issues)
const DateSelect: React.FC<{ 
  value: string; 
  onChange: (v: string) => void; 
  options: string[]; 
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ value, onChange, options, placeholder, isOpen, onToggle, onClose }) => (
  <div className="relative date-select-container">
    <div 
      onClick={onToggle} 
      className="w-full bg-transparent border-b border-[#e2e8f0] flex items-center justify-between py-2 md:py-2.5 cursor-pointer group hover:border-[#1e293b] transition-all"
    >
      <span className={`text-xs md:text-sm lg:text-base font-serif ${value ? 'text-[#1e293b]' : 'text-[#1e293b]/20'}`}>
        {value || placeholder}
      </span>
      <ChevronDown size={12} className={`text-[#64748b] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 z-[90] bg-white border border-[#e2e8f0] shadow-xl mt-1 max-h-[180px] overflow-y-auto dropdown-scroll"
              onClick={(e) => e.stopPropagation()}
            >
          {options.map(opt => (
            <div 
              key={opt} 
              onClick={(e) => { 
                e.stopPropagation(); 
                onChange(opt); 
                onClose(); 
              }} 
              className="px-4 py-2 text-xs md:text-sm font-serif hover:bg-[#1e293b] hover:text-white transition-colors cursor-pointer border-b border-[#e2e8f0]/10"
            >
              {opt}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const CapsuleForm: React.FC<CapsuleFormProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sealingPhase, setSealingPhase] = useState<'idle' | 'intent' | 'preserving' | 'complete'>('idle');
  const [sealProgress, setSealProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  // Cleanup audio URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [finalCapsule, setFinalCapsule] = useState<Capsule | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Selection States
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    town: '',
    message: '',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: 120 }, (_, i) => (new Date().getFullYear() - i).toString());

  const now = new Date();
  const currentMetadata = useMemo(() => ({
    year: now.getFullYear(),
    month: months[now.getMonth()],
    day: now.getDate(),
    time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
  }), [now]);

  // Handle scroll to top when success is triggered
  useEffect(() => {
    if (step === 6 && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [step]);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.date-select-container')) {
        setShowDayMenu(false);
        setShowMonthMenu(false);
        setShowYearMenu(false);
        setShowCountryMenu(false);
        setShowCityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get cities for selected country from static list
  const availableCities = useMemo(() => {
    if (!formData.country) return [];
    return CITIES_BY_COUNTRY[formData.country] || [];
  }, [formData.country]);

  const filteredCountries = useMemo(() => 
    COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch]
  );

  const filteredCities = useMemo(() => 
    availableCities.filter(city => city.toLowerCase().includes(citySearch.toLowerCase())),
    [availableCities, citySearch]
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      alert("You can only add 10 images.");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file as Blob);
    });
  };

  const handleAudioImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous audio URL to prevent memory leaks
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
      const url = URL.createObjectURL(file);
      setAudioBlobUrl(url);
      
      const reader = new FileReader();
      reader.onloadend = () => setAudioBase64(reader.result as string);
      reader.onerror = () => console.error("Failed to read audio file");
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use the best available MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        
        // Cleanup previous audio URL
        if (audioBlobUrl) {
          URL.revokeObjectURL(audioBlobUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.onerror = () => {
          console.error("Failed to read recorded audio");
          alert("Failed to process audio. Please try recording again.");
        };
        reader.readAsDataURL(blob as Blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        alert("Recording error occurred. Please try again.");
        stopRecording();
      };
      
      // Start recording with timeslice for better data handling
      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) { 
            stopRecording(); 
            return 60; 
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) { 
      console.error("Recording error:", err);
      alert("Microphone access needed to record. Please allow microphone access and try again."); 
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const calculateAge = () => {
    if (!dobYear || !dobMonth || !dobDay) return 0;
    const birthDate = new Date(parseInt(dobYear), months.indexOf(dobMonth), parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleSeal = () => {
    // Basic validation
    if (!formData.name?.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!formData.country) {
      alert("Please select your country");
      return;
    }
    if (!formData.town?.trim()) {
      alert("Please enter your city");
      return;
    }
    if (!dobYear || !dobMonth || !dobDay) {
      alert("Please select your birth date");
      return;
    }
    
    // Phase 1: Intent
    setSealingPhase('intent');
    setIsSubmitting(true);
    setSealProgress(0);
    
    // Phase 2: Commitment (after 500ms)
    setTimeout(() => {
      setSealingPhase('preserving');
    }, 500);
    
    // Phase 3: Preservation (progress animation over 3 seconds)
    const progressInterval = setInterval(() => {
      setSealProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setSealingPhase('complete');
          return 100;
        }
        return prev + 1.1; // 100 / 90 ≈ 1.1 per 30ms (3 seconds total)
      });
    }, 30);
    
    // Phase 4: Completion & Phase 5: Revelation
    setTimeout(() => {
      const formattedDob = `${dobYear}-${(months.indexOf(dobMonth) + 1).toString().padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
      const newCapsule: Capsule = {
        id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        ...formData,
        dob: formattedDob,
        photos,
        video: audioBase64 || undefined, // TODO: This file should be removed as CapsuleWizard.tsx is used instead
        createdAt: new Date(),
        ageAtCreation: calculateAge(),
        archivalTimestamp: currentMetadata
      };
      setFinalCapsule(newCapsule);
      onSuccess(newCapsule);
      setStep(6);
      
      // Reset after transition
      setTimeout(() => {
        setIsSubmitting(false);
        setSealingPhase('idle');
        setSealProgress(0);
      }, 600);
    }, 4500); 
  };

  // Audio playback refs and states
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const step3AudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingStep3, setIsPlayingStep3] = useState(false);
  
  // Generic audio playback toggle function
  const toggleAudioPlayback = (
    audioRef: React.RefObject<HTMLAudioElement>,
    isCurrentlyPlaying: boolean,
    setIsCurrentlyPlaying: (value: boolean) => void
  ) => {
    if (!audioRef.current || !audioBlobUrl) return;
    
    if (isCurrentlyPlaying) {
      audioRef.current.pause();
      setIsCurrentlyPlaying(false);
    } else {
      audioRef.current.src = audioBlobUrl;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsCurrentlyPlaying(true);
          })
          .catch((error) => {
            console.error("Playback error:", error);
            setIsCurrentlyPlaying(false);
            alert("Failed to play audio. Please try again.");
          });
      }
    }
  };
  
  // Wrapper functions for specific use cases
  const togglePlayback = () => toggleAudioPlayback(reviewAudioRef, isPlaying, setIsPlaying);
  const togglePlaybackStep3 = () => toggleAudioPlayback(step3AudioRef, isPlayingStep3, setIsPlayingStep3);

  const handleDownload = () => window.print();

  const handleShare = async () => {
    if (navigator.share && finalCapsule) {
      try {
        await navigator.share({
          title: 'The Century Time Capsule',
          text: `I just established my legacy at The Century. Sealed until 2125.`,
          url: window.location.href,
        });
      } catch (err) { console.error(err); }
    } else {
      alert("Sharing legacy...");
    }
  };

  // Prevent body scroll when form is open
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalTop = document.body.style.top;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    
    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = originalTop;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="capsule-form-container fixed inset-0 bg-[#f5f3f1] z-[60] overflow-hidden"
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Background Grain Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Slow-Moving Ambient Light */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        initial={{ x: '-20%', y: '-20%' }}
        animate={{ 
          x: ['-20%', '120%', '-20%'],
          y: ['-20%', '120%', '-20%']
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.1), transparent 70%)',
          filter: 'blur(80px)',
          width: '150%',
          height: '150%'
        }}
      />
      
      {/* Sealing Ceremony Overlay - Only visible during sealing */}
      <AnimatePresence>
        {sealingPhase !== 'idle' && (
          <motion.div
            key="sealing-overlay"
            className="fixed inset-0 z-[70] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: sealingPhase === 'preserving' || sealingPhase === 'complete' ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background blur during preserving phase */}
            {sealingPhase === 'preserving' && (
              <motion.div
                className="absolute inset-0 bg-[#f5f3f1]"
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}
                animate={{
                  opacity: 1
                }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            {/* Radial light from center during preserving */}
            {sealingPhase === 'preserving' && (
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(212, 165, 116, 0.05) 0%, transparent 70%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1.5,
                  opacity: 0.05
                }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            
            {/* Progress indicator during preserving */}
            {sealingPhase === 'preserving' && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-2 border-[#1e293b]/10 border-t-[#1e293b]/30 rounded-full"
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Fingerprint size={24} className="text-[#1e293b]/40" />
                </motion.div>
                <motion.p
                  className="text-[10px] uppercase tracking-[0.3em] font-black text-[#64748b] mt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  Sealing...
                </motion.p>
              </motion.div>
            )}
            
            {/* Completion phase - fade to certificate */}
            {sealingPhase === 'complete' && (
              <motion.div
                className="absolute inset-0 bg-[#f5f3f1]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="h-screen w-full max-h-screen px-6 py-6 md:py-8 flex flex-col items-center relative print:bg-white overflow-hidden z-10" style={{ overscrollBehavior: 'none', maxWidth: '100vw' }}>
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-[#1e293b] opacity-40 hover:opacity-100 transition-all z-[80] outline-none group print:hidden">
          <X strokeWidth={1} size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="max-w-5xl w-full h-full flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-between">
                <div className="flex-1 flex flex-col justify-center space-y-8 md:space-y-12">
                  <div className="space-y-2 md:space-y-3">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#64748b] font-black block">Step 01</span>
                    <motion.h3 
                      className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-[#1e293b]"
                      style={{ 
                        letterSpacing: '-0.02em',
                        fontVariationSettings: '"wght" 350'
                      }}
                    >
                      Tell us <span className="italic font-light">who you are.</span>
                    </motion.h3>
                </div>
                  <div className="space-y-8 md:space-y-10">
                  <InputGroup label="Full Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="Your Name" />
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-2 relative">
                        <label className="text-[9px] uppercase tracking-[0.25em] text-[#64748b]/80 font-black block">Country</label>
                        <div onClick={() => setShowCountryMenu(!showCountryMenu)} className="w-full bg-transparent border-b border-[#e2e8f0] flex items-center justify-between py-2 md:py-3 cursor-pointer group hover:border-[#1e293b] transition-all">
                          <span className={`text-lg md:text-xl lg:text-2xl font-serif ${formData.country ? 'text-[#1e293b]' : 'text-[#1e293b]/20'}`}>{formData.country || 'Select Country'}</span>
                          <ChevronDown size={14} className={`text-[#64748b] transition-transform duration-200 ${showCountryMenu ? 'rotate-180' : ''}`} />
                      </div>
                      <AnimatePresence>{showCountryMenu && (
                          <motion.div 
                            initial={{ opacity: 0, y: -8, scale: 0.98 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: -8, scale: 0.98 }} 
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute top-full left-0 right-0 z-[90] bg-white border border-[#e2e8f0] shadow-xl mt-1 max-h-[200px] overflow-hidden flex flex-col"
                          >
                            <div className="p-2 border-b border-[#e2e8f0]/30 flex items-center gap-2 bg-[#f8fafc]"><Search size={12} className="text-[#64748b]" /><input autoFocus value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Search..." className="bg-transparent border-none outline-none w-full text-[9px] font-bold" /></div>
                            <div className="overflow-y-auto flex-1 dropdown-scroll max-h-[200px]">{filteredCountries.map(c => <div key={c} onClick={(e) => { e.stopPropagation(); setFormData({...formData, country: c, town: ''}); setShowCountryMenu(false); }} className="px-4 py-2 text-xs md:text-sm font-serif hover:bg-[#1e293b] hover:text-white transition-colors cursor-pointer border-b border-[#e2e8f0]/10">{c}</div>)}</div>
                        </motion.div>
                      )}</AnimatePresence>
                    </div>
                      <div className="space-y-2 relative">
                        <label className={`text-[9px] uppercase tracking-[0.25em] font-black block transition-colors ${formData.country ? 'text-[#64748b]/80' : 'text-[#64748b]/30'}`}>City</label>
                        <div onClick={() => formData.country && setShowCityMenu(!showCityMenu)} className={`w-full bg-transparent border-b border-[#e2e8f0] flex items-center justify-between py-2 md:py-3 transition-all ${formData.country ? 'cursor-pointer group hover:border-[#1e293b]' : 'cursor-not-allowed opacity-30'}`}>
                          <span className={`text-lg md:text-xl lg:text-2xl font-serif ${formData.town ? 'text-[#1e293b]' : 'text-[#1e293b]/20'}`}>{formData.town || (formData.country ? (availableCities.length > 0 ? 'Select City' : 'Type city name') : 'Select country first')}</span>
                          <ChevronDown size={14} className={`text-[#64748b] transition-transform duration-200 ${showCityMenu ? 'rotate-180' : ''}`} />
                      </div>
                        <AnimatePresence>{showCityMenu && formData.country && (
                          <motion.div 
                            initial={{ opacity: 0, y: -8, scale: 0.98 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute top-full left-0 right-0 z-[90] bg-white border border-[#e2e8f0] shadow-xl mt-1 max-h-[200px] overflow-hidden flex flex-col"
                          >
                            <div className="p-2 border-b border-[#e2e8f0]/30 flex items-center gap-2 bg-[#f8fafc]"><Search size={12} className="text-[#64748b]" /><input autoFocus value={citySearch} onChange={(e) => setCitySearch(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Search..." className="bg-transparent border-none outline-none w-full text-[9px] font-bold" /></div>
                            <div className="overflow-y-auto flex-1 dropdown-scroll max-h-[200px]">{filteredCities.map(city => <div key={city} onClick={(e) => { e.stopPropagation(); setFormData({...formData, town: city}); setShowCityMenu(false); }} className="px-4 py-2 text-xs md:text-sm font-serif hover:bg-[#1e293b] hover:text-white transition-colors cursor-pointer border-b border-[#e2e8f0]/10">{city}</div>)}<div className="p-2 border-t border-[#e2e8f0]/20 bg-[#f8fafc]"><input type="text" placeholder="Type city manually..." onKeyDown={(e) => { if (e.key === 'Enter') { setFormData({...formData, town: (e.target as HTMLInputElement).value}); setShowCityMenu(false); } }} className="w-full bg-transparent border-none outline-none text-center font-serif text-sm md:text-base italic text-[#1e293b]" /></div></div>
                        </motion.div>
                      )}</AnimatePresence>
                    </div>
                  </div>
                    <div className="space-y-3">
                      <label className="text-[9px] uppercase tracking-[0.25em] text-[#64748b]/80 font-black block">Birth Date</label>
                      <div className="grid grid-cols-3 gap-4 md:gap-6">
                        <DateSelect 
                          value={dobDay} 
                          onChange={setDobDay} 
                          options={days} 
                          placeholder="Day"
                          isOpen={showDayMenu}
                          onToggle={() => {
                            setShowDayMenu(!showDayMenu);
                            setShowMonthMenu(false);
                            setShowYearMenu(false);
                          }}
                          onClose={() => setShowDayMenu(false)}
                        />
                        <DateSelect 
                          value={dobMonth} 
                          onChange={setDobMonth} 
                          options={months} 
                          placeholder="Month"
                          isOpen={showMonthMenu}
                          onToggle={() => {
                            setShowMonthMenu(!showMonthMenu);
                            setShowDayMenu(false);
                            setShowYearMenu(false);
                          }}
                          onClose={() => setShowMonthMenu(false)}
                        />
                        <DateSelect 
                          value={dobYear} 
                          onChange={setDobYear} 
                          options={years} 
                          placeholder="Year"
                          isOpen={showYearMenu}
                          onToggle={() => {
                            setShowYearMenu(!showYearMenu);
                            setShowDayMenu(false);
                            setShowMonthMenu(false);
                          }}
                          onClose={() => setShowYearMenu(false)}
                        />
                    </div>
                  </div>
                </div>
                </div>
                <div className="pt-4 border-t border-[#e2e8f0] flex justify-end"><motion.button variants={itemVariants} onClick={() => setStep(2)} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-[#1e293b] group hover:opacity-70 transition-opacity"><span>Add Photos</span> <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></motion.button></div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-between">
                <div className="flex-1 flex flex-col justify-center space-y-4 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#64748b] font-black block">Step 02</span>
                    <motion.h3 
                      className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-[#1e293b]"
                      style={{ 
                        letterSpacing: '-0.02em',
                        fontVariationSettings: '"wght" 350'
                      }}
                    >
                      Add <span className="italic font-light">photos.</span>
                    </motion.h3>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 max-h-[60vh] overflow-y-auto photo-grid-scroll">
                    {photos.map((src, i) => (
                      <motion.div 
                        key={i} 
                        layoutId={`photo-${i}`}
                        initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: 2 }}
                        transition={{
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1],
                          delay: i * 0.05
                        }}
                        whileHover={{ scale: 1.02, zIndex: 10, rotate: -1 }}
                        className="aspect-[3/4] relative group bg-[#f1f5f9] border border-[#e2e8f0] overflow-hidden shadow-md rounded-sm"
                      >
                        <img src={src} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1200 ease-in-out" />
                        <motion.div
                          className="absolute inset-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <button 
                          onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} 
                          className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all active:scale-95"
                        >
                          <Trash2 size={10} />
                        </button>
                      </motion.div>
                    ))}
                    {photos.length < 10 && (
                      <label className="aspect-[3/4] border-2 border-dashed border-[#e2e8f0] flex flex-col items-center justify-center cursor-pointer hover:border-[#1e293b] hover:bg-white transition-all group active:scale-95 rounded-sm">
                        <Camera size={28} strokeWidth={1} className="text-[#94a3b8] group-hover:text-[#1e293b] mb-2 transition-colors w-7 h-7 md:w-7 md:h-7" />
                        <span className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] font-black text-[#94a3b8] group-hover:text-[#1e293b] transition-colors">Add</span>
                        <input type="file" hidden multiple accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>
                  {photos.length > 0 && (
                    <p className="text-[8px] uppercase tracking-[0.2em] font-black text-[#64748b] opacity-60 text-center">
                      {photos.length} / 10 photos
                    </p>
                  )}
                </div>
                <div className="pt-4 border-t border-[#e2e8f0] flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-[9px] uppercase tracking-[0.4em] font-black text-[#64748b] hover:text-[#1e293b] transition-colors">Back</button>
                  <button onClick={() => setStep(3)} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-[#1e293b] group hover:opacity-70 transition-opacity">
                    <span>Add Audio</span> 
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-between">
                <div className="flex-1 flex flex-col justify-center items-center space-y-6 md:space-y-8">
                  <div className="space-y-2 md:space-y-3 text-center">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#64748b] font-black block">Step 03</span>
                    <motion.h3 
                      className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-[#1e293b]"
                      style={{ 
                        letterSpacing: '-0.02em',
                        fontVariationSettings: '"wght" 350'
                      }}
                    >
                      Add <span className="italic font-light">voice.</span>
                    </motion.h3>
                  </div>
                  
                  <div className="w-full max-w-lg flex flex-col items-center gap-6 md:gap-8">
                      {/* Recording Button - Compact & Elegant */}
                      <div className="relative flex flex-col items-center gap-4">
                        {/* Idle state: gentle breathing animation */}
                        {!isRecording && !audioBase64 && (
                          <motion.div
                            animate={{
                              scale: [1, 1.02, 1],
                              opacity: [0.05, 0.08, 0.05]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-[#1e293b] rounded-full blur-[40px] -z-10"
                          />
                        )}
                        {/* Recording state: slower, more intentional pulse */}
                        {isRecording && (
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.1, 1],
                              opacity: [0.2, 0.4, 0.2]
                            }} 
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
                            className="absolute inset-0 bg-[#1e293b] rounded-full blur-[60px] -z-10" 
                          />
                        )}
                        <motion.button 
                          onClick={isRecording ? stopRecording : startRecording} 
                          className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
                            isRecording 
                              ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-xl shadow-[#1e293b]/30' 
                              : audioBase64 
                                ? 'bg-white text-[#334155] border-[#cbd5e1] hover:border-[#1e293b] hover:shadow-lg' 
                                : 'bg-white text-[#1e293b] border-[#e2e8f0] hover:border-[#1e293b] hover:shadow-lg'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {isRecording ? (
                            <StopCircle size={32} strokeWidth={1.5} />
                          ) : audioBase64 ? (
                            <CheckCircle2 size={32} strokeWidth={1.5} className="text-[#10b981]" />
                          ) : (
                            <Mic size={32} strokeWidth={1.5} />
                          )}
                        </motion.button>
                        {isRecording && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
                          />
                        )}
                      </div>
                    
                      {/* Timer - Compact & Clear */}
                      {isRecording && (
                        <motion.div 
                          className="w-full max-w-xs space-y-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <motion.div 
                            className="flex items-baseline justify-center gap-2"
                            key={recordingTime}
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="text-5xl md:text-7xl font-serif tabular-nums text-[#1e293b] tracking-tight font-light">
                              {recordingTime.toString().padStart(2, '0')}
                            </span>
                            <span className="text-xl md:text-2xl text-[#64748b] font-serif">s</span>
                          </motion.div>
                          <div className="w-full h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] rounded-full" 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(recordingTime / 60) * 100}%` }}
                              transition={{ duration: 0.3, ease: "linear" }}
                            />
                          </div>
                          <p className="text-[8px] uppercase tracking-[0.3em] font-black text-[#64748b] opacity-50 text-center">
                            Max 60 seconds
                          </p>
                        </motion.div>
                      )}
                    
                    {/* Status Message */}
                    {!isRecording && !audioBase64 && (
                      <p className="text-xs md:text-sm text-[#64748b] text-center max-w-md">
                        Record up to 60 seconds of your voice, or upload an audio file
                      </p>
                    )}
                    
                    {/* Audio Preview - Compact & Elegant */}
                    {!isRecording && audioBlobUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm space-y-4 pt-4 border-t border-[#e2e8f0]"
                      >
                        <p className="text-[8px] uppercase tracking-[0.3em] font-black text-[#64748b] text-center">
                          Recording Ready
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={togglePlaybackStep3}
                            className={`flex items-center gap-3 px-6 py-3 border-2 transition-all active:scale-95 rounded-full ${
                              isPlayingStep3 
                                ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-lg' 
                                : 'bg-white border-[#e2e8f0] text-[#1e293b] hover:border-[#334155] hover:shadow-md'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isPlayingStep3 ? 'bg-white/10' : 'bg-[#f1f5f9]'
                            }`}>
                              {isPlayingStep3 ? (
                                <Pause size={14} fill="currentColor" />
                              ) : (
                                <Play size={14} fill="currentColor" className="ml-0.5" />
                              )}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                              {isPlayingStep3 ? 'Pause' : 'Play'}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setAudioBlobUrl(null);
                              setAudioBase64(null);
                              setIsPlayingStep3(false);
                            }}
                            className="p-3 border-2 border-[#e2e8f0] rounded-full hover:border-red-300 hover:bg-red-50 transition-all active:scale-95"
                          >
                            <RotateCcw size={16} className="text-[#64748b]" />
                          </button>
                        </div>
                        <audio 
                          ref={(el) => { if (el) step3AudioRef.current = el; }} 
                          src={audioBlobUrl} 
                          onEnded={() => setIsPlayingStep3(false)} 
                          className="hidden" 
                          preload="auto" 
                        />
                      </motion.div>
                    )}
                    
                    {/* Upload Option - Compact */}
                    {!isRecording && (
                      <div className="pt-2">
                        <input 
                          type="file" 
                          hidden 
                          accept="audio/*" 
                          ref={audioInputRef} 
                          onChange={handleAudioImport} 
                        />
                        <button 
                          onClick={() => audioInputRef.current?.click()} 
                          className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-black text-[#64748b] hover:text-[#1e293b] transition-all px-6 py-2.5 border border-[#e2e8f0] rounded-full hover:bg-white hover:border-[#1e293b] active:scale-95"
                        >
                          <Upload size={12} /> 
                          {audioBase64 ? 'Replace File' : 'Upload Audio File'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Navigation - Always visible at bottom */}
                <div className="pt-4 border-t border-[#e2e8f0] flex justify-between items-center">
                  <button 
                    onClick={() => setStep(2)} 
                    className="text-[9px] uppercase tracking-[0.4em] font-black text-[#64748b] hover:text-[#1e293b] transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setStep(4)} 
                    className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-[#1e293b] group hover:opacity-70 transition-opacity"
                  >
                    <span>Final Message</span> 
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="step4" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-between">
                <div className="flex-1 flex flex-col justify-center space-y-4 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#64748b] font-black block">Step 04</span>
                    <motion.h3 
                      className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-[#1e293b]"
                      style={{ 
                        letterSpacing: '-0.02em',
                        fontVariationSettings: '"wght" 350'
                      }}
                    >
                      Final <span className="italic font-light">words.</span>
                    </motion.h3>
                  </div>
                  <motion.div 
                    className="flex-1 flex flex-col min-h-0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <textarea 
                      autoFocus 
                      value={formData.message} 
                      onChange={(e) => setFormData({...formData, message: e.target.value})} 
                      placeholder="Your message for 2125..." 
                      className="flex-1 w-full bg-transparent border-b border-[#e2e8f0] focus:border-[#1e293b] text-lg md:text-2xl lg:text-3xl font-serif font-light tracking-tight focus:ring-0 focus:outline-none resize-none placeholder:text-[#64748b]/30 leading-relaxed text-[#1e293b] py-4 transition-all duration-600 focus:bg-[#fafafa]/50" 
                      style={{
                        letterSpacing: formData.message ? '0.01em' : '0.02em'
                      }}
                    />
                    <AnimatePresence>
                      {formData.message.length > 0 && (
                        <motion.p 
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className={`text-[8px] uppercase tracking-[0.15em] font-black pt-2 transition-colors duration-600 ${
                            formData.message.length > 1000 
                              ? 'text-[#1e293b] opacity-70' 
                              : formData.message.length > 500 
                                ? 'text-[#334155] opacity-50'
                                : 'text-[#64748b] opacity-40'
                          }`}
                        >
                          {formData.message.length} characters
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                <div className="pt-4 border-t border-[#e2e8f0] flex justify-between items-center">
                  <button onClick={() => setStep(3)} className="text-[9px] uppercase tracking-[0.4em] font-black text-[#64748b] hover:text-[#1e293b] transition-colors">Back</button>
                  <button onClick={() => setStep(5)} className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-[#1e293b] group hover:opacity-70 transition-opacity">
                    <span>Review Manifest</span> 
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}
            {step === 5 && (
              <motion.div key="step5" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-between">
                <div className="flex-1 flex flex-col min-h-0 space-y-4 md:space-y-6">
                  <div className="text-center space-y-2">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#64748b] font-black block">Step 05</span>
                    <motion.h3 
                      className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-[#1e293b]"
                      style={{ 
                        letterSpacing: '-0.02em',
                        fontVariationSettings: '"wght" 350'
                      }}
                    >
                      Check your <span className="italic font-light">manifest.</span>
                    </motion.h3>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white border border-[#e2e8f0] p-6 md:p-8 shadow-xl rounded-sm review-content-scroll">
                    <motion.div 
                      className="space-y-6"
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                    >
                      {/* Personal Info - Compact Grid */}
                      <motion.div 
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 border-b border-[#e2e8f0] pb-4 md:pb-6"
                        variants={itemVariants}
                        whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div className="space-y-1" variants={itemVariants}>
                          <span className="text-[7px] uppercase tracking-[0.2em] font-black text-[#64748b]">Name</span>
                          <p className="font-serif text-xl md:text-2xl text-[#1e293b] leading-tight">{formData.name || 'Anonymous'}</p>
                        </motion.div>
                        <motion.div className="space-y-1" variants={itemVariants}>
                          <span className="text-[7px] uppercase tracking-[0.2em] font-black text-[#64748b]">Location</span>
                          <p className="font-serif text-xl md:text-2xl text-[#1e293b] leading-tight">{formData.town}, {formData.country}</p>
                        </motion.div>
                        <motion.div className="space-y-1" variants={itemVariants}>
                          <span className="text-[7px] uppercase tracking-[0.2em] font-black text-[#64748b]">Birth Date</span>
                          <p className="font-serif text-xl md:text-2xl text-[#1e293b] leading-tight">{dobDay} {dobMonth} {dobYear}</p>
                          <p className="text-[8px] uppercase tracking-[0.2em] font-black text-[#334155] italic">Age: {calculateAge()} years</p>
                        </motion.div>
                      </motion.div>
                      
                      {/* Artifacts - Compact */}
                      <motion.div 
                        className="space-y-3"
                        variants={itemVariants}
                        whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.3)' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] uppercase tracking-[0.2em] font-black text-[#64748b]">Artifacts</span>
                          <span className="text-[8px] font-black text-[#1e293b] opacity-40 uppercase">{photos.length} Photos / {audioBase64 ? '1 Audio' : '0 Audio'}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                          {photos.slice(0, 5).map((src, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              whileHover={{ scale: 1.08, zIndex: 10, rotate: -1 }}
                              onClick={() => setSelectedPhoto(src)} 
                              className="w-16 h-16 md:w-20 md:h-20 bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden cursor-zoom-in group shadow-sm rounded-sm"
                            >
                              <img src={src} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1200 ease-in-out" />
                            </motion.div>
                          ))}
                          {photos.length > 5 && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              className="w-16 h-16 md:w-20 md:h-20 bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center rounded-sm"
                            >
                              <span className="text-xs font-black text-[#64748b]">+{photos.length - 5}</span>
                            </motion.div>
                          )}
                          {audioBlobUrl && (
                            <motion.button 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              onClick={togglePlayback} 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-16 h-16 md:w-20 md:h-20 border-2 transition-all shadow-sm flex items-center justify-center rounded-sm ${
                                isPlaying ? 'bg-[#1e293b] border-[#1e293b] text-white' : 'bg-white border-[#e2e8f0] text-[#1e293b] hover:border-[#334155]'
                              }`}
                            >
                              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                            </motion.button>
                          )}
                          <audio ref={(el) => { if (el) reviewAudioRef.current = el; }} src={audioBlobUrl} onEnded={() => setIsPlaying(false)} className="hidden" preload="auto" />
                        </div>
                      </motion.div>
                      
                      {/* Message - Compact */}
                      {formData.message && (
                        <motion.div 
                          className="space-y-2 pt-2 border-t border-[#e2e8f0]"
                          variants={itemVariants}
                          whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.3)' }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-[7px] uppercase tracking-[0.2em] font-black text-[#64748b]">Message</span>
                          <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm">
                            <p className="font-serif text-sm md:text-base lg:text-lg leading-relaxed text-[#1e293b] italic line-clamp-4">
                              "{formData.message || 'No written message provided.'}"
                            </p>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Timestamp */}
                      <motion.div 
                        className="flex items-center gap-3 pt-2 border-t border-[#e2e8f0]"
                        variants={itemVariants}
                      >
                        <div className="w-2 h-2 rounded-full bg-[#334155] animate-pulse" />
                        <span className="text-[8px] uppercase tracking-[0.3em] font-black text-[#64748b]">
                          Prepared: {currentMetadata.day} {currentMetadata.month} {currentMetadata.year} — {currentMetadata.time}
                        </span>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Action Buttons - Always visible at bottom */}
                <div className="pt-4 space-y-3 border-t border-[#e2e8f0]">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                      <button onClick={() => setStep(1)} className="text-[8px] uppercase tracking-[0.3em] font-black text-red-600/60 hover:text-red-600 transition-colors">Discard</button>
                      <button onClick={() => setStep(4)} className="text-[8px] uppercase tracking-[0.3em] font-black text-[#1e293b] hover:opacity-70 transition-opacity border-b border-[#1e293b] pb-0.5">Edit</button>
                    </div>
                    <motion.div className="relative">
                      {/* Subtle glow on hover */}
                      <motion.div
                        className="absolute inset-0 rounded-sm opacity-0"
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          background: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.08), transparent 70%)',
                          filter: 'blur(20px)',
                          transform: 'scale(1.1)'
                        }}
                      />
                      
                      <motion.button 
                        disabled={isSubmitting} 
                        onClick={handleSeal} 
                        className="relative px-8 md:px-12 py-4 md:py-5 bg-[#1e293b] text-white text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-black shadow-xl overflow-hidden"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Shimmer effect on hover */}
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)' }}
                          initial={{ x: '-100%' }}
                          whileHover={{
                            x: '200%',
                            transition: { duration: 1.2, ease: "easeInOut" }
                          }}
                        />
                        
                        {/* Content */}
                        <span className="relative z-10 flex items-center gap-3">
                          {isSubmitting ? 'Sealing...' : 'Seal My Message'}
                          <motion.div
                            animate={isSubmitting ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 2, repeat: isSubmitting ? Infinity : 0, ease: "linear" }}
                          >
                            {isSubmitting ? (
                              <Fingerprint size={14} />
                            ) : (
                              <Lock size={14} />
                            )}
                          </motion.div>
                        </span>
                        
                        {/* Progress indicator (subtle) */}
                        {isSubmitting && (
                          <motion.div
                            className="absolute bottom-0 left-0 h-[2px] bg-white/30"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 4.5, ease: "linear" }}
                          />
                        )}
                      </motion.button>
                    </motion.div>
                  </div>
                  <p className="text-[8px] uppercase tracking-[0.15em] text-[#64748b] font-black opacity-50 text-center">
                    Once sealed, your message cannot be changed
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 6: Success (THE COMMEMORATIVE CERTIFICATE) */}
            {step === 6 && finalCapsule && (
              <motion.div 
                key="step6" 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible" 
                className="flex flex-col items-center gap-12 py-12 w-full print:py-0"
              >
                {/* THE CENTURY CERTIFICATE - Commemorative Ivory & Slate Design */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.94, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 1.4,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.3
                  }}
                  className="w-full max-w-2xl bg-[#f5f3f1] text-[#1e293b] p-16 md:p-24 text-center relative overflow-hidden flex flex-col items-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[2px] border border-[#e2e8f0] print:shadow-none print:border-none print:p-20"
                >
                  {/* Paper Grain Texture */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.04 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: '200px 200px',
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  
                  {/* Texture & Light */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '60px 60px' }} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-stone-100/30 via-transparent to-stone-200/20 pointer-events-none" />
                  
                  {/* Decorative Double Frame - Animated from corners */}
                  <motion.div 
                    className="absolute inset-6 border border-[#1e293b]/5 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.div 
                    className="absolute inset-8 border border-[#1e293b]/10 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                  
                  <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="mb-14">
                       <motion.div 
                        initial={{ rotate: -10, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="w-20 h-20 rounded-full border border-[#e2e8f0] flex items-center justify-center bg-white shadow-inner"
                       >
                          <Star className="text-[#334155]" size={36} strokeWidth={1} />
                       </motion.div>
                    </div>

                    <div className="space-y-4 mb-16">
                       <span className="text-[10px] uppercase tracking-[0.5em] font-black text-[#64748b] block">Established Presence</span>
                       <h3 className="font-serif text-5xl md:text-6xl text-[#1e293b] font-light italic tracking-tight">The Century</h3>
                       <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#94a3b8] mt-2">Legacy Archive Certificate</p>
                    </div>

                    <div className="space-y-4 mb-20">
                       <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[#94a3b8] block">This record confirms that</span>
                       <p className="font-serif text-4xl md:text-6xl text-[#0f172a] font-bold tracking-tighter">
                          {finalCapsule.name || 'A Silent Contributor'}
                       </p>
                       <div className="flex flex-col items-center gap-2 mt-6">
                         <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#64748b]">Has sealed a time capsule for the world of</span>
                         <p className="font-serif text-3xl text-[#1e293b] font-bold tracking-[0.1em]">2125</p>
                       </div>
                    </div>

                    {/* Commemorative Badge Block */}
                    <div className="w-full max-w-sm border-t border-b border-[#cbd5e1]/50 py-12 mb-16 relative">
                       <div className="flex flex-col gap-6">
                          <div className="space-y-2">
                             <span className="text-[8px] uppercase tracking-widest font-black text-[#94a3b8]">Registry Status</span>
                             <p className="font-serif text-3xl text-[#334155] font-bold uppercase tracking-widest italic">Eternal Storage</p>
                          </div>
                          <div className="flex items-center justify-center gap-8 pt-6 border-t border-[#cbd5e1]/30">
                             <div className="space-y-1">
                                <span className="text-[8px] uppercase tracking-widest font-black text-[#94a3b8]">Archived at</span>
                                <p className="font-serif text-lg text-[#1e293b] font-medium">{finalCapsule.town}</p>
                             </div>
                             <div className="w-px h-8 bg-[#cbd5e1]/50" />
                             <div className="space-y-1">
                                <span className="text-[8px] uppercase tracking-widest font-black text-[#94a3b8]">Year</span>
                                <p className="font-serif text-lg text-[#1e293b] font-medium">{finalCapsule.archivalTimestamp.year}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-6 opacity-60">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-[1px] bg-[#94a3b8]" />
                          <BadgeCheck size={24} strokeWidth={1} className="text-[#334155]" />
                          <div className="w-12 h-[1px] bg-[#94a3b8]" />
                       </div>
                       <p className="font-serif italic text-lg text-[#64748b] max-w-xs leading-relaxed">
                         "A beautiful reminder of a message cast into the currents of time."
                       </p>
                    </div>
                  </div>
                </motion.div>

                {/* REFINED ACTIONS */}
                <div className="flex flex-col items-center gap-10 w-full mb-32 print:hidden">
                   <div className="flex flex-col md:flex-row gap-6 w-full max-w-md">
                      <button 
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-4 px-10 py-7 bg-[#1e293b] text-white text-[12px] uppercase tracking-[0.4em] font-black hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                      >
                         <Download size={20} /> Save Certificate
                      </button>
                      <button 
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-4 px-10 py-7 bg-white text-[#1e293b] border-2 border-[#1e293b] text-[12px] uppercase tracking-[0.4em] font-black hover:bg-zinc-50 transition-all hover:-translate-y-1 active:translate-y-0"
                      >
                         <Share2 size={20} /> Share My Story
                      </button>
                   </div>
                   
                   <button 
                     onClick={onClose} 
                     className="text-[11px] uppercase tracking-[0.5em] font-black text-[#64748b] hover:text-[#1e293b] transition-all border-b border-transparent hover:border-[#1e293b] pb-2"
                   >
                      Back to Vault
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPhoto(null)} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 cursor-zoom-out backdrop-blur-md print:hidden">
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={selectedPhoto} className="max-w-full max-h-full object-contain shadow-2xl" />
            <button className="absolute top-8 right-8 text-white bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all p-4 rounded-full border border-white/20">
              <X size={40} strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Hide all scrollbars in the capsule form container */
        .capsule-form-container {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          overflow: hidden !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
        }
        .capsule-form-container * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .capsule-form-container *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        
        /* Hide scrollbars for photo grid and review content */
        .photo-grid-scroll,
        .review-content-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .photo-grid-scroll::-webkit-scrollbar,
        .review-content-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        
        /* Keep scrollbars for dropdowns only */
        .dropdown-scroll::-webkit-scrollbar {
          display: block;
          width: 3px;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #1e293b;
        }
        .dropdown-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        
        /* Prevent any overflow outside the container */
        .capsule-form-container > div {
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
        
        @media print {
          body * { visibility: hidden; }
          .print\:bg-white { background: white !important; }
          #step6-container, #step6-container * { visibility: visible; }
        }
      `}</style>
    </motion.div>
  );
};
