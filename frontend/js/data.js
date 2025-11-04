export const preferenceLabels = {
  citrus: "시트러스",
  sweet: "달달",
  woody: "우디",
  floral: "플로럴",
  aqua: "아쿠아",
};

export const perfumeList = [
  {
    id: "citrus-dawn",
    name: "Citrus Dawn",
    brand: "Sunrise Atelier",
    description: "햇살이 부드럽게 감싸는 아침, 산뜻한 감귤 향으로 기분을 깨워주는 시트러스 향수입니다.",
    tags: ["citrus", "aqua"],
    accords: ["산뜻함", "청량감"],
    notes: {
      top: ["베르가못", "자몽", "유자"],
      middle: ["그린티", "오렌지 블러섬"],
      base: ["머스크", "시더우드"],
    },
  },
  {
    id: "floral-mist",
    name: "Floral Mist",
    brand: "Bloom House",
    description: "봄날 정원에서 느껴지는 꽃내음. 은은한 플로럴 향이 따뜻하게 스며듭니다.",
    tags: ["floral"],
    accords: ["부드러움", "우아함"],
    notes: {
      top: ["레몬 블러섬", "라일락"],
      middle: ["자스민", "피오니"],
      base: ["화이트 머스크", "샌달우드"],
    },
  },
  {
    id: "woodland-trail",
    name: "Woodland Trail",
    brand: "Forest Echo",
    description: "촉촉한 숲속을 거니는 듯한 우디 향으로 안정감과 깊이를 전해줍니다.",
    tags: ["woody"],
    accords: ["깊이감", "안정감"],
    notes: {
      top: ["핑크 페퍼", "세이지"],
      middle: ["시더우드", "베티버"],
      base: ["앰버", "파출리"],
    },
  },
  {
    id: "honey-blossom",
    name: "Honey Blossom",
    brand: "Nectar Studio",
    description: "달콤한 벌꿀과 꽃향기가 어우러져 포근한 감성을 담은 향수입니다.",
    tags: ["sweet", "floral"],
    accords: ["포근함", "달콤함"],
    notes: {
      top: ["허니", "페어"],
      middle: ["티아레 플라워", "오키드"],
      base: ["바닐라", "캐셔머란"],
    },
  },
  {
    id: "marine-whisper",
    name: "Marine Whisper",
    brand: "Azure Lab",
    description: "맑은 바다 바람이 스치는 듯한 아쿠아 향이 청량하게 펼쳐집니다.",
    tags: ["aqua", "citrus"],
    accords: ["청량감", "자유로움"],
    notes: {
      top: ["라임", "바질"],
      middle: ["시솔트", "드리프트우드"],
      base: ["앰버그리스", "화이트 머스크"],
    },
  },
  {
    id: "amber-velvet",
    name: "Amber Velvet",
    brand: "Nocturne Atelier",
    description: "깊고 따뜻한 앰버와 우디 노트가 어우러져 고혹적인 분위기를 완성합니다.",
    tags: ["woody", "sweet"],
    accords: ["관능미", "따뜻함"],
    notes: {
      top: ["베르가못", "사프란"],
      middle: ["장미", "앰브록산"],
      base: ["앰버", "통카빈"],
    },
  },
  {
    id: "candy-cloud",
    name: "Candy Cloud",
    brand: "Pastel Mood",
    description: "솜사탕처럼 달콤하고 가벼운 노트가 기분 좋은 설렘을 전합니다.",
    tags: ["sweet"],
    accords: ["달콤함", "경쾌함"],
    notes: {
      top: ["라즈베리", "핑크 페퍼"],
      middle: ["코튼 플라워", "프리지아"],
      base: ["머스크", "바닐라"],
    },
  },
  {
    id: "sage-rain",
    name: "Sage Rain",
    brand: "Cloudline",
    description: "비 온 뒤 젖은 공기와 허브가 전하는 차분한 아쿠아 향입니다.",
    tags: ["aqua", "woody"],
    accords: ["차분함", "맑음"],
    notes: {
      top: ["만다린", "레인 어코드"],
      middle: ["세이지", "아이리스"],
      base: ["오크모스", "시더"],
    },
  },
];

export const dummyWeather = {
  location: "서울",
  temperature: 23,
  description: "구름 사이로 비치는 따뜻한 햇살",
  humidity: 52,
  status: "sunny",
  fetchedAt: new Date().toISOString(),
};

export const dummyUser = {
  name: "게스트",
};
