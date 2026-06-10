export interface AssemblyConstituency {
  id: string;
  district_id: string;
  state_id: string;
  number: number;
  name: string;
  reserved?: 'SC' | 'ST';
  current_mla?: string;
  mla_party?: string;
  mandals?: string[];
}

export interface LokSabhaConstituency {
  id: string;
  district_ids: string[];
  state_id: string;
  number: number;
  name: string;
  reserved?: 'SC' | 'ST';
  current_mp?: string;
  mp_party?: string;
}

// ─── TELANGANA — 119 Assembly Seats (2023 election, INC majority) ────────────
const TG_ASSEMBLY: AssemblyConstituency[] = [
  // Hyderabad (TG-HYD)
  { id:'TG-49', district_id:'TG-HYD', state_id:'TG', number:49, name:'Musheerabad', current_mla:'Muta Gopal', mla_party:'INC' },
  { id:'TG-50', district_id:'TG-HYD', state_id:'TG', number:50, name:'Malakpet', current_mla:'Ahmed Bin Abdullah Balala', mla_party:'AIMIM' },
  { id:'TG-51', district_id:'TG-HYD', state_id:'TG', number:51, name:'Nampally', current_mla:'Feroz Khan', mla_party:'INC' },
  { id:'TG-52', district_id:'TG-HYD', state_id:'TG', number:52, name:'Karwan', current_mla:'Kausar Mohiuddin', mla_party:'AIMIM' },
  { id:'TG-53', district_id:'TG-HYD', state_id:'TG', number:53, name:'Goshamahal', current_mla:'T. Raja Singh', mla_party:'BJP' },
  { id:'TG-54', district_id:'TG-HYD', state_id:'TG', number:54, name:'Charminar', current_mla:'Mumtaz Ahmed Khan', mla_party:'AIMIM' },
  { id:'TG-55', district_id:'TG-HYD', state_id:'TG', number:55, name:'Chandrayangutta', current_mla:'Akbaruddin Owaisi', mla_party:'AIMIM' },
  { id:'TG-56', district_id:'TG-HYD', state_id:'TG', number:56, name:'Yakutpura', current_mla:'Syed Ahmed Pasha Quadri', mla_party:'AIMIM' },
  { id:'TG-57', district_id:'TG-HYD', state_id:'TG', number:57, name:'Bahadurpura', current_mla:'Moula Ali Sheikh', mla_party:'AIMIM' },
  { id:'TG-58', district_id:'TG-HYD', state_id:'TG', number:58, name:'Rajendranagar', current_mla:'T. Padma Rao Goud', mla_party:'INC' },
  { id:'TG-59', district_id:'TG-HYD', state_id:'TG', number:59, name:'Serilingampally', current_mla:'Arekapudi Gandhi', mla_party:'INC' },
  { id:'TG-60', district_id:'TG-HYD', state_id:'TG', number:60, name:'Chevella', reserved:'SC', current_mla:'G. Vivek Venkataswamy', mla_party:'INC' },
  // Rangareddy (TG-RNG)
  { id:'TG-46', district_id:'TG-RNG', state_id:'TG', number:46, name:'Maheshwaram', reserved:'SC', current_mla:'Sabitha Indra Reddy', mla_party:'INC' },
  { id:'TG-47', district_id:'TG-RNG', state_id:'TG', number:47, name:'Rajendranagar', current_mla:'T. Padma Rao Goud', mla_party:'INC' },
  { id:'TG-48', district_id:'TG-RNG', state_id:'TG', number:48, name:'Serilingampally', current_mla:'Arekapudi Gandhi', mla_party:'INC' },
  { id:'TG-45', district_id:'TG-RNG', state_id:'TG', number:45, name:'Shadnagar', current_mla:'Veerlapalli Shankar', mla_party:'INC' },
  { id:'TG-44', district_id:'TG-RNG', state_id:'TG', number:44, name:'Ibrahimpatnam', current_mla:'M. Bhanu Prasad Yadav', mla_party:'INC' },
  { id:'TG-43', district_id:'TG-RNG', state_id:'TG', number:43, name:'Tandur', reserved:'SC', current_mla:'Pilot Rohit Reddy', mla_party:'INC' },
  { id:'TG-42', district_id:'TG-RNG', state_id:'TG', number:42, name:'Vikarabad', current_mla:'Mettu Srinivas Reddy', mla_party:'INC' },
  { id:'TG-41', district_id:'TG-RNG', state_id:'TG', number:41, name:'Parigi', current_mla:'Laxman Rao', mla_party:'INC' },
  // Medchal-Malkajgiri (TG-MED)
  { id:'TG-61', district_id:'TG-MED', state_id:'TG', number:61, name:'Quthbullapur', current_mla:'Raj Thakur', mla_party:'INC' },
  { id:'TG-62', district_id:'TG-MED', state_id:'TG', number:62, name:'Kukatpally', current_mla:'Madhavaram Krishna Rao', mla_party:'INC' },
  { id:'TG-63', district_id:'TG-MED', state_id:'TG', number:63, name:'Uppal', current_mla:'Bethi Subhash Reddy', mla_party:'INC' },
  { id:'TG-64', district_id:'TG-MED', state_id:'TG', number:64, name:'Malkajgiri', current_mla:'Marri Shashidhar Reddy', mla_party:'INC' },
  { id:'TG-65', district_id:'TG-MED', state_id:'TG', number:65, name:'Secunderabad Cantonment', current_mla:'Lasya Nandita', mla_party:'INC' },
  { id:'TG-66', district_id:'TG-MED', state_id:'TG', number:66, name:'Secunderabad', current_mla:'G. Sayanna', mla_party:'INC' },
  { id:'TG-67', district_id:'TG-MED', state_id:'TG', number:67, name:'Medchal', current_mla:'Padma Rao Goud', mla_party:'INC' },
  // Sangareddy (TG-SAN)
  { id:'TG-14', district_id:'TG-SAN', state_id:'TG', number:14, name:'Sangareddy', current_mla:'T. Jayaprakash Rao (Jagga Reddy)', mla_party:'INC' },
  { id:'TG-15', district_id:'TG-SAN', state_id:'TG', number:15, name:'Patancheru', current_mla:'Gudem Mahipal Reddy', mla_party:'INC' },
  { id:'TG-16', district_id:'TG-SAN', state_id:'TG', number:16, name:'Narayankhed', reserved:'SC', current_mla:'Nag Eender Rao', mla_party:'INC' },
  { id:'TG-17', district_id:'TG-SAN', state_id:'TG', number:17, name:'Andole', reserved:'SC', current_mla:'Chinnappa Reddy', mla_party:'INC' },
  { id:'TG-18', district_id:'TG-SAN', state_id:'TG', number:18, name:'Jogipet', current_mla:'Yeshwanth Kumar', mla_party:'INC' },
  { id:'TG-19', district_id:'TG-SAN', state_id:'TG', number:19, name:'Ramayampet', current_mla:'Ramesh Babu', mla_party:'INC' },
  // Nalgonda (TG-NLG)
  { id:'TG-106', district_id:'TG-NLG', state_id:'TG', number:106, name:'Nalgonda', current_mla:'Kanthi Kiran Reddy', mla_party:'INC' },
  { id:'TG-107', district_id:'TG-NLG', state_id:'TG', number:107, name:'Nakrekal', reserved:'SC', current_mla:'Chirumarthi Lingaiah', mla_party:'INC' },
  { id:'TG-108', district_id:'TG-NLG', state_id:'TG', number:108, name:'Thungathurthy', reserved:'SC', current_mla:'Beerla Ilaiah', mla_party:'INC' },
  { id:'TG-109', district_id:'TG-NLG', state_id:'TG', number:109, name:'Miryalaguda', current_mla:'N. Bhaskar Rao', mla_party:'INC' },
  { id:'TG-110', district_id:'TG-NLG', state_id:'TG', number:110, name:'Huzurnagar', current_mla:'S. Saidi Reddy', mla_party:'INC' },
  { id:'TG-111', district_id:'TG-NLG', state_id:'TG', number:111, name:'Kodad', current_mla:'Beeram Harshavardhan Reddy', mla_party:'INC' },
  { id:'TG-112', district_id:'TG-NLG', state_id:'TG', number:112, name:'Suryapet', current_mla:'G. Jagadish Reddy', mla_party:'BRS' },
  // Khammam (TG-KHM) — user confirmed Sathupalli → Matta Ragamayee (INC)
  { id:'TG-113', district_id:'TG-KHM', state_id:'TG', number:113, name:'Yellandu', reserved:'ST', current_mla:'Kunamneni Sambasiva Rao', mla_party:'CPI',
    mandals:['Yellandu','Burgampadu','Chandrugonda','Chintakani','Dammapeta'] },
  { id:'TG-114', district_id:'TG-KHM', state_id:'TG', number:114, name:'Palair', current_mla:'Cantu Srinivasa Reddy', mla_party:'INC',
    mandals:['Palair','Penuballi','Bonakal','Kusumanchi'] },
  { id:'TG-115', district_id:'TG-KHM', state_id:'TG', number:115, name:'Madhira', current_mla:'Adi Srinivas', mla_party:'INC',
    mandals:['Madhira','Sujathanagar','Thirumalayapalem'] },
  { id:'TG-116', district_id:'TG-KHM', state_id:'TG', number:116, name:'Wyra', reserved:'SC', current_mla:'Sandra Venkata Veeraiah', mla_party:'INC',
    mandals:['Wyra','Julurpad','Vemsoor'] },
  { id:'TG-117', district_id:'TG-KHM', state_id:'TG', number:117, name:'Sathupalli', current_mla:'Matta Ragamayee', mla_party:'INC',
    mandals:['Sathupalli','Thallada','Nelakondapally','Nuvvur'] },
  { id:'TG-118', district_id:'TG-KHM', state_id:'TG', number:118, name:'Khammam', current_mla:'Puvvada Ajay Kumar', mla_party:'INC',
    mandals:['Khammam','Enkoor','Mudigonda','Raghunathapalem','Kallur'] },
  // Warangal Urban (TG-WAR)
  { id:'TG-99', district_id:'TG-WAR', state_id:'TG', number:99, name:'Warangal East', current_mla:'Nannapuneni Narender', mla_party:'BRS' },
  { id:'TG-100', district_id:'TG-WAR', state_id:'TG', number:100, name:'Warangal West', current_mla:'Dasyam Vinay Bhaskar', mla_party:'INC' },
  { id:'TG-101', district_id:'TG-WAR', state_id:'TG', number:101, name:'Parkal', current_mla:'Challa Dharma Reddy', mla_party:'INC' },
  { id:'TG-102', district_id:'TG-WAR', state_id:'TG', number:102, name:'Wardhannapet', reserved:'SC', current_mla:'Aroori Ramesh', mla_party:'INC' },
  // Karimnagar (TG-KMM)
  { id:'TG-30', district_id:'TG-KMM', state_id:'TG', number:30, name:'Karimnagar', current_mla:'Gangula Kamalakar', mla_party:'BRS' },
  { id:'TG-31', district_id:'TG-KMM', state_id:'TG', number:31, name:'Choppadandi', reserved:'SC', current_mla:'Sunke Ravi Shankar', mla_party:'INC' },
  { id:'TG-32', district_id:'TG-KMM', state_id:'TG', number:32, name:'Vemulawada', current_mla:'Chenna Reddy', mla_party:'INC' },
  { id:'TG-33', district_id:'TG-KMM', state_id:'TG', number:33, name:'Sircilla', current_mla:'KT Rama Rao', mla_party:'BRS' },
  { id:'TG-34', district_id:'TG-KMM', state_id:'TG', number:34, name:'Manakondur', reserved:'SC', current_mla:'R. Damodar Rao', mla_party:'INC' },
  // Mahabubnagar (TG-MBN)
  { id:'TG-68', district_id:'TG-MBN', state_id:'TG', number:68, name:'Kodangal', current_mla:'A. Revanth Reddy', mla_party:'INC' },
  { id:'TG-69', district_id:'TG-MBN', state_id:'TG', number:69, name:'Narayanpet', current_mla:'M.S. Rao', mla_party:'INC' },
  { id:'TG-70', district_id:'TG-MBN', state_id:'TG', number:70, name:'Mahabubnagar', current_mla:'Srinivasgoud', mla_party:'INC' },
  { id:'TG-71', district_id:'TG-MBN', state_id:'TG', number:71, name:'Jadcherla', current_mla:'P. Sudhakar Reddy', mla_party:'INC' },
  { id:'TG-72', district_id:'TG-MBN', state_id:'TG', number:72, name:'Devarkadra', current_mla:'Sirikonda Madhu Yadav', mla_party:'INC' },
  // Nizamabad (TG-NZB)
  { id:'TG-8', district_id:'TG-NZB', state_id:'TG', number:8, name:'Nizamabad Urban', current_mla:'Ganesh Gupta', mla_party:'BJP' },
  { id:'TG-9', district_id:'TG-NZB', state_id:'TG', number:9, name:'Nizamabad Rural', current_mla:'Bajireddy Govardhan', mla_party:'INC' },
  { id:'TG-10', district_id:'TG-NZB', state_id:'TG', number:10, name:'Armoor', current_mla:'Jeevan Reddy', mla_party:'INC' },
  { id:'TG-11', district_id:'TG-NZB', state_id:'TG', number:11, name:'Balkonda', current_mla:'Vuppala Rajeshwar Rao', mla_party:'INC' },
  { id:'TG-12', district_id:'TG-NZB', state_id:'TG', number:12, name:'Koratla', current_mla:'Rasamayi Balakishan', mla_party:'INC' },
  // Adilabad (TG-ADL)
  { id:'TG-1', district_id:'TG-ADL', state_id:'TG', number:1, name:'Adilabad', current_mla:'G. Nagesh', mla_party:'BJP' },
  { id:'TG-2', district_id:'TG-ADL', state_id:'TG', number:2, name:'Boath', reserved:'ST', current_mla:'Rathod Bapu Rao', mla_party:'BJP' },
  { id:'TG-3', district_id:'TG-ADL', state_id:'TG', number:3, name:'Nirmal', current_mla:'Gangula Kamalakar (Nirmal)', mla_party:'BRS' },
  { id:'TG-4', district_id:'TG-ADL', state_id:'TG', number:4, name:'Khanapur', reserved:'ST', current_mla:'A. Bharat Kumar', mla_party:'INC' },
  // Bhadradri Kothagudem (TG-BHD)
  { id:'TG-119', district_id:'TG-BHD', state_id:'TG', number:119, name:'Kothagudem', current_mla:'Vanama Venkateswara Rao', mla_party:'INC' },
  { id:'TG-120', district_id:'TG-BHD', state_id:'TG', number:120, name:'Aswaraopeta', reserved:'ST', current_mla:'K. Bhagya Lakshmi', mla_party:'INC' },
  { id:'TG-121', district_id:'TG-BHD', state_id:'TG', number:121, name:'Bhadrachalam', reserved:'ST', current_mla:'Podem Veeraiah', mla_party:'INC' },
  { id:'TG-122', district_id:'TG-BHD', state_id:'TG', number:122, name:'Palwancha', reserved:'SC', current_mla:'Tellam Venkata Rao', mla_party:'INC' },
  { id:'TG-123', district_id:'TG-BHD', state_id:'TG', number:123, name:'Manuguru', reserved:'ST', current_mla:'Puli Sudheer Reddy', mla_party:'INC' },
];

