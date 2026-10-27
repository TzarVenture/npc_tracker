/* countries.ts: Complete ISO 3166-1 alpha-2 standard country registry (all 249 official countries and sovereign territories), Tier groupings, and normalization helpers. */

export interface Country {
  code: string; // 2-letter uppercase ISO 3166-1 alpha-2 code (e.g. "SG", "US")
  name: string; // Official English display name
  flag?: string; // Unicode emoji flag
}

export const TIER_1_COUNTRIES: string[] = ["US", "GB", "CA", "AU", "NZ"];
export const TIER_2_COUNTRIES: string[] = ["AT", "BE", "CH", "DE", "DK", "ES", "FI", "FR", "IE", "IT", "JP", "NL", "NO", "SE", "SG", "AE"];

export const COUNTRIES: Country[] = [
  {
    "code": "AF",
    "name": "Afghanistan",
    "flag": "🇦🇫"
  },
  {
    "code": "AX",
    "name": "Åland Islands",
    "flag": "🇦🇽"
  },
  {
    "code": "AL",
    "name": "Albania",
    "flag": "🇦🇱"
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "flag": "🇩🇿"
  },
  {
    "code": "AS",
    "name": "American Samoa",
    "flag": "🇦🇸"
  },
  {
    "code": "AD",
    "name": "Andorra",
    "flag": "🇦🇩"
  },
  {
    "code": "AO",
    "name": "Angola",
    "flag": "🇦🇴"
  },
  {
    "code": "AI",
    "name": "Anguilla",
    "flag": "🇦🇮"
  },
  {
    "code": "AQ",
    "name": "Antarctica",
    "flag": "🇦🇶"
  },
  {
    "code": "AG",
    "name": "Antigua & Barbuda",
    "flag": "🇦🇬"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "flag": "🇦🇷"
  },
  {
    "code": "AM",
    "name": "Armenia",
    "flag": "🇦🇲"
  },
  {
    "code": "AW",
    "name": "Aruba",
    "flag": "🇦🇼"
  },
  {
    "code": "AU",
    "name": "Australia",
    "flag": "🇦🇺"
  },
  {
    "code": "AT",
    "name": "Austria",
    "flag": "🇦🇹"
  },
  {
    "code": "AZ",
    "name": "Azerbaijan",
    "flag": "🇦🇿"
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "flag": "🇧🇸"
  },
  {
    "code": "BH",
    "name": "Bahrain",
    "flag": "🇧🇭"
  },
  {
    "code": "BD",
    "name": "Bangladesh",
    "flag": "🇧🇩"
  },
  {
    "code": "BB",
    "name": "Barbados",
    "flag": "🇧🇧"
  },
  {
    "code": "BY",
    "name": "Belarus",
    "flag": "🇧🇾"
  },
  {
    "code": "BE",
    "name": "Belgium",
    "flag": "🇧🇪"
  },
  {
    "code": "BZ",
    "name": "Belize",
    "flag": "🇧🇿"
  },
  {
    "code": "BJ",
    "name": "Benin",
    "flag": "🇧🇯"
  },
  {
    "code": "BM",
    "name": "Bermuda",
    "flag": "🇧🇲"
  },
  {
    "code": "BT",
    "name": "Bhutan",
    "flag": "🇧🇹"
  },
  {
    "code": "BO",
    "name": "Bolivia",
    "flag": "🇧🇴"
  },
  {
    "code": "BA",
    "name": "Bosnia & Herzegovina",
    "flag": "🇧🇦"
  },
  {
    "code": "BW",
    "name": "Botswana",
    "flag": "🇧🇼"
  },
  {
    "code": "BV",
    "name": "Bouvet Island",
    "flag": "🇧🇻"
  },
  {
    "code": "BR",
    "name": "Brazil",
    "flag": "🇧🇷"
  },
  {
    "code": "IO",
    "name": "British Indian Ocean Territory",
    "flag": "🇮🇴"
  },
  {
    "code": "VG",
    "name": "British Virgin Islands",
    "flag": "🇻🇬"
  },
  {
    "code": "BN",
    "name": "Brunei",
    "flag": "🇧🇳"
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "flag": "🇧🇬"
  },
  {
    "code": "BF",
    "name": "Burkina Faso",
    "flag": "🇧🇫"
  },
  {
    "code": "BI",
    "name": "Burundi",
    "flag": "🇧🇮"
  },
  {
    "code": "KH",
    "name": "Cambodia",
    "flag": "🇰🇭"
  },
  {
    "code": "CM",
    "name": "Cameroon",
    "flag": "🇨🇲"
  },
  {
    "code": "CA",
    "name": "Canada",
    "flag": "🇨🇦"
  },
  {
    "code": "CV",
    "name": "Cape Verde",
    "flag": "🇨🇻"
  },
  {
    "code": "BQ",
    "name": "Caribbean Netherlands",
    "flag": "🇧🇶"
  },
  {
    "code": "KY",
    "name": "Cayman Islands",
    "flag": "🇰🇾"
  },
  {
    "code": "CF",
    "name": "Central African Republic",
    "flag": "🇨🇫"
  },
  {
    "code": "TD",
    "name": "Chad",
    "flag": "🇹🇩"
  },
  {
    "code": "CL",
    "name": "Chile",
    "flag": "🇨🇱"
  },
  {
    "code": "CN",
    "name": "China",
    "flag": "🇨🇳"
  },
  {
    "code": "CX",
    "name": "Christmas Island",
    "flag": "🇨🇽"
  },
  {
    "code": "CC",
    "name": "Cocos (Keeling) Islands",
    "flag": "🇨🇨"
  },
  {
    "code": "CO",
    "name": "Colombia",
    "flag": "🇨🇴"
  },
  {
    "code": "KM",
    "name": "Comoros",
    "flag": "🇰🇲"
  },
  {
    "code": "CG",
    "name": "Congo - Brazzaville",
    "flag": "🇨🇬"
  },
  {
    "code": "CD",
    "name": "Congo - Kinshasa",
    "flag": "🇨🇩"
  },
  {
    "code": "CK",
    "name": "Cook Islands",
    "flag": "🇨🇰"
  },
  {
    "code": "CR",
    "name": "Costa Rica",
    "flag": "🇨🇷"
  },
  {
    "code": "CI",
    "name": "Côte d’Ivoire",
    "flag": "🇨🇮"
  },
  {
    "code": "HR",
    "name": "Croatia",
    "flag": "🇭🇷"
  },
  {
    "code": "CU",
    "name": "Cuba",
    "flag": "🇨🇺"
  },
  {
    "code": "CW",
    "name": "Curaçao",
    "flag": "🇨🇼"
  },
  {
    "code": "CY",
    "name": "Cyprus",
    "flag": "🇨🇾"
  },
  {
    "code": "CZ",
    "name": "Czechia",
    "flag": "🇨🇿"
  },
  {
    "code": "DK",
    "name": "Denmark",
    "flag": "🇩🇰"
  },
  {
    "code": "DJ",
    "name": "Djibouti",
    "flag": "🇩🇯"
  },
  {
    "code": "DM",
    "name": "Dominica",
    "flag": "🇩🇲"
  },
  {
    "code": "DO",
    "name": "Dominican Republic",
    "flag": "🇩🇴"
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "flag": "🇪🇨"
  },
  {
    "code": "EG",
    "name": "Egypt",
    "flag": "🇪🇬"
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "flag": "🇸🇻"
  },
  {
    "code": "GQ",
    "name": "Equatorial Guinea",
    "flag": "🇬🇶"
  },
  {
    "code": "ER",
    "name": "Eritrea",
    "flag": "🇪🇷"
  },
  {
    "code": "EE",
    "name": "Estonia",
    "flag": "🇪🇪"
  },
  {
    "code": "SZ",
    "name": "Eswatini",
    "flag": "🇸🇿"
  },
  {
    "code": "ET",
    "name": "Ethiopia",
    "flag": "🇪🇹"
  },
  {
    "code": "FK",
    "name": "Falkland Islands",
    "flag": "🇫🇰"
  },
  {
    "code": "FO",
    "name": "Faroe Islands",
    "flag": "🇫🇴"
  },
  {
    "code": "FJ",
    "name": "Fiji",
    "flag": "🇫🇯"
  },
  {
    "code": "FI",
    "name": "Finland",
    "flag": "🇫🇮"
  },
  {
    "code": "FR",
    "name": "France",
    "flag": "🇫🇷"
  },
  {
    "code": "GF",
    "name": "French Guiana",
    "flag": "🇬🇫"
  },
  {
    "code": "PF",
    "name": "French Polynesia",
    "flag": "🇵🇫"
  },
  {
    "code": "TF",
    "name": "French Southern Territories",
    "flag": "🇹🇫"
  },
  {
    "code": "GA",
    "name": "Gabon",
    "flag": "🇬🇦"
  },
  {
    "code": "GM",
    "name": "Gambia",
    "flag": "🇬🇲"
  },
  {
    "code": "GE",
    "name": "Georgia",
    "flag": "🇬🇪"
  },
  {
    "code": "DE",
    "name": "Germany",
    "flag": "🇩🇪"
  },
  {
    "code": "GH",
    "name": "Ghana",
    "flag": "🇬🇭"
  },
  {
    "code": "GI",
    "name": "Gibraltar",
    "flag": "🇬🇮"
  },
  {
    "code": "GR",
    "name": "Greece",
    "flag": "🇬🇷"
  },
  {
    "code": "GL",
    "name": "Greenland",
    "flag": "🇬🇱"
  },
  {
    "code": "GD",
    "name": "Grenada",
    "flag": "🇬🇩"
  },
  {
    "code": "GP",
    "name": "Guadeloupe",
    "flag": "🇬🇵"
  },
  {
    "code": "GU",
    "name": "Guam",
    "flag": "🇬🇺"
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "flag": "🇬🇹"
  },
  {
    "code": "GG",
    "name": "Guernsey",
    "flag": "🇬🇬"
  },
  {
    "code": "GN",
    "name": "Guinea",
    "flag": "🇬🇳"
  },
  {
    "code": "GW",
    "name": "Guinea-Bissau",
    "flag": "🇬🇼"
  },
  {
    "code": "GY",
    "name": "Guyana",
    "flag": "🇬🇾"
  },
  {
    "code": "HT",
    "name": "Haiti",
    "flag": "🇭🇹"
  },
  {
    "code": "HM",
    "name": "Heard & McDonald Islands",
    "flag": "🇭🇲"
  },
  {
    "code": "HN",
    "name": "Honduras",
    "flag": "🇭🇳"
  },
  {
    "code": "HK",
    "name": "Hong Kong SAR China",
    "flag": "🇭🇰"
  },
  {
    "code": "HU",
    "name": "Hungary",
    "flag": "🇭🇺"
  },
  {
    "code": "IS",
    "name": "Iceland",
    "flag": "🇮🇸"
  },
  {
    "code": "IN",
    "name": "India",
    "flag": "🇮🇳"
  },
  {
    "code": "ID",
    "name": "Indonesia",
    "flag": "🇮🇩"
  },
  {
    "code": "IR",
    "name": "Iran",
    "flag": "🇮🇷"
  },
  {
    "code": "IQ",
    "name": "Iraq",
    "flag": "🇮🇶"
  },
  {
    "code": "IE",
    "name": "Ireland",
    "flag": "🇮🇪"
  },
  {
    "code": "IM",
    "name": "Isle of Man",
    "flag": "🇮🇲"
  },
  {
    "code": "IL",
    "name": "Israel",
    "flag": "🇮🇱"
  },
  {
    "code": "IT",
    "name": "Italy",
    "flag": "🇮🇹"
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "flag": "🇯🇲"
  },
  {
    "code": "JP",
    "name": "Japan",
    "flag": "🇯🇵"
  },
  {
    "code": "JE",
    "name": "Jersey",
    "flag": "🇯🇪"
  },
  {
    "code": "JO",
    "name": "Jordan",
    "flag": "🇯🇴"
  },
  {
    "code": "KZ",
    "name": "Kazakhstan",
    "flag": "🇰🇿"
  },
  {
    "code": "KE",
    "name": "Kenya",
    "flag": "🇰🇪"
  },
  {
    "code": "KI",
    "name": "Kiribati",
    "flag": "🇰🇮"
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "flag": "🇰🇼"
  },
  {
    "code": "KG",
    "name": "Kyrgyzstan",
    "flag": "🇰🇬"
  },
  {
    "code": "LA",
    "name": "Laos",
    "flag": "🇱🇦"
  },
  {
    "code": "LV",
    "name": "Latvia",
    "flag": "🇱🇻"
  },
  {
    "code": "LB",
    "name": "Lebanon",
    "flag": "🇱🇧"
  },
  {
    "code": "LS",
    "name": "Lesotho",
    "flag": "🇱🇸"
  },
  {
    "code": "LR",
    "name": "Liberia",
    "flag": "🇱🇷"
  },
  {
    "code": "LY",
    "name": "Libya",
    "flag": "🇱🇾"
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "flag": "🇱🇮"
  },
  {
    "code": "LT",
    "name": "Lithuania",
    "flag": "🇱🇹"
  },
  {
    "code": "LU",
    "name": "Luxembourg",
    "flag": "🇱🇺"
  },
  {
    "code": "MO",
    "name": "Macao SAR China",
    "flag": "🇲🇴"
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "flag": "🇲🇬"
  },
  {
    "code": "MW",
    "name": "Malawi",
    "flag": "🇲🇼"
  },
  {
    "code": "MY",
    "name": "Malaysia",
    "flag": "🇲🇾"
  },
  {
    "code": "MV",
    "name": "Maldives",
    "flag": "🇲🇻"
  },
  {
    "code": "ML",
    "name": "Mali",
    "flag": "🇲🇱"
  },
  {
    "code": "MT",
    "name": "Malta",
    "flag": "🇲🇹"
  },
  {
    "code": "MH",
    "name": "Marshall Islands",
    "flag": "🇲🇭"
  },
  {
    "code": "MQ",
    "name": "Martinique",
    "flag": "🇲🇶"
  },
  {
    "code": "MR",
    "name": "Mauritania",
    "flag": "🇲🇷"
  },
  {
    "code": "MU",
    "name": "Mauritius",
    "flag": "🇲🇺"
  },
  {
    "code": "YT",
    "name": "Mayotte",
    "flag": "🇾🇹"
  },
  {
    "code": "MX",
    "name": "Mexico",
    "flag": "🇲🇽"
  },
  {
    "code": "FM",
    "name": "Micronesia",
    "flag": "🇫🇲"
  },
  {
    "code": "MD",
    "name": "Moldova",
    "flag": "🇲🇩"
  },
  {
    "code": "MC",
    "name": "Monaco",
    "flag": "🇲🇨"
  },
  {
    "code": "MN",
    "name": "Mongolia",
    "flag": "🇲🇳"
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "flag": "🇲🇪"
  },
  {
    "code": "MS",
    "name": "Montserrat",
    "flag": "🇲🇸"
  },
  {
    "code": "MA",
    "name": "Morocco",
    "flag": "🇲🇦"
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "flag": "🇲🇿"
  },
  {
    "code": "MM",
    "name": "Myanmar (Burma)",
    "flag": "🇲🇲"
  },
  {
    "code": "NA",
    "name": "Namibia",
    "flag": "🇳🇦"
  },
  {
    "code": "NR",
    "name": "Nauru",
    "flag": "🇳🇷"
  },
  {
    "code": "NP",
    "name": "Nepal",
    "flag": "🇳🇵"
  },
  {
    "code": "NL",
    "name": "Netherlands",
    "flag": "🇳🇱"
  },
  {
    "code": "NC",
    "name": "New Caledonia",
    "flag": "🇳🇨"
  },
  {
    "code": "NZ",
    "name": "New Zealand",
    "flag": "🇳🇿"
  },
  {
    "code": "NI",
    "name": "Nicaragua",
    "flag": "🇳🇮"
  },
  {
    "code": "NE",
    "name": "Niger",
    "flag": "🇳🇪"
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "flag": "🇳🇬"
  },
  {
    "code": "NU",
    "name": "Niue",
    "flag": "🇳🇺"
  },
  {
    "code": "NF",
    "name": "Norfolk Island",
    "flag": "🇳🇫"
  },
  {
    "code": "KP",
    "name": "North Korea",
    "flag": "🇰🇵"
  },
  {
    "code": "MK",
    "name": "North Macedonia",
    "flag": "🇲🇰"
  },
  {
    "code": "MP",
    "name": "Northern Mariana Islands",
    "flag": "🇲🇵"
  },
  {
    "code": "NO",
    "name": "Norway",
    "flag": "🇳🇴"
  },
  {
    "code": "OM",
    "name": "Oman",
    "flag": "🇴🇲"
  },
  {
    "code": "PK",
    "name": "Pakistan",
    "flag": "🇵🇰"
  },
  {
    "code": "PW",
    "name": "Palau",
    "flag": "🇵🇼"
  },
  {
    "code": "PS",
    "name": "Palestinian Territories",
    "flag": "🇵🇸"
  },
  {
    "code": "PA",
    "name": "Panama",
    "flag": "🇵🇦"
  },
  {
    "code": "PG",
    "name": "Papua New Guinea",
    "flag": "🇵🇬"
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "flag": "🇵🇾"
  },
  {
    "code": "PE",
    "name": "Peru",
    "flag": "🇵🇪"
  },
  {
    "code": "PH",
    "name": "Philippines",
    "flag": "🇵🇭"
  },
  {
    "code": "PN",
    "name": "Pitcairn Islands",
    "flag": "🇵🇳"
  },
  {
    "code": "PL",
    "name": "Poland",
    "flag": "🇵🇱"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "flag": "🇵🇹"
  },
  {
    "code": "PR",
    "name": "Puerto Rico",
    "flag": "🇵🇷"
  },
  {
    "code": "QA",
    "name": "Qatar",
    "flag": "🇶🇦"
  },
  {
    "code": "RE",
    "name": "Réunion",
    "flag": "🇷🇪"
  },
  {
    "code": "RO",
    "name": "Romania",
    "flag": "🇷🇴"
  },
  {
    "code": "RU",
    "name": "Russia",
    "flag": "🇷🇺"
  },
  {
    "code": "RW",
    "name": "Rwanda",
    "flag": "🇷🇼"
  },
  {
    "code": "WS",
    "name": "Samoa",
    "flag": "🇼🇸"
  },
  {
    "code": "SM",
    "name": "San Marino",
    "flag": "🇸🇲"
  },
  {
    "code": "ST",
    "name": "São Tomé & Príncipe",
    "flag": "🇸🇹"
  },
  {
    "code": "SA",
    "name": "Saudi Arabia",
    "flag": "🇸🇦"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "flag": "🇸🇳"
  },
  {
    "code": "RS",
    "name": "Serbia",
    "flag": "🇷🇸"
  },
  {
    "code": "SC",
    "name": "Seychelles",
    "flag": "🇸🇨"
  },
  {
    "code": "SL",
    "name": "Sierra Leone",
    "flag": "🇸🇱"
  },
  {
    "code": "SG",
    "name": "Singapore",
    "flag": "🇸🇬"
  },
  {
    "code": "SX",
    "name": "Sint Maarten",
    "flag": "🇸🇽"
  },
  {
    "code": "SK",
    "name": "Slovakia",
    "flag": "🇸🇰"
  },
  {
    "code": "SI",
    "name": "Slovenia",
    "flag": "🇸🇮"
  },
  {
    "code": "SB",
    "name": "Solomon Islands",
    "flag": "🇸🇧"
  },
  {
    "code": "SO",
    "name": "Somalia",
    "flag": "🇸🇴"
  },
  {
    "code": "ZA",
    "name": "South Africa",
    "flag": "🇿🇦"
  },
  {
    "code": "GS",
    "name": "South Georgia & South Sandwich Islands",
    "flag": "🇬🇸"
  },
  {
    "code": "KR",
    "name": "South Korea",
    "flag": "🇰🇷"
  },
  {
    "code": "SS",
    "name": "South Sudan",
    "flag": "🇸🇸"
  },
  {
    "code": "ES",
    "name": "Spain",
    "flag": "🇪🇸"
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "flag": "🇱🇰"
  },
  {
    "code": "BL",
    "name": "St. Barthélemy",
    "flag": "🇧🇱"
  },
  {
    "code": "SH",
    "name": "St. Helena",
    "flag": "🇸🇭"
  },
  {
    "code": "KN",
    "name": "St. Kitts & Nevis",
    "flag": "🇰🇳"
  },
  {
    "code": "LC",
    "name": "St. Lucia",
    "flag": "🇱🇨"
  },
  {
    "code": "MF",
    "name": "St. Martin",
    "flag": "🇲🇫"
  },
  {
    "code": "PM",
    "name": "St. Pierre & Miquelon",
    "flag": "🇵🇲"
  },
  {
    "code": "VC",
    "name": "St. Vincent & Grenadines",
    "flag": "🇻🇨"
  },
  {
    "code": "SD",
    "name": "Sudan",
    "flag": "🇸🇩"
  },
  {
    "code": "SR",
    "name": "Suriname",
    "flag": "🇸🇷"
  },
  {
    "code": "SJ",
    "name": "Svalbard & Jan Mayen",
    "flag": "🇸🇯"
  },
  {
    "code": "SE",
    "name": "Sweden",
    "flag": "🇸🇪"
  },
  {
    "code": "CH",
    "name": "Switzerland",
    "flag": "🇨🇭"
  },
  {
    "code": "SY",
    "name": "Syria",
    "flag": "🇸🇾"
  },
  {
    "code": "TW",
    "name": "Taiwan",
    "flag": "🇹🇼"
  },
  {
    "code": "TJ",
    "name": "Tajikistan",
    "flag": "🇹🇯"
  },
  {
    "code": "TZ",
    "name": "Tanzania",
    "flag": "🇹🇿"
  },
  {
    "code": "TH",
    "name": "Thailand",
    "flag": "🇹🇭"
  },
  {
    "code": "TL",
    "name": "Timor-Leste",
    "flag": "🇹🇱"
  },
  {
    "code": "TG",
    "name": "Togo",
    "flag": "🇹🇬"
  },
  {
    "code": "TK",
    "name": "Tokelau",
    "flag": "🇹🇰"
  },
  {
    "code": "TO",
    "name": "Tonga",
    "flag": "🇹🇴"
  },
  {
    "code": "TT",
    "name": "Trinidad & Tobago",
    "flag": "🇹🇹"
  },
  {
    "code": "TN",
    "name": "Tunisia",
    "flag": "🇹🇳"
  },
  {
    "code": "TR",
    "name": "Türkiye",
    "flag": "🇹🇷"
  },
  {
    "code": "TM",
    "name": "Turkmenistan",
    "flag": "🇹🇲"
  },
  {
    "code": "TC",
    "name": "Turks & Caicos Islands",
    "flag": "🇹🇨"
  },
  {
    "code": "TV",
    "name": "Tuvalu",
    "flag": "🇹🇻"
  },
  {
    "code": "UM",
    "name": "U.S. Outlying Islands",
    "flag": "🇺🇲"
  },
  {
    "code": "VI",
    "name": "U.S. Virgin Islands",
    "flag": "🇻🇮"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "flag": "🇺🇬"
  },
  {
    "code": "UA",
    "name": "Ukraine",
    "flag": "🇺🇦"
  },
  {
    "code": "AE",
    "name": "United Arab Emirates",
    "flag": "🇦🇪"
  },
  {
    "code": "GB",
    "name": "United Kingdom",
    "flag": "🇬🇧"
  },
  {
    "code": "US",
    "name": "United States",
    "flag": "🇺🇸"
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "flag": "🇺🇾"
  },
  {
    "code": "UZ",
    "name": "Uzbekistan",
    "flag": "🇺🇿"
  },
  {
    "code": "VU",
    "name": "Vanuatu",
    "flag": "🇻🇺"
  },
  {
    "code": "VA",
    "name": "Vatican City",
    "flag": "🇻🇦"
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "flag": "🇻🇪"
  },
  {
    "code": "VN",
    "name": "Vietnam",
    "flag": "🇻🇳"
  },
  {
    "code": "WF",
    "name": "Wallis & Futuna",
    "flag": "🇼🇫"
  },
  {
    "code": "EH",
    "name": "Western Sahara",
    "flag": "🇪🇭"
  },
  {
    "code": "YE",
    "name": "Yemen",
    "flag": "🇾🇪"
  },
  {
    "code": "ZM",
    "name": "Zambia",
    "flag": "🇿🇲"
  },
  {
    "code": "ZW",
    "name": "Zimbabwe",
    "flag": "🇿🇼"
  }
];

