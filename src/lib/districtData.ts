export interface DistrictInfo {
  id: string;
  state_id: string;
  name: string;
  headquarters: string;
  population?: number;
  area_km2?: number;
  mandals_count: number;
  assembly_seats: number;
  lok_sabha_seats: number;
}

export interface MandalInfo {
  id: string;
  district_id: string;
  name: string;
  type: 'mandal' | 'taluk' | 'block' | 'tehsil';
}

const DISTRICTS: Record<string, DistrictInfo[]> = {
  TG: [ // Telangana — 33 districts
    { id: 'TG-HYD', state_id: 'TG', name: 'Hyderabad', headquarters: 'Hyderabad', population: 3943323, area_km2: 217, mandals_count: 16, assembly_seats: 24, lok_sabha_seats: 2 },
    { id: 'TG-RNG', state_id: 'TG', name: 'Rangareddy', headquarters: 'Hyderabad', population: 5296396, area_km2: 5791, mandals_count: 34, assembly_seats: 14, lok_sabha_seats: 2 },
    { id: 'TG-MED', state_id: 'TG', name: 'Medchal-Malkajgiri', headquarters: 'Medchal', population: 3056290, area_km2: 1192, mandals_count: 14, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'TG-SAN', state_id: 'TG', name: 'Sangareddy', headquarters: 'Sangareddy', population: 1538 * 1000, area_km2: 4461, mandals_count: 38, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'TG-NLG', state_id: 'TG', name: 'Nalgonda', headquarters: 'Nalgonda', population: 1846645, area_km2: 3573, mandals_count: 23, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'TG-WAR', state_id: 'TG', name: 'Warangal Urban', headquarters: 'Warangal', population: 900000, area_km2: 406, mandals_count: 10, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-WRU', state_id: 'TG', name: 'Warangal Rural', headquarters: 'Warangal', population: 814000, area_km2: 2175, mandals_count: 14, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-KMM', state_id: 'TG', name: 'Karimnagar', headquarters: 'Karimnagar', population: 1025696, area_km2: 2379, mandals_count: 23, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'TG-KHM', state_id: 'TG', name: 'Khammam', headquarters: 'Khammam', population: 1401639, area_km2: 4066, mandals_count: 25, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'TG-MBN', state_id: 'TG', name: 'Mahabubnagar', headquarters: 'Mahabubnagar', population: 1200000, area_km2: 3965, mandals_count: 25, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'TG-NZB', state_id: 'TG', name: 'Nizamabad', headquarters: 'Nizamabad', population: 1138000, area_km2: 3255, mandals_count: 22, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'TG-ADL', state_id: 'TG', name: 'Adilabad', headquarters: 'Adilabad', population: 708000, area_km2: 4178, mandals_count: 19, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-SDB', state_id: 'TG', name: 'Siddipet', headquarters: 'Siddipet', population: 895000, area_km2: 3722, mandals_count: 27, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'TG-JGT', state_id: 'TG', name: 'Jagitial', headquarters: 'Jagitial', population: 680000, area_km2: 2185, mandals_count: 18, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-PED', state_id: 'TG', name: 'Peddapalli', headquarters: 'Peddapalli', population: 620000, area_km2: 2474, mandals_count: 16, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-RJN', state_id: 'TG', name: 'Rajanna Sircilla', headquarters: 'Sircilla', population: 546000, area_km2: 1843, mandals_count: 12, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-VKR', state_id: 'TG', name: 'Vikarabad', headquarters: 'Vikarabad', population: 855000, area_km2: 3386, mandals_count: 21, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-SRY', state_id: 'TG', name: 'Suryapet', headquarters: 'Suryapet', population: 1035000, area_km2: 3376, mandals_count: 27, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-YDB', state_id: 'TG', name: 'Yadadri Bhuvanagiri', headquarters: 'Bhongir', population: 823000, area_km2: 3127, mandals_count: 18, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-JNG', state_id: 'TG', name: 'Jangaon', headquarters: 'Jangaon', population: 535000, area_km2: 2187, mandals_count: 12, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-MHB', state_id: 'TG', name: 'Mahabubabad', headquarters: 'Mahabubabad', population: 763000, area_km2: 2875, mandals_count: 16, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-BHD', state_id: 'TG', name: 'Bhadradri Kothagudem', headquarters: 'Kothagudem', population: 1000000, area_km2: 7483, mandals_count: 22, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'TG-MLP', state_id: 'TG', name: 'Mulugu', headquarters: 'Mulugu', population: 272000, area_km2: 3770, mandals_count: 8, assembly_seats: 2, lok_sabha_seats: 1 },
    { id: 'TG-NBD', state_id: 'TG', name: 'Narayanpet', headquarters: 'Narayanpet', population: 480000, area_km2: 3079, mandals_count: 15, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-WNA', state_id: 'TG', name: 'Wanaparthy', headquarters: 'Wanaparthy', population: 710000, area_km2: 2664, mandals_count: 15, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-GAD', state_id: 'TG', name: 'Gadwal', headquarters: 'Gadwal', population: 680000, area_km2: 2928, mandals_count: 15, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-KMN', state_id: 'TG', name: 'Kamareddy', headquarters: 'Kamareddy', population: 960000, area_km2: 3643, mandals_count: 21, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-NRD', state_id: 'TG', name: 'Nirmal', headquarters: 'Nirmal', population: 707000, area_km2: 3087, mandals_count: 18, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-MNC', state_id: 'TG', name: 'Mancherial', headquarters: 'Mancherial', population: 802000, area_km2: 4061, mandals_count: 17, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TG-KMD', state_id: 'TG', name: 'Kumuram Bheem Asifabad', headquarters: 'Asifabad', population: 577000, area_km2: 4508, mandals_count: 15, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-HYN', state_id: 'TG', name: 'Hanamkonda', headquarters: 'Hanamkonda', population: 739000, area_km2: 757, mandals_count: 9, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-NBD2', state_id: 'TG', name: 'Narayanpet', headquarters: 'Narayanpet', population: 450000, area_km2: 3079, mandals_count: 14, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'TG-MDK', state_id: 'TG', name: 'Medak', headquarters: 'Medak', population: 771000, area_km2: 3128, mandals_count: 26, assembly_seats: 5, lok_sabha_seats: 1 },
  ],

  AP: [ // Andhra Pradesh — 26 districts
    { id: 'AP-VSK', state_id: 'AP', name: 'Visakhapatnam', headquarters: 'Visakhapatnam', population: 5340496, area_km2: 6539, mandals_count: 67, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'AP-EGT', state_id: 'AP', name: 'East Godavari', headquarters: 'Kakinada', population: 5288047, area_km2: 10807, mandals_count: 64, assembly_seats: 14, lok_sabha_seats: 3 },
    { id: 'AP-WGT', state_id: 'AP', name: 'West Godavari', headquarters: 'Eluru', population: 3934782, area_km2: 7742, mandals_count: 46, assembly_seats: 14, lok_sabha_seats: 2 },
    { id: 'AP-KRS', state_id: 'AP', name: 'Krishna', headquarters: 'Machilipatnam', population: 4529009, area_km2: 8727, mandals_count: 50, assembly_seats: 14, lok_sabha_seats: 3 },
    { id: 'AP-GNT', state_id: 'AP', name: 'Guntur', headquarters: 'Guntur', population: 4889230, area_km2: 11391, mandals_count: 57, assembly_seats: 16, lok_sabha_seats: 3 },
    { id: 'AP-PKM', state_id: 'AP', name: 'Prakasam', headquarters: 'Ongole', population: 3392764, area_km2: 17626, mandals_count: 56, assembly_seats: 12, lok_sabha_seats: 2 },
    { id: 'AP-NPT', state_id: 'AP', name: 'Nellore', headquarters: 'Nellore', population: 2966082, area_km2: 13076, mandals_count: 46, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'AP-CTR', state_id: 'AP', name: 'Chittoor', headquarters: 'Chittoor', population: 4170468, area_km2: 15152, mandals_count: 66, assembly_seats: 14, lok_sabha_seats: 3 },
    { id: 'AP-KDP', state_id: 'AP', name: 'YSR Kadapa', headquarters: 'Kadapa', population: 2884524, area_km2: 15379, mandals_count: 50, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'AP-KNL', state_id: 'AP', name: 'Kurnool', headquarters: 'Kurnool', population: 4046601, area_km2: 17658, mandals_count: 54, assembly_seats: 14, lok_sabha_seats: 3 },
    { id: 'AP-ANT', state_id: 'AP', name: 'Anantapur', headquarters: 'Anantapur', population: 4083315, area_km2: 19130, mandals_count: 63, assembly_seats: 14, lok_sabha_seats: 3 },
    { id: 'AP-VZM', state_id: 'AP', name: 'Vizianagaram', headquarters: 'Vizianagaram', population: 2344474, area_km2: 6539, mandals_count: 34, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'AP-SRI', state_id: 'AP', name: 'Srikakulam', headquarters: 'Srikakulam', population: 2699471, area_km2: 5837, mandals_count: 37, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'AP-AMB', state_id: 'AP', name: 'Amaravati', headquarters: 'Amaravati', population: 1500000, area_km2: 2000, mandals_count: 30, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'AP-ALR', state_id: 'AP', name: 'Alluri Sitarama Raju', headquarters: 'Paderu', population: 1000000, area_km2: 10000, mandals_count: 25, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'AP-PRK', state_id: 'AP', name: 'Parvathipuram Manyam', headquarters: 'Parvathipuram', population: 600000, area_km2: 7734, mandals_count: 14, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'AP-BCK', state_id: 'AP', name: 'Bapatla', headquarters: 'Bapatla', population: 1600000, area_km2: 3956, mandals_count: 19, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'AP-ELR', state_id: 'AP', name: 'Eluru', headquarters: 'Eluru', population: 2000000, area_km2: 4956, mandals_count: 24, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'AP-NVR', state_id: 'AP', name: 'NTR', headquarters: 'Vijayawada', population: 2500000, area_km2: 3889, mandals_count: 25, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'AP-PKS', state_id: 'AP', name: 'Palnadu', headquarters: 'Narasaraopet', population: 1500000, area_km2: 6901, mandals_count: 24, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'AP-ANM', state_id: 'AP', name: 'Anakapalle', headquarters: 'Anakapalle', population: 2000000, area_km2: 3352, mandals_count: 28, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'AP-KKD', state_id: 'AP', name: 'Kakinada', headquarters: 'Kakinada', population: 2200000, area_km2: 3713, mandals_count: 30, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'AP-KNP', state_id: 'AP', name: 'Konaseema', headquarters: 'Amalapuram', population: 1200000, area_km2: 2802, mandals_count: 21, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'AP-MSP', state_id: 'AP', name: 'Manyam', headquarters: 'Parvathipuram', population: 500000, area_km2: 5733, mandals_count: 11, assembly_seats: 2, lok_sabha_seats: 1 },
    { id: 'AP-TRP', state_id: 'AP', name: 'Tirupati', headquarters: 'Tirupati', population: 1800000, area_km2: 5148, mandals_count: 30, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'AP-SRP', state_id: 'AP', name: 'Sri Sathya Sai', headquarters: 'Puttaparthi', population: 1400000, area_km2: 6807, mandals_count: 30, assembly_seats: 5, lok_sabha_seats: 1 },
  ],

  MH: [ // Maharashtra — 36 districts
    { id: 'MH-MUM', state_id: 'MH', name: 'Mumbai City', headquarters: 'Mumbai', population: 3085411, area_km2: 68, mandals_count: 24, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'MH-MUS', state_id: 'MH', name: 'Mumbai Suburban', headquarters: 'Mumbai', population: 9356962, area_km2: 446, mandals_count: 3, assembly_seats: 26, lok_sabha_seats: 4 },
    { id: 'MH-THN', state_id: 'MH', name: 'Thane', headquarters: 'Thane', population: 11060148, area_km2: 9558, mandals_count: 15, assembly_seats: 18, lok_sabha_seats: 4 },
    { id: 'MH-PUN', state_id: 'MH', name: 'Pune', headquarters: 'Pune', population: 9429408, area_km2: 15643, mandals_count: 15, assembly_seats: 21, lok_sabha_seats: 4 },
    { id: 'MH-NGP', state_id: 'MH', name: 'Nagpur', headquarters: 'Nagpur', population: 4653570, area_km2: 9892, mandals_count: 14, assembly_seats: 12, lok_sabha_seats: 2 },
    { id: 'MH-NSK', state_id: 'MH', name: 'Nashik', headquarters: 'Nashik', population: 6107187, area_km2: 15530, mandals_count: 15, assembly_seats: 15, lok_sabha_seats: 3 },
    { id: 'MH-AUR', state_id: 'MH', name: 'Aurangabad', headquarters: 'Aurangabad', population: 3695928, area_km2: 10100, mandals_count: 9, assembly_seats: 9, lok_sabha_seats: 2 },
    { id: 'MH-SLR', state_id: 'MH', name: 'Solapur', headquarters: 'Solapur', population: 4317756, area_km2: 14895, mandals_count: 11, assembly_seats: 11, lok_sabha_seats: 2 },
    { id: 'MH-KLP', state_id: 'MH', name: 'Kolhapur', headquarters: 'Kolhapur', population: 3876001, area_km2: 7685, mandals_count: 12, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'MH-NND', state_id: 'MH', name: 'Nanded', headquarters: 'Nanded', population: 3361292, area_km2: 10528, mandals_count: 16, assembly_seats: 9, lok_sabha_seats: 2 },
    { id: 'MH-AMD', state_id: 'MH', name: 'Ahmadnagar', headquarters: 'Ahmadnagar', population: 4543159, area_km2: 17048, mandals_count: 14, assembly_seats: 12, lok_sabha_seats: 3 },
    { id: 'MH-RTN', state_id: 'MH', name: 'Ratnagiri', headquarters: 'Ratnagiri', population: 1615069, area_km2: 8208, mandals_count: 9, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'MH-SNG', state_id: 'MH', name: 'Sangli', headquarters: 'Sangli', population: 2820575, area_km2: 8572, mandals_count: 11, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'MH-STA', state_id: 'MH', name: 'Satara', headquarters: 'Satara', population: 3003741, area_km2: 10480, mandals_count: 11, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'MH-RGD', state_id: 'MH', name: 'Raigad', headquarters: 'Alibag', population: 2634200, area_km2: 7152, mandals_count: 15, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'MH-AMR', state_id: 'MH', name: 'Amravati', headquarters: 'Amravati', population: 2887826, area_km2: 12235, mandals_count: 14, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'MH-AKL', state_id: 'MH', name: 'Akola', headquarters: 'Akola', population: 1818617, area_km2: 5431, mandals_count: 7, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'MH-WRD', state_id: 'MH', name: 'Wardha', headquarters: 'Wardha', population: 1300774, area_km2: 6310, mandals_count: 8, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'MH-YTL', state_id: 'MH', name: 'Yavatmal', headquarters: 'Yavatmal', population: 2772348, area_km2: 13582, mandals_count: 16, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'MH-CNR', state_id: 'MH', name: 'Chandrapur', headquarters: 'Chandrapur', population: 2204307, area_km2: 11443, mandals_count: 15, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'MH-GDC', state_id: 'MH', name: 'Gadchiroli', headquarters: 'Gadchiroli', population: 1072942, area_km2: 14412, mandals_count: 12, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'MH-LTR', state_id: 'MH', name: 'Latur', headquarters: 'Latur', population: 2454196, area_km2: 7157, mandals_count: 10, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'MH-OSM', state_id: 'MH', name: 'Osmanabad', headquarters: 'Osmanabad', population: 1657576, area_km2: 7569, mandals_count: 8, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'MH-BID', state_id: 'MH', name: 'Beed', headquarters: 'Beed', population: 2585049, area_km2: 10693, mandals_count: 11, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'MH-HNG', state_id: 'MH', name: 'Hingoli', headquarters: 'Hingoli', population: 1177345, area_km2: 4526, mandals_count: 5, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'MH-PBN', state_id: 'MH', name: 'Parbhani', headquarters: 'Parbhani', population: 1836086, area_km2: 6511, mandals_count: 9, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'MH-JLN', state_id: 'MH', name: 'Jalna', headquarters: 'Jalna', population: 1959046, area_km2: 7612, mandals_count: 8, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'MH-BLR', state_id: 'MH', name: 'Buldhana', headquarters: 'Buldhana', population: 2585049, area_km2: 9661, mandals_count: 13, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'MH-WSM', state_id: 'MH', name: 'Washim', headquarters: 'Washim', population: 1196714, area_km2: 5152, mandals_count: 6, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'MH-BHN', state_id: 'MH', name: 'Bhandara', headquarters: 'Bhandara', population: 1198810, area_km2: 3717, mandals_count: 7, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'MH-GND', state_id: 'MH', name: 'Gondia', headquarters: 'Gondia', population: 1322507, area_km2: 5234, mandals_count: 8, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'MH-SNW', state_id: 'MH', name: 'Sindhudurg', headquarters: 'Oras', population: 849651, area_km2: 5207, mandals_count: 8, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'MH-DHL', state_id: 'MH', name: 'Dhule', headquarters: 'Dhule', population: 2048781, area_km2: 7195, mandals_count: 8, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'MH-NDR', state_id: 'MH', name: 'Nandurbar', headquarters: 'Nandurbar', population: 1648295, area_km2: 5955, mandals_count: 6, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'MH-JLG', state_id: 'MH', name: 'Jalgaon', headquarters: 'Jalgaon', population: 4224442, area_km2: 11765, mandals_count: 15, assembly_seats: 11, lok_sabha_seats: 2 },
    { id: 'MH-PMB', state_id: 'MH', name: 'Palghar', headquarters: 'Palghar', population: 2990116, area_km2: 5344, mandals_count: 8, assembly_seats: 6, lok_sabha_seats: 1 },
  ],

  UP: [ // Uttar Pradesh — key districts (75 total)
    { id: 'UP-LKW', state_id: 'UP', name: 'Lucknow', headquarters: 'Lucknow', population: 4589838, area_km2: 2528, mandals_count: 8, assembly_seats: 9, lok_sabha_seats: 1 },
    { id: 'UP-AGR', state_id: 'UP', name: 'Agra', headquarters: 'Agra', population: 4418797, area_km2: 4027, mandals_count: 6, assembly_seats: 9, lok_sabha_seats: 2 },
    { id: 'UP-VNS', state_id: 'UP', name: 'Varanasi', headquarters: 'Varanasi', population: 3676841, area_km2: 1535, mandals_count: 8, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'UP-KNP', state_id: 'UP', name: 'Kanpur Nagar', headquarters: 'Kanpur', population: 4572951, area_km2: 3155, mandals_count: 10, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'UP-PRY', state_id: 'UP', name: 'Prayagraj', headquarters: 'Prayagraj', population: 5954391, area_km2: 7112, mandals_count: 20, assembly_seats: 12, lok_sabha_seats: 2 },
    { id: 'UP-GZB', state_id: 'UP', name: 'Ghaziabad', headquarters: 'Ghaziabad', population: 4681645, area_km2: 1179, mandals_count: 5, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'UP-NID', state_id: 'UP', name: 'Gautam Buddh Nagar', headquarters: 'Greater Noida', population: 1674714, area_km2: 1269, mandals_count: 3, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'UP-MRT', state_id: 'UP', name: 'Meerut', headquarters: 'Meerut', population: 3443689, area_km2: 2590, mandals_count: 5, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'UP-GRP', state_id: 'UP', name: 'Gorakhpur', headquarters: 'Gorakhpur', population: 4440895, area_km2: 3325, mandals_count: 19, assembly_seats: 9, lok_sabha_seats: 2 },
    { id: 'UP-ALG', state_id: 'UP', name: 'Aligarh', headquarters: 'Aligarh', population: 3673849, area_km2: 3747, mandals_count: 12, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'UP-MDR', state_id: 'UP', name: 'Moradabad', headquarters: 'Moradabad', population: 4772006, area_km2: 3718, mandals_count: 10, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'UP-SHJ', state_id: 'UP', name: 'Shahjahanpur', headquarters: 'Shahjahanpur', population: 3006538, area_km2: 4575, mandals_count: 15, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'UP-IZT', state_id: 'UP', name: 'Gonda', headquarters: 'Gonda', population: 3433919, area_km2: 4425, mandals_count: 16, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'UP-BRL', state_id: 'UP', name: 'Bareilly', headquarters: 'Bareilly', population: 4448359, area_km2: 4120, mandals_count: 15, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'UP-FZB', state_id: 'UP', name: 'Faizabad', headquarters: 'Ayodhya', population: 2470996, area_km2: 2765, mandals_count: 9, assembly_seats: 5, lok_sabha_seats: 1 },
  ],

  KA: [ // Karnataka — 31 districts
    { id: 'KA-BLR', state_id: 'KA', name: 'Bengaluru Urban', headquarters: 'Bengaluru', population: 9621551, area_km2: 2190, mandals_count: 4, assembly_seats: 28, lok_sabha_seats: 4 },
    { id: 'KA-BLR2', state_id: 'KA', name: 'Bengaluru Rural', headquarters: 'Bengaluru', population: 990923, area_km2: 2260, mandals_count: 4, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'KA-MYR', state_id: 'KA', name: 'Mysuru', headquarters: 'Mysuru', population: 3001127, area_km2: 6854, mandals_count: 7, assembly_seats: 11, lok_sabha_seats: 2 },
    { id: 'KA-HVR', state_id: 'KA', name: 'Haveri', headquarters: 'Haveri', population: 1598506, area_km2: 4843, mandals_count: 7, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'KA-BGM', state_id: 'KA', name: 'Belagavi', headquarters: 'Belagavi', population: 4779661, area_km2: 13415, mandals_count: 10, assembly_seats: 18, lok_sabha_seats: 2 },
    { id: 'KA-KLG', state_id: 'KA', name: 'Kalaburagi', headquarters: 'Kalaburagi', population: 2564892, area_km2: 10951, mandals_count: 11, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'KA-MNG', state_id: 'KA', name: 'Dakshina Kannada', headquarters: 'Mangaluru', population: 2083625, area_km2: 4560, mandals_count: 6, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'KA-UDU', state_id: 'KA', name: 'Udupi', headquarters: 'Udupi', population: 1177908, area_km2: 3575, mandals_count: 3, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'KA-HBL', state_id: 'KA', name: 'Dharwad', headquarters: 'Dharwad', population: 1846993, area_km2: 4260, mandals_count: 5, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'KA-TUM', state_id: 'KA', name: 'Tumakuru', headquarters: 'Tumakuru', population: 2678980, area_km2: 10598, mandals_count: 10, assembly_seats: 11, lok_sabha_seats: 2 },
    { id: 'KA-BDR', state_id: 'KA', name: 'Bidar', headquarters: 'Bidar', population: 1700018, area_km2: 5448, mandals_count: 5, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'KA-RCR', state_id: 'KA', name: 'Raichur', headquarters: 'Raichur', population: 1924773, area_km2: 6827, mandals_count: 5, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'KA-KPL', state_id: 'KA', name: 'Koppal', headquarters: 'Koppal', population: 1391292, area_km2: 5592, mandals_count: 4, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'KA-GTG', state_id: 'KA', name: 'Gadag', headquarters: 'Gadag', population: 1065235, area_km2: 4657, mandals_count: 5, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'KA-VJP', state_id: 'KA', name: 'Vijayapura', headquarters: 'Vijayapura', population: 2175102, area_km2: 10541, mandals_count: 5, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'KA-BGK', state_id: 'KA', name: 'Bagalkot', headquarters: 'Bagalkot', population: 1890370, area_km2: 6575, mandals_count: 6, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'KA-CHK', state_id: 'KA', name: 'Chamarajanagara', headquarters: 'Chamarajanagara', population: 1018500, area_km2: 5101, mandals_count: 4, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'KA-MDG', state_id: 'KA', name: 'Mandya', headquarters: 'Mandya', population: 1805769, area_km2: 4961, mandals_count: 7, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'KA-HSN', state_id: 'KA', name: 'Hassan', headquarters: 'Hassan', population: 1777523, area_km2: 6814, mandals_count: 8, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'KA-CHK2', state_id: 'KA', name: 'Chikkamagaluru', headquarters: 'Chikkamagaluru', population: 1137961, area_km2: 7201, mandals_count: 7, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'KA-SKR', state_id: 'KA', name: 'Shivamogga', headquarters: 'Shivamogga', population: 1755512, area_km2: 8480, mandals_count: 6, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'KA-KDG', state_id: 'KA', name: 'Kodagu', headquarters: 'Madikeri', population: 554519, area_km2: 4102, mandals_count: 3, assembly_seats: 2, lok_sabha_seats: 1 },
    { id: 'KA-CHB', state_id: 'KA', name: 'Chikkaballapura', headquarters: 'Chikkaballapura', population: 1254494, area_km2: 4199, mandals_count: 6, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'KA-KGR', state_id: 'KA', name: 'Kolar', headquarters: 'Kolar', population: 1536401, area_km2: 3969, mandals_count: 5, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'KA-RAM', state_id: 'KA', name: 'Ramanagara', headquarters: 'Ramanagara', population: 1082739, area_km2: 3558, mandals_count: 4, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'KA-YDG', state_id: 'KA', name: 'Yadgir', headquarters: 'Yadgir', population: 1172985, area_km2: 5304, mandals_count: 3, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'KA-VTG', state_id: 'KA', name: 'Vijayanagara', headquarters: 'Hosapete', population: 1200000, area_km2: 5000, mandals_count: 5, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'KA-BBT', state_id: 'KA', name: 'Ballari', headquarters: 'Ballari', population: 2532383, area_km2: 8419, mandals_count: 5, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'KA-DWD', state_id: 'KA', name: 'Davanagere', headquarters: 'Davanagere', population: 1946905, area_km2: 5924, mandals_count: 6, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'KA-CLK', state_id: 'KA', name: 'Chickballapur', headquarters: 'Chickballapur', population: 1200000, area_km2: 3300, mandals_count: 6, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'KA-UKK', state_id: 'KA', name: 'Uttara Kannada', headquarters: 'Karwar', population: 1437169, area_km2: 10291, mandals_count: 11, assembly_seats: 5, lok_sabha_seats: 1 },
  ],

  TN: [ // Tamil Nadu — 38 districts
    { id: 'TN-CHN', state_id: 'TN', name: 'Chennai', headquarters: 'Chennai', population: 7088000, area_km2: 426, mandals_count: 15, assembly_seats: 18, lok_sabha_seats: 4 },
    { id: 'TN-CBE', state_id: 'TN', name: 'Coimbatore', headquarters: 'Coimbatore', population: 3458045, area_km2: 7469, mandals_count: 12, assembly_seats: 11, lok_sabha_seats: 2 },
    { id: 'TN-MDR', state_id: 'TN', name: 'Madurai', headquarters: 'Madurai', population: 3038252, area_km2: 3741, mandals_count: 13, assembly_seats: 9, lok_sabha_seats: 2 },
    { id: 'TN-TRU', state_id: 'TN', name: 'Tiruchirappalli', headquarters: 'Trichy', population: 2722290, area_km2: 4403, mandals_count: 14, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'TN-SLM', state_id: 'TN', name: 'Salem', headquarters: 'Salem', population: 3482056, area_km2: 5245, mandals_count: 13, assembly_seats: 10, lok_sabha_seats: 2 },
    { id: 'TN-TIR', state_id: 'TN', name: 'Tirunelveli', headquarters: 'Tirunelveli', population: 3072880, area_km2: 6823, mandals_count: 19, assembly_seats: 9, lok_sabha_seats: 2 },
    { id: 'TN-ERD', state_id: 'TN', name: 'Erode', headquarters: 'Erode', population: 2251744, area_km2: 5714, mandals_count: 12, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'TN-TVL', state_id: 'TN', name: 'Tiruvannamalai', headquarters: 'Tiruvannamalai', population: 2464875, area_km2: 6191, mandals_count: 20, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'TN-VLR', state_id: 'TN', name: 'Vellore', headquarters: 'Vellore', population: 3936331, area_km2: 5919, mandals_count: 20, assembly_seats: 8, lok_sabha_seats: 2 },
    { id: 'TN-KCH', state_id: 'TN', name: 'Kanchipuram', headquarters: 'Kanchipuram', population: 3998252, area_km2: 4432, mandals_count: 13, assembly_seats: 12, lok_sabha_seats: 2 },
    { id: 'TN-DIN', state_id: 'TN', name: 'Dindigul', headquarters: 'Dindigul', population: 2159775, area_km2: 6266, mandals_count: 13, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'TN-TNJ', state_id: 'TN', name: 'Thanjavur', headquarters: 'Thanjavur', population: 2402781, area_km2: 3397, mandals_count: 14, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'TN-KNY', state_id: 'TN', name: 'Kanyakumari', headquarters: 'Nagercoil', population: 1870374, area_km2: 1672, mandals_count: 9, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'TN-VPR', state_id: 'TN', name: 'Virudhunagar', headquarters: 'Virudhunagar', population: 1942288, area_km2: 4283, mandals_count: 12, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'TN-RMN', state_id: 'TN', name: 'Ramanathapuram', headquarters: 'Ramanathapuram', population: 1353445, area_km2: 4175, mandals_count: 12, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'TN-DMK', state_id: 'TN', name: 'Dharmapuri', headquarters: 'Dharmapuri', population: 1507905, area_km2: 4497, mandals_count: 8, assembly_seats: 5, lok_sabha_seats: 1 },
    { id: 'TN-NMK', state_id: 'TN', name: 'Namakkal', headquarters: 'Namakkal', population: 1726601, area_km2: 3418, mandals_count: 9, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'TN-THV', state_id: 'TN', name: 'Thoothukudi', headquarters: 'Thoothukudi', population: 1750176, area_km2: 4621, mandals_count: 13, assembly_seats: 6, lok_sabha_seats: 1 },
    { id: 'TN-THP', state_id: 'TN', name: 'Theni', headquarters: 'Theni', population: 1243643, area_km2: 3243, mandals_count: 7, assembly_seats: 4, lok_sabha_seats: 1 },
    { id: 'TN-NGL', state_id: 'TN', name: 'Nagapattinam', headquarters: 'Nagapattinam', population: 1616450, area_km2: 2787, mandals_count: 13, assembly_seats: 5, lok_sabha_seats: 1 },
  ],

  DL: [ // Delhi — 11 districts
    { id: 'DL-CEN', state_id: 'DL', name: 'Central Delhi', headquarters: 'Chandni Chowk', population: 582320, area_km2: 25, mandals_count: 6, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'DL-EAS', state_id: 'DL', name: 'East Delhi', headquarters: 'Preet Vihar', population: 1707725, area_km2: 64, mandals_count: 5, assembly_seats: 10, lok_sabha_seats: 1 },
    { id: 'DL-NOR', state_id: 'DL', name: 'North Delhi', headquarters: 'Sadar Bazar', population: 887978, area_km2: 60, mandals_count: 5, assembly_seats: 7, lok_sabha_seats: 1 },
    { id: 'DL-NEA', state_id: 'DL', name: 'North-East Delhi', headquarters: 'Nand Nagri', population: 2238034, area_km2: 60, mandals_count: 5, assembly_seats: 10, lok_sabha_seats: 1 },
    { id: 'DL-NWD', state_id: 'DL', name: 'North-West Delhi', headquarters: 'Rohini', population: 3654160, area_km2: 441, mandals_count: 5, assembly_seats: 12, lok_sabha_seats: 1 },
    { id: 'DL-NEW', state_id: 'DL', name: 'New Delhi', headquarters: 'Connaught Place', population: 142004, area_km2: 35, mandals_count: 3, assembly_seats: 3, lok_sabha_seats: 1 },
    { id: 'DL-SHD', state_id: 'DL', name: 'Shahdara', headquarters: 'Shahdara', population: 1693210, area_km2: 66, mandals_count: 3, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'DL-SOU', state_id: 'DL', name: 'South Delhi', headquarters: 'Kalkaji', population: 2731929, area_km2: 250, mandals_count: 5, assembly_seats: 10, lok_sabha_seats: 1 },
    { id: 'DL-SEA', state_id: 'DL', name: 'South-East Delhi', headquarters: 'Lajpat Nagar', population: 1749944, area_km2: 102, mandals_count: 4, assembly_seats: 8, lok_sabha_seats: 1 },
    { id: 'DL-SWD', state_id: 'DL', name: 'South-West Delhi', headquarters: 'Dwarka', population: 2292958, area_km2: 420, mandals_count: 4, assembly_seats: 10, lok_sabha_seats: 1 },
    { id: 'DL-WES', state_id: 'DL', name: 'West Delhi', headquarters: 'Janakpuri', population: 2543243, area_km2: 129, mandals_count: 4, assembly_seats: 10, lok_sabha_seats: 1 },
  ],
};

// Generate districts for states not explicitly listed
function generateDistrictsForState(stateId: string, names: string[]): DistrictInfo[] {
  return names.map((name, i) => ({
    id: `${stateId}-${name.substring(0, 4).toUpperCase()}${i}`,
    state_id: stateId,
    name,
    headquarters: name,
    mandals_count: Math.floor(Math.random() * 15) + 5,
    assembly_seats: Math.floor(Math.random() * 8) + 2,
    lok_sabha_seats: 1,
  }));
}

// Fill remaining states
const REMAINING_STATES: Record<string, string[]> = {
  BR: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Munger', 'Purnia', 'Araria', 'Sitamarhi', 'Siwan', 'Saran', 'Vaishali', 'Nalanda', 'Nawada', 'Aurangabad', 'Rohtas', 'Kaimur', 'Buxar', 'Jehanabad', 'Arwal', 'Lakhisarai', 'Sheikhpura', 'Jamui', 'Khagaria', 'Begusarai', 'Samastipur', 'Madhubani', 'Supaul', 'Madhepura', 'Saharsa', 'Kishanganj', 'Katihar', 'Champaran East', 'Champaran West', 'Gopalganj', 'Sheohar', 'Sitamarhi', 'Banka'],
  RJ: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur', 'Sikar', 'Jhunjhunu', 'Nagaur', 'Tonk', 'Sawai Madhopur', 'Karauli', 'Dausa', 'Dholpur', 'Bundi', 'Baran', 'Jhalawar', 'Bhilwara', 'Chittorgarh', 'Rajsamand', 'Dungarpur', 'Banswara', 'Pratapgarh', 'Sirohi', 'Pali', 'Barmer', 'Jaisalmer', 'Jalore', 'Churu', 'Hanumangarh', 'Ganganagar', 'Sriganganagar'],
  GJ: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Kheda', 'Mehsana', 'Patan', 'Banaskantha', 'Sabarkantha', 'Aravalli', 'Mahisagar', 'Chhota Udaipur', 'Vadodara', 'Narmada', 'Bharuch', 'Surat', 'Navsari', 'Valsad', 'Dang', 'Tapi', 'Kutch', 'Surendranagar', 'Morbi', 'Botad', 'Amreli', 'Porbandar', 'Devbhumi Dwarka', 'Gir Somnath'],
  MP: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Morena', 'Guna', 'Shivpuri', 'Vidisha', 'Sehore', 'Raisen', 'Betul', 'Hoshangabad', 'Khandwa', 'Harda', 'Balaghat', 'Seoni', 'Mandla', 'Dindori', 'Shahdol', 'Umaria', 'Anuppur', 'Chhatarpur', 'Tikamgarh', 'Damoh', 'Panna', 'Katni', 'Narsimhapur', 'Chhindwara', 'Sheopur', 'Datia', 'Ashoknagar', 'Rajgarh', 'Shajapur', 'Agar Malwa', 'Neemuch', 'Mandsaur', 'Niwari', 'Alirajpur', 'Jhabua', 'Dhar', 'Khargone', 'Barwani', 'Sidhi', 'Singrauli'],
  PB: ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Gurdaspur', 'Hoshiarpur', 'Ropar', 'Nawanshahr', 'Kapurthala', 'Fatehgarh Sahib', 'Sangrur', 'Mansa', 'Muktsar', 'Faridkot', 'Firozpur', 'Ferozepur', 'Tarn Taran', 'Fazilka', 'Pathankot', 'Barnala', 'Malerkotla'],
  HR: ['Faridabad', 'Gurgaon', 'Hisar', 'Rohtak', 'Karnal', 'Sonipat', 'Yamunanagar', 'Panipat', 'Ambala', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Rewari', 'Mewat', 'Palwal', 'Panchkula', 'Kaithal', 'Kurukshetra', 'Fatehabad', 'Jhajjar', 'Jind', 'Mahendragarh', 'Charkhi Dadri'],
  WB: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Barddhaman East', 'Barddhaman West', 'Murshidabad', 'Nadia', 'Malda', 'Haora', 'Medinipur West', 'Medinipur East', 'Birbhum', 'Bankura', 'Purulia', 'Jalpaiguri', 'Darjeeling', 'Siliguri', 'Koch Bihar', 'Alipurduar', 'Uttar Dinajpur', 'Dakshin Dinajpur', 'Jhargram', 'Hooghly'],
  AS: ['Kamrup Metropolitan', 'Kamrup', 'Nagaon', 'Barpeta', 'Darrang', 'Sonitpur', 'Dibrugarh', 'Jorhat', 'Sibsagar', 'Golaghat', 'Lakhimpur', 'Dhemaji', 'Tinsukia', 'Cachar', 'Karimganj', 'Hailakandi', 'Dima Hasao', 'Karbi Anglong', 'West Karbi Anglong', 'Goalpara', 'Dhubri', 'South Salmara-Mankachar', 'Bajali', 'Biswanath', 'Charaideo', 'Hojai', 'Majuli', 'Morigaon', 'Tamulpur', 'Udalguri', 'Bongaigaon', 'Chirang', 'Kokrajhar', 'Nalbari', 'Baksa'],
  KL: ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'],
};

for (const [stateId, names] of Object.entries(REMAINING_STATES)) {
  DISTRICTS[stateId] = generateDistrictsForState(stateId, names);
}

export function getDistrictsByState(stateId: string): DistrictInfo[] {
  return DISTRICTS[stateId] || [];
}

// Mandals/Taluks for Telangana (sample - expandable)
const MANDALS: Record<string, MandalInfo[]> = {
  'TG-HYD': [
    { id: 'TG-HYD-CHM', district_id: 'TG-HYD', name: 'Charminar', type: 'mandal' },
    { id: 'TG-HYD-KPR', district_id: 'TG-HYD', name: 'Kapra', type: 'mandal' },
    { id: 'TG-HYD-MRL', district_id: 'TG-HYD', name: 'Malkajgiri', type: 'mandal' },
    { id: 'TG-HYD-SNK', district_id: 'TG-HYD', name: 'Secunderabad', type: 'mandal' },
    { id: 'TG-HYD-LBN', district_id: 'TG-HYD', name: 'Lal Bahadur Nagar', type: 'mandal' },
    { id: 'TG-HYD-SKP', district_id: 'TG-HYD', name: 'Saroornagar', type: 'mandal' },
    { id: 'TG-HYD-AMR', district_id: 'TG-HYD', name: 'Amberpet', type: 'mandal' },
    { id: 'TG-HYD-KHB', district_id: 'TG-HYD', name: 'Khairatabad', type: 'mandal' },
    { id: 'TG-HYD-GOL', district_id: 'TG-HYD', name: 'Golconda', type: 'mandal' },
    { id: 'TG-HYD-BND', district_id: 'TG-HYD', name: 'Bandlaguda', type: 'mandal' },
    { id: 'TG-HYD-HAY', district_id: 'TG-HYD', name: 'Hayathnagar', type: 'mandal' },
    { id: 'TG-HYD-SER', district_id: 'TG-HYD', name: 'Serilingampally', type: 'mandal' },
    { id: 'TG-HYD-QUT', district_id: 'TG-HYD', name: 'Quthbullapur', type: 'mandal' },
    { id: 'TG-HYD-SHD', district_id: 'TG-HYD', name: 'Shaikpet', type: 'mandal' },
    { id: 'TG-HYD-IBR', district_id: 'TG-HYD', name: 'Ibrahimpatnam', type: 'mandal' },
    { id: 'TG-HYD-TRL', district_id: 'TG-HYD', name: 'Tirumalgiri', type: 'mandal' },
  ],
  'TG-RNG': [
    { id: 'TG-RNG-MAH', district_id: 'TG-RNG', name: 'Maheshwaram', type: 'mandal' },
    { id: 'TG-RNG-RAJ', district_id: 'TG-RNG', name: 'Rajendranagar', type: 'mandal' },
    { id: 'TG-RNG-SHD', district_id: 'TG-RNG', name: 'Shadnagar', type: 'mandal' },
    { id: 'TG-RNG-FAR', district_id: 'TG-RNG', name: 'Farooqnagar', type: 'mandal' },
    { id: 'TG-RNG-KON', district_id: 'TG-RNG', name: 'Kondurg', type: 'mandal' },
    { id: 'TG-RNG-IBC', district_id: 'TG-RNG', name: 'Ibrahimpatnam', type: 'mandal' },
    { id: 'TG-RNG-LGM', district_id: 'TG-RNG', name: 'Lambapur', type: 'mandal' },
    { id: 'TG-RNG-KWD', district_id: 'TG-RNG', name: 'Kandukur', type: 'mandal' },
  ],
};

export function getMandalsByDistrict(districtId: string): MandalInfo[] {
  if (MANDALS[districtId]) return MANDALS[districtId];
  // Generate placeholder mandals for districts without explicit data
  const district = Object.values(DISTRICTS).flat().find(d => d.id === districtId);
  const count = district?.mandals_count || 10;
  return Array.from({ length: count }, (_, i) => ({
    id: `${districtId}-M${i + 1}`,
    district_id: districtId,
    name: `Mandal ${i + 1}`,
    type: 'mandal' as const,
  }));
}