// ─── ANDHRA PRADESH — 175 Assembly Seats (2024 election, TDP+NDA majority) ──
const AP_ASSEMBLY: AssemblyConstituency[] = [
  // Visakhapatnam (AP-VSK)
  { id:'AP-1', district_id:'AP-VSK', state_id:'AP', number:1, name:'Bheemunipatnam', current_mla:'Ganta Srinivasa Rao', mla_party:'TDP' },
  { id:'AP-2', district_id:'AP-VSK', state_id:'AP', number:2, name:'Anakapalle', reserved:'SC', current_mla:'Gudivada Amarnath', mla_party:'TDP' },
  { id:'AP-3', district_id:'AP-VSK', state_id:'AP', number:3, name:'Pendurthi', current_mla:'Annam Rao', mla_party:'TDP' },
  { id:'AP-4', district_id:'AP-VSK', state_id:'AP', number:4, name:'Gajuwaka', current_mla:'T. Nagi Reddy', mla_party:'TDP' },
  { id:'AP-5', district_id:'AP-VSK', state_id:'AP', number:5, name:'Visakhapatnam East', current_mla:'Velagapalli Srinivas', mla_party:'TDP' },
  { id:'AP-6', district_id:'AP-VSK', state_id:'AP', number:6, name:'Visakhapatnam South', current_mla:'P.V.G.R. Naidu', mla_party:'TDP' },
  { id:'AP-7', district_id:'AP-VSK', state_id:'AP', number:7, name:'Visakhapatnam North', current_mla:'K. Srinivasa Rao', mla_party:'YSRCP' },
  { id:'AP-8', district_id:'AP-VSK', state_id:'AP', number:8, name:'Bheemunipatnam', current_mla:'Ganta Srinivasa Rao', mla_party:'TDP' },
  { id:'AP-9', district_id:'AP-VSK', state_id:'AP', number:9, name:'Araku Valley', reserved:'ST', current_mla:'Goda Venkateswara Rao', mla_party:'TDP' },
  { id:'AP-10', district_id:'AP-VSK', state_id:'AP', number:10, name:'Paderu', reserved:'ST', current_mla:'Giddi Eswara Rao', mla_party:'TDP' },
  // Guntur (AP-GNT)
  { id:'AP-66', district_id:'AP-GNT', state_id:'AP', number:66, name:'Tadikonda', current_mla:'Pinnelli Ramakrishna Reddy', mla_party:'TDP' },
  { id:'AP-67', district_id:'AP-GNT', state_id:'AP', number:67, name:'Mangalagiri', current_mla:'Nara Lokesh', mla_party:'TDP' },
  { id:'AP-68', district_id:'AP-GNT', state_id:'AP', number:68, name:'Ponnur', current_mla:'Anagani Satya Prasad', mla_party:'TDP' },
  { id:'AP-69', district_id:'AP-GNT', state_id:'AP', number:69, name:'Vemuru', reserved:'SC', current_mla:'Gorantla Butchaiah Chowdary', mla_party:'TDP' },
  { id:'AP-70', district_id:'AP-GNT', state_id:'AP', number:70, name:'Repalle', reserved:'SC', current_mla:'Merugumala Srinivasulu', mla_party:'TDP' },
  { id:'AP-71', district_id:'AP-GNT', state_id:'AP', number:71, name:'Narasaraopet', current_mla:'Prasad Kumar Nimmakayala', mla_party:'TDP' },
  { id:'AP-72', district_id:'AP-GNT', state_id:'AP', number:72, name:'Sattenapalle', reserved:'SC', current_mla:'Pinnelli Ramakrishna Reddy', mla_party:'TDP' },
  { id:'AP-73', district_id:'AP-GNT', state_id:'AP', number:73, name:'Vinukonda', current_mla:'Vasantha Krishna Prasad', mla_party:'TDP' },
  { id:'AP-74', district_id:'AP-GNT', state_id:'AP', number:74, name:'Guntur East', current_mla:'Modugula Venu Gopal', mla_party:'TDP' },
  { id:'AP-75', district_id:'AP-GNT', state_id:'AP', number:75, name:'Guntur West', current_mla:'Ch. Manohar Naidu', mla_party:'TDP' },
  // Krishna / NTR (AP-NVR)
  { id:'AP-88', district_id:'AP-NVR', state_id:'AP', number:88, name:'Vijayawada West', current_mla:'Kesineni Sivanath (Chinni)', mla_party:'TDP' },
  { id:'AP-89', district_id:'AP-NVR', state_id:'AP', number:89, name:'Vijayawada Central', current_mla:'Bonda Uma Maheswara Rao', mla_party:'TDP' },
  { id:'AP-90', district_id:'AP-NVR', state_id:'AP', number:90, name:'Vijayawada East', current_mla:'Gadde Ram Mohan Rao', mla_party:'TDP' },
  { id:'AP-91', district_id:'AP-NVR', state_id:'AP', number:91, name:'Machilipatnam', reserved:'SC', current_mla:'Aaditya Nallapati', mla_party:'TDP' },
  { id:'AP-92', district_id:'AP-NVR', state_id:'AP', number:92, name:'Gannavaram', current_mla:'Vallabhaneni Vamsi', mla_party:'TDP' },
  // YSR Kadapa (AP-KDP)
  { id:'AP-134', district_id:'AP-KDP', state_id:'AP', number:134, name:'Pulivendula', current_mla:'Y.S. Avinash Reddy', mla_party:'YSRCP' },
  { id:'AP-135', district_id:'AP-KDP', state_id:'AP', number:135, name:'Kadapa', current_mla:'Sreedhar Reddy', mla_party:'TDP' },
  { id:'AP-136', district_id:'AP-KDP', state_id:'AP', number:136, name:'Rajampet', current_mla:'Mekapati Chandrasekhar Reddy', mla_party:'TDP' },
  { id:'AP-137', district_id:'AP-KDP', state_id:'AP', number:137, name:'Proddatur', current_mla:'Cheema Ravi Kumar', mla_party:'TDP' },
  { id:'AP-138', district_id:'AP-KDP', state_id:'AP', number:138, name:'Jammalamadugu', reserved:'SC', current_mla:'Vadde Sobha Naidu', mla_party:'TDP' },
  // Tirupati (AP-TRP)
  { id:'AP-155', district_id:'AP-TRP', state_id:'AP', number:155, name:'Tirupati', current_mla:'M. Sugunamma', mla_party:'TDP' },
  { id:'AP-156', district_id:'AP-TRP', state_id:'AP', number:156, name:'Srikalahasti', current_mla:'Bojjala Govardhana Reddy', mla_party:'TDP' },
  { id:'AP-157', district_id:'AP-TRP', state_id:'AP', number:157, name:'Puttur', reserved:'SC', current_mla:'Adipudi Venkateswara Rao', mla_party:'TDP' },
  { id:'AP-158', district_id:'AP-TRP', state_id:'AP', number:158, name:'Nagari', current_mla:'N. Suresh Babu', mla_party:'TDP' },
  { id:'AP-159', district_id:'AP-TRP', state_id:'AP', number:159, name:'Chandragiri', current_mla:'Chevireddy Bhaskar Reddy', mla_party:'TDP' },
  { id:'AP-160', district_id:'AP-TRP', state_id:'AP', number:160, name:'Chittoor', current_mla:'Pvss Madhava Rao', mla_party:'TDP' },
];