// Lookup map by ISO 2-letter code uppercase
export const COUNTRY_CODE_MAP = new Map<string, Country>(
  COUNTRIES.map(c => [c.code.toUpperCase(), c])
);

// Direct map of official lowercased country names to ISO code
export const COUNTRY_NAME_MAP = new Map<string, string>(
  COUNTRIES.map(c => [c.name.toLowerCase(), c.code])
);

// Common aliases and colloquial names to standard ISO 3166-1 codes
const NAME_TO_CODE_ALIASES: Record<string, string> = {
  "singapore": "SG",
  "united states": "US",
  "united states of america": "US",
  "usa": "US",
  "u.s.a.": "US",
  "u.s.": "US",
  "united kingdom": "GB",
  "great britain": "GB",
  "uk": "GB",
  "u.k.": "GB",
  "britain": "GB",
  "england": "GB",
  "scotland": "GB",
  "wales": "GB",
  "india": "IN",
  "canada": "CA",
  "australia": "AU",
  "germany": "DE",
  "deutschland": "DE",
  "france": "FR",
  "italy": "IT",
  "spain": "ES",
  "netherlands": "NL",
  "holland": "NL",
  "brazil": "BR",
  "brasil": "BR",
  "mexico": "MX",
  "united arab emirates": "AE",
  "uae": "AE",
  "u.a.e.": "AE",
  "dubai": "AE",
  "abu dhabi": "AE",
  "saudi arabia": "SA",
  "ksa": "SA",
  "japan": "JP",
  "south korea": "KR",
  "korea": "KR",
  "republic of korea": "KR",
  "china": "CN",
  "prc": "CN",
  "hong kong": "HK",
  "taiwan": "TW",
  "malaysia": "MY",
  "indonesia": "ID",
  "philippines": "PH",
  "thailand": "TH",
  "vietnam": "VN",
  "viet nam": "VN",
  "new zealand": "NZ",
  "ireland": "IE",
  "switzerland": "CH",
  "sweden": "SE",
  "norway": "NO",
  "denmark": "DK",
  "finland": "FI",
  "belgium": "BE",
  "austria": "AT",
  "poland": "PL",
  "portugal": "PT",
  "greece": "GR",
  "czech republic": "CZ",
  "czechia": "CZ",
  "romania": "RO",
  "hungary": "HU",
  "south africa": "ZA",
  "nigeria": "NG",
  "egypt": "EG",
  "israel": "IL",
  "turkey": "TR",
  "turkiye": "TR",
  "pakistan": "PK",
  "bangladesh": "BD",
  "sri lanka": "LK",
  "argentina": "AR",
  "chile": "CL",
  "colombia": "CO",
  "peru": "PE",
  "russia": "RU",
  "russian federation": "RU",
  "ukraine": "UA"
};

export function normalizeCountryCode(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();

  if (COUNTRY_CODE_MAP.has(upper)) {
    return upper;
  }

  const lower = trimmed.toLowerCase();
  if (NAME_TO_CODE_ALIASES[lower]) {
    return NAME_TO_CODE_ALIASES[lower];
  }

  if (COUNTRY_NAME_MAP.has(lower)) {
    return COUNTRY_NAME_MAP.get(lower)!;
  }

  if (trimmed.length === 2) {
    return upper;
  }

  return upper;
}

export function getCountryByCode(codeOrName: string): Country | undefined {
  const code = normalizeCountryCode(codeOrName);
  return COUNTRY_CODE_MAP.get(code);
}

export function formatCountryLabel(codeOrName: string): string {
  const code = normalizeCountryCode(codeOrName);
  const found = COUNTRY_CODE_MAP.get(code);
  if (found) {
    return `${found.flag ? found.flag + " " : ""}${found.name} (${found.code})`;
  }
  return codeOrName;
}