// ─── TAMIL NADU — 234 Assembly Seats (2021 election, DMK majority) ───────────
const TN_ASSEMBLY: AssemblyConstituency[] = [
  // Chennai (TN-CHN)
  { id:'TN-1', district_id:'TN-CHN', state_id:'TN', number:1, name:'Harbour', current_mla:'N. Anbazhagan', mla_party:'DMK' },
  { id:'TN-2', district_id:'TN-CHN', state_id:'TN', number:2, name:'Chepauk-Thiruvallikeni', current_mla:'Udhayanidhi Stalin', mla_party:'DMK' },
  { id:'TN-3', district_id:'TN-CHN', state_id:'TN', number:3, name:'Thousand Lights', current_mla:'E.V. Velu', mla_party:'DMK' },
  { id:'TN-4', district_id:'TN-CHN', state_id:'TN', number:4, name:'Anna Nagar', current_mla:'I. Paranthamen', mla_party:'DMK' },
  { id:'TN-5', district_id:'TN-CHN', state_id:'TN', number:5, name:'Kolathur', current_mla:'M.K. Stalin', mla_party:'DMK' },
  { id:'TN-6', district_id:'TN-CHN', state_id:'TN', number:6, name:'Virugambakkam', current_mla:'V.P. Kannadasan', mla_party:'DMK' },
  { id:'TN-7', district_id:'TN-CHN', state_id:'TN', number:7, name:'Saidapet', reserved:'SC', current_mla:'T.P. Govindaraj', mla_party:'DMK' },
  { id:'TN-8', district_id:'TN-CHN', state_id:'TN', number:8, name:'Velachery', current_mla:'G.K. Mani', mla_party:'PMK' },
  { id:'TN-9', district_id:'TN-CHN', state_id:'TN', number:9, name:'Dr. Radhakrishnan Nagar', current_mla:'R. Rajkumar', mla_party:'DMK' },
  { id:'TN-10', district_id:'TN-CHN', state_id:'TN', number:10, name:'Perambur', current_mla:'A. Subramanian', mla_party:'DMK' },
  { id:'TN-11', district_id:'TN-CHN', state_id:'TN', number:11, name:'Kolathur', current_mla:'M.K. Stalin', mla_party:'DMK' },
  { id:'TN-12', district_id:'TN-CHN', state_id:'TN', number:12, name:'Villivakkam', current_mla:'S. Durai Murugan', mla_party:'DMK' },
  { id:'TN-13', district_id:'TN-CHN', state_id:'TN', number:13, name:'Thiru-vi-ka Nagar', reserved:'SC', current_mla:'O.S. Manian', mla_party:'DMK' },
  { id:'TN-14', district_id:'TN-CHN', state_id:'TN', number:14, name:'Egmore', reserved:'SC', current_mla:'K.N. Nehru', mla_party:'DMK' },
  { id:'TN-15', district_id:'TN-CHN', state_id:'TN', number:15, name:'Royapuram', current_mla:'N. Anbazhagan', mla_party:'DMK' },
  // Coimbatore (TN-CBE)
  { id:'TN-195', district_id:'TN-CBE', state_id:'TN', number:195, name:'Coimbatore North', current_mla:'Mayura S. Jayakumar', mla_party:'BJP' },
  { id:'TN-196', district_id:'TN-CBE', state_id:'TN', number:196, name:'Thondamuthur', current_mla:'Amman K. Arjunan', mla_party:'DMK' },
  { id:'TN-197', district_id:'TN-CBE', state_id:'TN', number:197, name:'Coimbatore South', current_mla:'Amman K. Arjunan', mla_party:'DMK' },
  { id:'TN-198', district_id:'TN-CBE', state_id:'TN', number:198, name:'Singanallur', current_mla:'N. Karthik', mla_party:'DMK' },
  { id:'TN-199', district_id:'TN-CBE', state_id:'TN', number:199, name:'Kinathukadavu', current_mla:'A. Thangamani', mla_party:'AIADMK' },
  { id:'TN-200', district_id:'TN-CBE', state_id:'TN', number:200, name:'Pollachi', current_mla:'K.P. Munusamy', mla_party:'AIADMK' },
  { id:'TN-201', district_id:'TN-CBE', state_id:'TN', number:201, name:'Valparai', reserved:'ST', current_mla:'S.A. Thomas', mla_party:'AIADMK' },
  // Madurai (TN-MDU)
  { id:'TN-165', district_id:'TN-MDU', state_id:'TN', number:165, name:'Melur', current_mla:'I. Periasami', mla_party:'DMK' },
  { id:'TN-166', district_id:'TN-MDU', state_id:'TN', number:166, name:'Madurai East', current_mla:'K.S. Ramanathan', mla_party:'INC' },
  { id:'TN-167', district_id:'TN-MDU', state_id:'TN', number:167, name:'Sholavandan', reserved:'SC', current_mla:'T.M. Anbarasan', mla_party:'DMK' },
  { id:'TN-168', district_id:'TN-MDU', state_id:'TN', number:168, name:'Madurai North', current_mla:'T. Palanivel Thiagarajan', mla_party:'DMK' },
  { id:'TN-169', district_id:'TN-MDU', state_id:'TN', number:169, name:'Madurai South', current_mla:'V.P.P. Saminathan', mla_party:'AIADMK' },
  { id:'TN-170', district_id:'TN-MDU', state_id:'TN', number:170, name:'Madurai Central', current_mla:'N. Kayalvizhi Selvaraj', mla_party:'DMK' },
  { id:'TN-171', district_id:'TN-MDU', state_id:'TN', number:171, name:'Madurai West', current_mla:'C. Vathanamgam', mla_party:'INC' },
  // Thoothukudi (TN-THV)
  { id:'TN-187', district_id:'TN-THV', state_id:'TN', number:187, name:'Ottapidaram', reserved:'SC', current_mla:'Kanimozhi', mla_party:'DMK' },
  { id:'TN-188', district_id:'TN-THV', state_id:'TN', number:188, name:'Thoothukudi', current_mla:'G. Jeevitha', mla_party:'INC' },
  { id:'TN-189', district_id:'TN-THV', state_id:'TN', number:189, name:'Tiruchendur', current_mla:'Anitha R. Radhakrishnan', mla_party:'AIADMK' },
  { id:'TN-190', district_id:'TN-THV', state_id:'TN', number:190, name:'Srivaikuntam', current_mla:'V.R. Sugumar', mla_party:'DMK' },
  { id:'TN-191', district_id:'TN-THV', state_id:'TN', number:191, name:'Kovilpatti', current_mla:'Bhagyaraj', mla_party:'AIADMK' },
  { id:'TN-192', district_id:'TN-THV', state_id:'TN', number:192, name:'Vilathikulam', reserved:'SC', current_mla:'R. Rajendran', mla_party:'DMK' },
];

// ─── KARNATAKA — 224 Assembly Seats (2023 election, INC majority) ────────────
const KA_ASSEMBLY: AssemblyConstituency[] = [
  // Bengaluru Urban (KA-BNU)
  { id:'KA-151', district_id:'KA-BNU', state_id:'KA', number:151, name:'Yelahanka', current_mla:'S.R. Vishwanath', mla_party:'BJP' },
  { id:'KA-152', district_id:'KA-BNU', state_id:'KA', number:152, name:'Byatarayanapura', current_mla:'M. Krishna Reddy', mla_party:'BJP' },
  { id:'KA-153', district_id:'KA-BNU', state_id:'KA', number:153, name:'Yeshvanthapura', current_mla:'S.T. Somashekhar', mla_party:'INC' },
  { id:'KA-154', district_id:'KA-BNU', state_id:'KA', number:154, name:'Dasarahalli', current_mla:'Manjunath', mla_party:'INC' },
  { id:'KA-155', district_id:'KA-BNU', state_id:'KA', number:155, name:'Mahalakshmi Layout', current_mla:'K.R. Ramesh Kumar', mla_party:'INC' },
  { id:'KA-156', district_id:'KA-BNU', state_id:'KA', number:156, name:'Malleshwaram', current_mla:'Ashwath Narayan C.N.', mla_party:'BJP' },
  { id:'KA-157', district_id:'KA-BNU', state_id:'KA', number:157, name:'Hebbal', current_mla:'Byrathi Suresh', mla_party:'INC' },
  { id:'KA-158', district_id:'KA-BNU', state_id:'KA', number:158, name:'Pulakeshinagar', reserved:'SC', current_mla:'R. Akhanda Srinivasa Murthy', mla_party:'INC' },
  { id:'KA-159', district_id:'KA-BNU', state_id:'KA', number:159, name:'Sarvagna Nagar', current_mla:'Bai Reddy', mla_party:'INC' },
  { id:'KA-160', district_id:'KA-BNU', state_id:'KA', number:160, name:'C.V. Raman Nagar', current_mla:'S. Raghu', mla_party:'BJP' },
  { id:'KA-161', district_id:'KA-BNU', state_id:'KA', number:161, name:'Shivajinagar', current_mla:'Rizwan Arshad', mla_party:'INC' },
  { id:'KA-162', district_id:'KA-BNU', state_id:'KA', number:162, name:'Shanti Nagar', current_mla:'N.A. Haris', mla_party:'INC' },
  { id:'KA-163', district_id:'KA-BNU', state_id:'KA', number:163, name:'Gandhi Nagar', current_mla:'Dinesh Gundu Rao', mla_party:'INC' },
  { id:'KA-164', district_id:'KA-BNU', state_id:'KA', number:164, name:'Rajajinagar', current_mla:'S. Suresh Kumar', mla_party:'BJP' },
  { id:'KA-165', district_id:'KA-BNU', state_id:'KA', number:165, name:'Govindaraja Nagar', current_mla:'Priya Krishna', mla_party:'INC' },
  { id:'KA-166', district_id:'KA-BNU', state_id:'KA', number:166, name:'Vijayanagar', current_mla:'M. Krishnappa', mla_party:'INC' },
  { id:'KA-167', district_id:'KA-BNU', state_id:'KA', number:167, name:'Chamrajapet', reserved:'SC', current_mla:'Zameer Ahmed Khan', mla_party:'INC' },
  { id:'KA-168', district_id:'KA-BNU', state_id:'KA', number:168, name:'Chickpet', current_mla:'Usman Gani', mla_party:'INC' },
  { id:'KA-169', district_id:'KA-BNU', state_id:'KA', number:169, name:'Basavanagudi', current_mla:'Sowmya Reddy', mla_party:'INC' },
  { id:'KA-170', district_id:'KA-BNU', state_id:'KA', number:170, name:'Padmanaba Nagar', current_mla:'R. Ashok', mla_party:'BJP' },
  { id:'KA-171', district_id:'KA-BNU', state_id:'KA', number:171, name:'BTM Layout', current_mla:'Ramalinga Reddy', mla_party:'INC' },
  { id:'KA-172', district_id:'KA-BNU', state_id:'KA', number:172, name:'Jayanagar', current_mla:'B.Z. Zameer Ahmed Khan', mla_party:'INC' },
  { id:'KA-173', district_id:'KA-BNU', state_id:'KA', number:173, name:'Bommanahalli', current_mla:'Satish Reddy', mla_party:'BJP' },
  { id:'KA-174', district_id:'KA-BNU', state_id:'KA', number:174, name:'Mahadevapura', current_mla:'Aravind Limbavali', mla_party:'BJP' },
  { id:'KA-175', district_id:'KA-BNU', state_id:'KA', number:175, name:'Krishnarajapuram', current_mla:'Byrathi Basavaraj', mla_party:'INC' },
  { id:'KA-176', district_id:'KA-BNU', state_id:'KA', number:176, name:'Bangalore East', current_mla:'B.N. Prahlad', mla_party:'INC' },
  { id:'KA-177', district_id:'KA-BNU', state_id:'KA', number:177, name:'Pulakeshinagar', reserved:'SC', current_mla:'R. Akhanda Srinivasa Murthy', mla_party:'INC' },
  // Mysuru (KA-MYS)
  { id:'KA-133', district_id:'KA-MYS', state_id:'KA', number:133, name:'Krishnaraja', current_mla:'S.A. Ramdas', mla_party:'INC' },
  { id:'KA-134', district_id:'KA-MYS', state_id:'KA', number:134, name:'Chamundeshwari', current_mla:'G.T. Devegowda', mla_party:'JD(S)' },
  { id:'KA-135', district_id:'KA-MYS', state_id:'KA', number:135, name:'Narasimharaja', reserved:'SC', current_mla:'Tanveer Sait', mla_party:'INC' },
  { id:'KA-136', district_id:'KA-MYS', state_id:'KA', number:136, name:'Chamaraja', current_mla:'C.S. Shadakshari', mla_party:'INC' },
  { id:'KA-137', district_id:'KA-MYS', state_id:'KA', number:137, name:'Varuna', current_mla:'Siddaramaiah', mla_party:'INC' },
  { id:'KA-138', district_id:'KA-MYS', state_id:'KA', number:138, name:'T. Narasipur', reserved:'SC', current_mla:'Harish Gowda', mla_party:'INC' },
];

// ─── MAHARASHTRA — 288 Assembly Seats (2024 election, Mahayuti majority) ────
const MH_ASSEMBLY: AssemblyConstituency[] = [
  // Mumbai City (MH-MUM)
  { id:'MH-1', district_id:'MH-MUM', state_id:'MH', number:1, name:'Colaba', current_mla:'Rahul Narwekar', mla_party:'BJP' },
  { id:'MH-2', district_id:'MH-MUM', state_id:'MH', number:2, name:'Malabar Hill', current_mla:'Mangal Prabhat Lodha', mla_party:'BJP' },
  { id:'MH-3', district_id:'MH-MUM', state_id:'MH', number:3, name:'Mumbadevi', current_mla:'Amin Patel', mla_party:'INC' },
  { id:'MH-4', district_id:'MH-MUM', state_id:'MH', number:4, name:'Shivdi', current_mla:'Ajay Chaudhari', mla_party:'UBT' },
  { id:'MH-5', district_id:'MH-MUM', state_id:'MH', number:5, name:'Worli', current_mla:'Aaditya Thackeray', mla_party:'UBT' },
  { id:'MH-6', district_id:'MH-MUM', state_id:'MH', number:6, name:'Mahim', current_mla:'Sada Sarvankar', mla_party:'Shiv Sena' },
  { id:'MH-7', district_id:'MH-MUM', state_id:'MH', number:7, name:'Dharavi', reserved:'SC', current_mla:'Milind Mane', mla_party:'Shiv Sena' },
  { id:'MH-8', district_id:'MH-MUM', state_id:'MH', number:8, name:'Sion Koliwada', current_mla:'Captain Tamilselvan', mla_party:'NCP' },
  { id:'MH-9', district_id:'MH-MUM', state_id:'MH', number:9, name:'Wadala', current_mla:'Kalidas Kolambkar', mla_party:'BJP' },
  { id:'MH-10', district_id:'MH-MUM', state_id:'MH', number:10, name:'Chembur', current_mla:'Tukaram Kate', mla_party:'Shiv Sena' },
  // Pune (MH-PUN)
  { id:'MH-153', district_id:'MH-PUN', state_id:'MH', number:153, name:'Junnar', current_mla:'Dilip Mohite-Patil', mla_party:'NCP' },
  { id:'MH-154', district_id:'MH-PUN', state_id:'MH', number:154, name:'Ambegaon', current_mla:'Dilip Walse-Patil', mla_party:'NCP' },
  { id:'MH-155', district_id:'MH-PUN', state_id:'MH', number:155, name:'Khed-Alandi', current_mla:'Dilip Mohite', mla_party:'NCP' },
  { id:'MH-156', district_id:'MH-PUN', state_id:'MH', number:156, name:'Shirur', current_mla:'Ashok Pawar', mla_party:'NCP' },
  { id:'MH-157', district_id:'MH-PUN', state_id:'MH', number:157, name:'Daund', current_mla:'Rachel D\'Souza', mla_party:'BJP' },
  { id:'MH-158', district_id:'MH-PUN', state_id:'MH', number:158, name:'Indapur', current_mla:'Harshwardhan Patil', mla_party:'NCP' },
  { id:'MH-159', district_id:'MH-PUN', state_id:'MH', number:159, name:'Baramati', current_mla:'Ajit Pawar', mla_party:'NCP' },
  { id:'MH-160', district_id:'MH-PUN', state_id:'MH', number:160, name:'Purandar', current_mla:'Vijay Shivtare', mla_party:'NCP' },
  { id:'MH-161', district_id:'MH-PUN', state_id:'MH', number:161, name:'Bhor', current_mla:'Sangram Thopte', mla_party:'INC' },
  { id:'MH-162', district_id:'MH-PUN', state_id:'MH', number:162, name:'Maval', current_mla:'Sunil Shelke', mla_party:'Shiv Sena' },
  { id:'MH-163', district_id:'MH-PUN', state_id:'MH', number:163, name:'Chinchwad', current_mla:'Ashwini Jagtap', mla_party:'BJP' },
  { id:'MH-164', district_id:'MH-PUN', state_id:'MH', number:164, name:'Pimpri', current_mla:'Anna Bansode', mla_party:'NCP' },
  { id:'MH-165', district_id:'MH-PUN', state_id:'MH', number:165, name:'Bhosari', current_mla:'Mahesh Landge', mla_party:'BJP' },
  { id:'MH-166', district_id:'MH-PUN', state_id:'MH', number:166, name:'Vadgaon Sheri', current_mla:'Sunil Tingre', mla_party:'NCP' },
  { id:'MH-167', district_id:'MH-PUN', state_id:'MH', number:167, name:'Shivajinagar', current_mla:'Siddharth Shirole', mla_party:'BJP' },
  { id:'MH-168', district_id:'MH-PUN', state_id:'MH', number:168, name:'Kothrud', current_mla:'Chandrakant Patil', mla_party:'BJP' },
  { id:'MH-169', district_id:'MH-PUN', state_id:'MH', number:169, name:'Khadakwasla', current_mla:'Bhimrao Tapkir', mla_party:'BJP' },
  { id:'MH-170', district_id:'MH-PUN', state_id:'MH', number:170, name:'Parvati', current_mla:'Madhuri Misal', mla_party:'BJP' },
  { id:'MH-171', district_id:'MH-PUN', state_id:'MH', number:171, name:'Hadapsar', current_mla:'Chetan Tupe', mla_party:'NCP' },
  { id:'MH-172', district_id:'MH-PUN', state_id:'MH', number:172, name:'Pune Cantonment', reserved:'SC', current_mla:'Sunil Kamble', mla_party:'BJP' },
  { id:'MH-173', district_id:'MH-PUN', state_id:'MH', number:173, name:'Kasba Peth', current_mla:'Hemant Rasane', mla_party:'BJP' },
  // Nagpur (MH-NGP)
  { id:'MH-56', district_id:'MH-NGP', state_id:'MH', number:56, name:'Katol', current_mla:'Anils Deshmukh', mla_party:'NCP' },
  { id:'MH-57', district_id:'MH-NGP', state_id:'MH', number:57, name:'Savner', current_mla:'Sanjay Pande', mla_party:'INC' },
  { id:'MH-58', district_id:'MH-NGP', state_id:'MH', number:58, name:'Hingna', reserved:'SC', current_mla:'Sameer Meghe', mla_party:'NCP' },
  { id:'MH-59', district_id:'MH-NGP', state_id:'MH', number:59, name:'Umred', reserved:'SC', current_mla:'Sudhir Parwe', mla_party:'BJP' },
  { id:'MH-60', district_id:'MH-NGP', state_id:'MH', number:60, name:'Nagpur South-West', current_mla:'Devendra Fadnavis', mla_party:'BJP' },
  { id:'MH-61', district_id:'MH-NGP', state_id:'MH', number:61, name:'Nagpur South', current_mla:'Mohan Mate', mla_party:'BJP' },
  { id:'MH-62', district_id:'MH-NGP', state_id:'MH', number:62, name:'Nagpur East', current_mla:'Krishan Khopde', mla_party:'BJP' },
  { id:'MH-63', district_id:'MH-NGP', state_id:'MH', number:63, name:'Nagpur Central', current_mla:'Vikas Kumbhare', mla_party:'BJP' },
  { id:'MH-64', district_id:'MH-NGP', state_id:'MH', number:64, name:'Nagpur West', current_mla:'Sudhakar Deshmukh', mla_party:'BJP' },
  { id:'MH-65', district_id:'MH-NGP', state_id:'MH', number:65, name:'Nagpur North', reserved:'SC', current_mla:'Nitin Raut', mla_party:'INC' },
  { id:'MH-66', district_id:'MH-NGP', state_id:'MH', number:66, name:'Kamthi', current_mla:'Chandrashekhar Bawankule', mla_party:'BJP' },
  { id:'MH-67', district_id:'MH-NGP', state_id:'MH', number:67, name:'Ramtek', reserved:'SC', current_mla:'Ashish Jaiswal', mla_party:'BJP' },
];

// ─── KERALA — 140 Assembly Seats (2021, LDF majority) ────────────────────────
const KL_ASSEMBLY: AssemblyConstituency[] = [
  { id:'KL-1', district_id:'KL-TRV', state_id:'KL', number:1, name:'Thiruvananthapuram', current_mla:'V.K. Prasanth', mla_party:'CPM' },
  { id:'KL-2', district_id:'KL-TRV', state_id:'KL', number:2, name:'Vattiyoorkavu', current_mla:'V.K. Prasanth', mla_party:'CPM' },
  { id:'KL-3', district_id:'KL-TRV', state_id:'KL', number:3, name:'Thrikkakara', current_mla:'P.T. Thomas', mla_party:'INC' },
  { id:'KL-4', district_id:'KL-TRV', state_id:'KL', number:4, name:'Kazhakkoottam', current_mla:'Kadakampally Surendran', mla_party:'CPM' },
  { id:'KL-5', district_id:'KL-TRV', state_id:'KL', number:5, name:'Nemom', current_mla:'O. Rajagopal', mla_party:'BJP' },
  { id:'KL-6', district_id:'KL-TRV', state_id:'KL', number:6, name:'Aruvikkara', current_mla:'G. Sivaprasad', mla_party:'INC' },
  { id:'KL-7', district_id:'KL-TRV', state_id:'KL', number:7, name:'Kattakada', reserved:'SC', current_mla:'I.B. Sathish', mla_party:'CPM' },
  // Ernakulam
  { id:'KL-38', district_id:'KL-ERN', state_id:'KL', number:38, name:'Thrikkakara', current_mla:'P.T. Thomas', mla_party:'INC' },
  { id:'KL-39', district_id:'KL-ERN', state_id:'KL', number:39, name:'Kalamassery', current_mla:'T.J. Vinoo', mla_party:'CPM' },
  { id:'KL-40', district_id:'KL-ERN', state_id:'KL', number:40, name:'Paravur', reserved:'SC', current_mla:'Eldhose Kunnappilly', mla_party:'INC' },
  { id:'KL-41', district_id:'KL-ERN', state_id:'KL', number:41, name:'Vypeen', current_mla:'C. Divakaran', mla_party:'CPM' },
  { id:'KL-42', district_id:'KL-ERN', state_id:'KL', number:42, name:'Ernakulam', current_mla:'T.J. Vinoo', mla_party:'CPM' },
  { id:'KL-43', district_id:'KL-ERN', state_id:'KL', number:43, name:'Thrippunithura', current_mla:'K. Babu', mla_party:'INC' },
  { id:'KL-44', district_id:'KL-ERN', state_id:'KL', number:44, name:'Aluva', current_mla:'Anwar Sadath', mla_party:'INC' },
  // Kozhikode
  { id:'KL-84', district_id:'KL-KZD', state_id:'KL', number:84, name:'Kozhikode North', current_mla:'Ahammad Devarkovil', mla_party:'IUML' },
  { id:'KL-85', district_id:'KL-KZD', state_id:'KL', number:85, name:'Kozhikode South', current_mla:'Thottathil Raveendran', mla_party:'CPM' },
  { id:'KL-86', district_id:'KL-KZD', state_id:'KL', number:86, name:'Beypore', current_mla:'V. Abdurahiman', mla_party:'IUML' },
  { id:'KL-87', district_id:'KL-KZD', state_id:'KL', number:87, name:'Elathur', current_mla:'P.T.A. Rahim', mla_party:'IUML' },
];

// ─── DELHI — 70 Assembly Seats (2025, BJP majority) ──────────────────────────
const DL_ASSEMBLY: AssemblyConstituency[] = [
  { id:'DL-1', district_id:'DL-CEN', state_id:'DL', number:1, name:'Chandni Chowk', current_mla:'Satish Kumar Agarwal', mla_party:'BJP' },
  { id:'DL-2', district_id:'DL-CEN', state_id:'DL', number:2, name:'Matia Mahal', current_mla:'Raees Ahmad', mla_party:'BJP' },
  { id:'DL-3', district_id:'DL-CEN', state_id:'DL', number:3, name:'Ballimaran', current_mla:'Imran Hussain', mla_party:'AAP' },
  { id:'DL-4', district_id:'DL-CEN', state_id:'DL', number:4, name:'Delhi Cantonment', current_mla:'Virender Singh Kadian', mla_party:'BJP' },
  { id:'DL-5', district_id:'DL-NOR', state_id:'DL', number:5, name:'Sadar Bazar', current_mla:'Som Dutt', mla_party:'BJP' },
  { id:'DL-6', district_id:'DL-NOR', state_id:'DL', number:6, name:'Model Town', current_mla:'Kapil Mishra', mla_party:'BJP' },
  { id:'DL-7', district_id:'DL-NOR', state_id:'DL', number:7, name:'Burari', current_mla:'Sanjiv Jha', mla_party:'AAP' },
  { id:'DL-8', district_id:'DL-NEA', state_id:'DL', number:8, name:'Mustafabad', current_mla:'Mohan Singh Bisht', mla_party:'BJP' },
  { id:'DL-9', district_id:'DL-NEA', state_id:'DL', number:9, name:'Karawal Nagar', current_mla:'Kapil Mishra', mla_party:'BJP' },
  { id:'DL-10', district_id:'DL-NEA', state_id:'DL', number:10, name:'Mustafabad', current_mla:'Adesh Gupta', mla_party:'BJP' },
  { id:'DL-40', district_id:'DL-NEW', state_id:'DL', number:40, name:'New Delhi', current_mla:'Parvesh Verma', mla_party:'BJP' },
  { id:'DL-54', district_id:'DL-SOU', state_id:'DL', number:54, name:'Kalkaji', reserved:'SC', current_mla:'Ramesh Bidhuri', mla_party:'BJP' },
  { id:'DL-58', district_id:'DL-SOU', state_id:'DL', number:58, name:'Tughlakabad', reserved:'SC', current_mla:'Sarita Singh', mla_party:'BJP' },
  { id:'DL-60', district_id:'DL-SOU', state_id:'DL', number:60, name:'Badarpur', current_mla:'Ram Singh Bidhuri', mla_party:'BJP' },
];

// ─── RAJASTHAN — key constituencies ──────────────────────────────────────────
const RJ_ASSEMBLY: AssemblyConstituency[] = [
  { id:'RJ-1', district_id:'RJ-JPR0', state_id:'RJ', number:1, name:'Vidhyadhar Nagar', current_mla:'Neeraj Dangi', mla_party:'INC' },
  { id:'RJ-2', district_id:'RJ-JPR0', state_id:'RJ', number:2, name:'Sikar Road', current_mla:'Rashmi Sharma', mla_party:'BJP' },
  { id:'RJ-3', district_id:'RJ-JPR0', state_id:'RJ', number:3, name:'Jhotwara', current_mla:'Rajendra Raghav', mla_party:'BJP' },
  { id:'RJ-4', district_id:'RJ-JPR0', state_id:'RJ', number:4, name:'Amer', current_mla:'Satish Poonia', mla_party:'BJP' },
  { id:'RJ-5', district_id:'RJ-JPR0', state_id:'RJ', number:5, name:'Jamwa Ramgarh', reserved:'SC', current_mla:'Babulal Verma', mla_party:'BJP' },
  { id:'RJ-6', district_id:'RJ-JPR0', state_id:'RJ', number:6, name:'Hawa Mahal', current_mla:'Bal Mukund Acharya', mla_party:'BJP' },
  { id:'RJ-7', district_id:'RJ-JPR0', state_id:'RJ', number:7, name:'Kishanpole', current_mla:'Archana Sharma', mla_party:'INC' },
  { id:'RJ-8', district_id:'RJ-JPR0', state_id:'RJ', number:8, name:'Civil Lines', current_mla:'Pratap Singh Singhvi', mla_party:'BJP' },
  { id:'RJ-9', district_id:'RJ-JPR0', state_id:'RJ', number:9, name:'Sanganer', current_mla:'Ashok Lahoty', mla_party:'BJP' },
  { id:'RJ-10', district_id:'RJ-JPR0', state_id:'RJ', number:10, name:'Bagru', reserved:'SC', current_mla:'Gabbar Singh', mla_party:'BJP' },
];

// ─── GUJARAT — key constituencies ─────────────────────────────────────────────
const GJ_ASSEMBLY: AssemblyConstituency[] = [
  { id:'GJ-1', district_id:'GJ-AHMD0', state_id:'GJ', number:1, name:'Ghatlodiya', current_mla:'Bhupendrabhai Patel', mla_party:'BJP' },
  { id:'GJ-2', district_id:'GJ-AHMD0', state_id:'GJ', number:2, name:'Ellisbridge', current_mla:'Rakesh Shah', mla_party:'BJP' },
  { id:'GJ-3', district_id:'GJ-AHMD0', state_id:'GJ', number:3, name:'Naranpura', current_mla:'Kaushik Jain', mla_party:'BJP' },
  { id:'GJ-4', district_id:'GJ-AHMD0', state_id:'GJ', number:4, name:'Nikol', current_mla:'Jagdish Patel', mla_party:'BJP' },
  { id:'GJ-5', district_id:'GJ-AHMD0', state_id:'GJ', number:5, name:'Bapunagar', reserved:'SC', current_mla:'Rajuben Machi Wala', mla_party:'BJP' },
  { id:'GJ-100', district_id:'GJ-GNDG0', state_id:'GJ', number:100, name:'Gandhinagar South', current_mla:'Amit Shah', mla_party:'BJP' },
  { id:'GJ-101', district_id:'GJ-GNDG0', state_id:'GJ', number:101, name:'Gandhinagar North', current_mla:'Ashok Patel', mla_party:'BJP' },
];

// ─── UTTAR PRADESH — key constituencies ──────────────────────────────────────
const UP_ASSEMBLY: AssemblyConstituency[] = [
  { id:'UP-1', district_id:'UP-LUC0', state_id:'UP', number:1, name:'Lucknow West', current_mla:'Suresh Kumar Srivastava', mla_party:'BJP' },
  { id:'UP-2', district_id:'UP-LUC0', state_id:'UP', number:2, name:'Lucknow North', current_mla:'Neeraj Bora', mla_party:'BJP' },
  { id:'UP-3', district_id:'UP-LUC0', state_id:'UP', number:3, name:'Lucknow East', current_mla:'Ashutosh Tandon', mla_party:'BJP' },
  { id:'UP-4', district_id:'UP-LUC0', state_id:'UP', number:4, name:'Lucknow Central', current_mla:'Ravi Das Mehrotra', mla_party:'BJP' },
  { id:'UP-5', district_id:'UP-LUC0', state_id:'UP', number:5, name:'Lucknow Cantonment', current_mla:'Brahma Shankar Tripathi', mla_party:'BJP' },
  { id:'UP-6', district_id:'UP-LUC0', state_id:'UP', number:6, name:'Sarojini Nagar', current_mla:'Rajeshwar Singh', mla_party:'BJP' },
  { id:'UP-7', district_id:'UP-VAR0', state_id:'UP', number:7, name:'Varanasi North', current_mla:'Ravi Kumar Gupta', mla_party:'BJP' },
  { id:'UP-8', district_id:'UP-VAR0', state_id:'UP', number:8, name:'Varanasi South', current_mla:'Anilkumar Agarwal', mla_party:'BJP' },
  { id:'UP-9', district_id:'UP-VAR0', state_id:'UP', number:9, name:'Varanasi Cantonment', current_mla:'Saurabh Srivastava', mla_party:'BJP' },
  { id:'UP-10', district_id:'UP-VAR0', state_id:'UP', number:10, name:'Varanasi Dakshin', current_mla:'Suneeta Singhal', mla_party:'BJP' },
  { id:'UP-100', district_id:'UP-AGR0', state_id:'UP', number:100, name:'Agra Cantt', current_mla:'G.S. Dharmesh', mla_party:'BJP' },
  { id:'UP-101', district_id:'UP-AGR0', state_id:'UP', number:101, name:'Agra South', current_mla:'Yogendra Upadhyay', mla_party:'BJP' },
  { id:'UP-102', district_id:'UP-AGR0', state_id:'UP', number:102, name:'Agra North', current_mla:'Purushottam Khandelwal', mla_party:'BJP' },
];

// ─── WEST BENGAL — key constituencies ────────────────────────────────────────
const WB_ASSEMBLY: AssemblyConstituency[] = [
  { id:'WB-1', district_id:'WB-KOL0', state_id:'WB', number:1, name:'Bhawanipore', current_mla:'Mamata Banerjee', mla_party:'TMC' },
  { id:'WB-2', district_id:'WB-KOL0', state_id:'WB', number:2, name:'Rashbehari', current_mla:'Debasish Kumar', mla_party:'TMC' },
  { id:'WB-3', district_id:'WB-KOL0', state_id:'WB', number:3, name:'Ballygunge', current_mla:'Babul Supriyo', mla_party:'TMC' },
  { id:'WB-4', district_id:'WB-KOL0', state_id:'WB', number:4, name:'Kasba', current_mla:'Javed Ahmed Khan', mla_party:'TMC' },
  { id:'WB-5', district_id:'WB-KOL0', state_id:'WB', number:5, name:'Chowrangee', current_mla:'Nayana Bandyopadhyay', mla_party:'TMC' },
  { id:'WB-6', district_id:'WB-KOL0', state_id:'WB', number:6, name:'Entally', current_mla:'Swarna Kamal Saha', mla_party:'TMC' },
  { id:'WB-7', district_id:'WB-KOL0', state_id:'WB', number:7, name:'Beleghata', current_mla:'Partha Chatterjee', mla_party:'TMC' },
  { id:'WB-8', district_id:'WB-KOL0', state_id:'WB', number:8, name:'Jorasanko', current_mla:'Vivek Gupta', mla_party:'TMC' },
  { id:'WB-9', district_id:'WB-KOL0', state_id:'WB', number:9, name:'Shyampukur', current_mla:'Shashi Panja', mla_party:'TMC' },
];

// ─── Consolidated index ───────────────────────────────────────────────────────
const ALL_ASSEMBLY: AssemblyConstituency[] = [
  ...TG_ASSEMBLY,
  ...AP_ASSEMBLY,
  ...TN_ASSEMBLY,
  ...KA_ASSEMBLY,
  ...MH_ASSEMBLY,
  ...KL_ASSEMBLY,
  ...DL_ASSEMBLY,
  ...RJ_ASSEMBLY,
  ...GJ_ASSEMBLY,
  ...UP_ASSEMBLY,
  ...WB_ASSEMBLY,
];

const BY_DISTRICT: Record<string, AssemblyConstituency[]> = {};
for (const seat of ALL_ASSEMBLY) {
  if (!BY_DISTRICT[seat.district_id]) BY_DISTRICT[seat.district_id] = [];
  BY_DISTRICT[seat.district_id].push(seat);
}

export function getAssemblyByDistrict(districtId: string): AssemblyConstituency[] {
  return (BY_DISTRICT[districtId] || []).sort((a, b) => a.number - b.number);
}

export function getAssemblyByState(stateId: string): AssemblyConstituency[] {
  return ALL_ASSEMBLY.filter(s => s.state_id === stateId).sort((a, b) => a.number - b.number);
}

export function hasRealData(districtId: string): boolean {
  return (BY_DISTRICT[districtId]?.length ?? 0) > 0;
}

// Party color map for quick badge styling
export const PARTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  INC:    { bg: '#1a4fd6', text: '#fff', border: '#1a4fd6' },
  BJP:    { bg: '#f97316', text: '#fff', border: '#ea580c' },
  DMK:    { bg: '#dc2626', text: '#fff', border: '#b91c1c' },
  AIADMK: { bg: '#1d4ed8', text: '#fcd34d', border: '#1e40af' },
  TDP:    { bg: '#f59e0b', text: '#1e1b4b', border: '#d97706' },
  YSRCP:  { bg: '#6d28d9', text: '#fff', border: '#5b21b6' },
  BRS:    { bg: '#b91c1c', text: '#fef9c3', border: '#991b1b' },
  AIMIM:  { bg: '#065f46', text: '#d1fae5', border: '#064e3b' },
  CPI:    { bg: '#dc2626', text: '#fff', border: '#b91c1c' },
  CPM:    { bg: '#991b1b', text: '#fef2f2', border: '#7f1d1d' },
  TMC:    { bg: '#1d4ed8', text: '#fff', border: '#1e40af' },
  AAP:    { bg: '#0891b2', text: '#fff', border: '#0e7490' },
  NCP:    { bg: '#7c3aed', text: '#fff', border: '#6d28d9' },
  'Shiv Sena': { bg: '#d97706', text: '#fff', border: '#b45309' },
  UBT:    { bg: '#dc2626', text: '#fbbf24', border: '#b91c1c' },
  'JD(S)': { bg: '#16a34a', text: '#fff', border: '#15803d' },
  IUML:   { bg: '#16a34a', text: '#fff', border: '#15803d' },
  PMK:    { bg: '#f59e0b', text: '#1e1b4b', border: '#d97706' },
  DEFAULT: { bg: '#475569', text: '#fff', border: '#334155' },
};

export function getPartyColor(party?: string) {
  return PARTY_COLORS[party || ''] ?? PARTY_COLORS.DEFAULT;
}
