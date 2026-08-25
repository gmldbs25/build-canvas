window.TEXAS_TRACE_DATA = {
  meta: {
    title: "Texas Trace",
    subtitle: "Austin / Houston, Texas Journey Log",
    siteUrl: "https://gmldbs25.github.io/build-canvas/texas-trace/",
    deployment: "GitHub Pages",
    viewport: "pc-first",
    mobileSupport: "not-prioritized",
    defaultTileLayer: "carto-dark",
    fallbackTileLayers: ["openstreetmap", "carto-light"],
    videoSupport: false,
    initialAnimationScope: "minimal-active-state-only",
    dataPolicy: {
      runtimeGeocoding: false,
      routeSource: "routeLinks-only",
      journeyOrderSource: "journeySteps",
      fullImagePreload: false,
      thumbPreferred: false,
      fullImageRequiredForFullscreen: false
    }
  },

  locations: {
    "incheon-airport": {
      name: "인천공항",
      officialName: "Incheon International Airport",
      address: "Incheon International Airport, Incheon, South Korea",
      lat: 37.463333,
      lng: 126.440002,
      category: "airport",
      country: "KR",
      coordinateStatus: "verified-seed"
    },

    "atlanta-airport": {
      name: "애틀란타 공항",
      officialName: "Hartsfield-Jackson Atlanta International Airport",
      address: "Hartsfield-Jackson Atlanta International Airport, Atlanta, GA, USA",
      lat: 33.640411,
      lng: -84.419853,
      category: "airport",
      country: "US",
      coordinateStatus: "verified-seed"
    },

    "austin-airport": {
      name: "오스틴 공항",
      officialName: "Austin-Bergstrom International Airport",
      address: "Austin-Bergstrom International Airport, Austin, TX, USA",
      lat: 30.194444,
      lng: -97.67,
      category: "airport",
      country: "US",
      coordinateStatus: "verified-seed"
    },

    "austin-lodging": {
      name: "오스틴 숙소",
      officialName: "The Vaughan",
      address: "12601 Innovar Cir, Austin, TX 78754",
      lat: 30.37951,
      lng: -97.62759,
      category: "lodging",
      country: "US",
      coordinateStatus: "seed-review-recommended"
    },

    "bjs-restaurant": {
      name: "BJ's Restaurant",
      officialName: "BJ's Restaurant & Brewhouse - Arbor Walk",
      address: "10515 MoPac Expy, Austin, TX 78759",
      lat: 30.39219,
      lng: -97.732409,
      category: "meal",
      country: "US",
      coordinateStatus: "seed-review-recommended"
    },

    "the-domain": {
      name: "The Domain",
      officialName: "The Domain",
      address: "11410 Century Oaks Terrace, Austin, TX 78758",
      lat: 30.402025,
      lng: -97.726006,
      category: "shopping",
      country: "US",
      coordinateStatus: "verified-seed"
    },

    "mueller-lake-park": {
      name: "Mueller Lake Park",
      officialName: "Mueller Lake Park",
      address: "4550 Mueller Blvd, Austin, TX 78723",
      lat: 30.296934,
      lng: -97.706987,
      category: "nature",
      country: "US",
      coordinateStatus: "seed-review-recommended"
    },

    "stiles-switch-bbq": {
      name: "Stiles Switch BBQ",
      officialName: "Stiles Switch BBQ & Brew",
      address: "6610 N Lamar Blvd, Austin, TX 78752",
      lat: 30.334575,
      lng: -97.721445,
      category: "meal",
      country: "US",
      coordinateStatus: "seed-review-recommended"
    },

    "space-center-houston": {
      name: "휴스턴 스페이스 센터",
      officialName: "Space Center Houston",
      address: "1601 NASA Parkway, Houston, TX 77058",
      lat: 29.551811,
      lng: -95.098228,
      category: "space",
      country: "US",
      coordinateStatus: "verified-seed"
    },

    "houston-museum-natural-science": {
      name: "Houston Museum of Natural Science",
      officialName: "Houston Museum of Natural Science",
      address: "5555 Hermann Park Dr, Houston, TX 77030",
      lat: 29.722013,
      lng: -95.389633,
      category: "museum",
      country: "US",
      coordinateStatus: "verified-seed"
    },

    "buc-ees-waller": {
      name: "Buc-ee's",
      officialName: "Buc-ee's Waller",
      address: "40900 US-290, Waller, TX 77484",
      lat: 30.0599,
      lng: -95.9269,
      category: "return-stop",
      country: "US",
      coordinateStatus: "needs-review"
    },

    "ut-austin-coop": {
      name: "UT Austin Co-op",
      officialName: "University Co-op",
      address: "2246 Guadalupe St, Austin, TX 78705",
      lat: 30.286165,
      lng: -97.74192,
      category: "shopping",
      country: "US",
      coordinateStatus: "verified-seed"
    },

    "cota": {
      name: "Circuit of The Americas",
      officialName: "Circuit of The Americas",
      address: "9201 Circuit of The Americas Blvd, Austin, TX 78617",
      lat: 30.133883,
      lng: -97.641144,
      category: "race",
      country: "US",
      coordinateStatus: "verified-seed"
    },

    "texas-capitol": {
      name: "Texas Capitol",
      officialName: "Texas State Capitol",
      address: "1100 Congress Ave, Austin, TX 78701",
      lat: 30.274623,
      lng: -97.740415,
      category: "landmark",
      country: "US",
      coordinateStatus: "seed-review-recommended"
    },

    "yard-house": {
      name: "Yard House",
      officialName: "Yard House - Domain Northside",
      address: "11800 Domain Blvd Suite 700, Austin, TX 78758",
      lat: 30.404352,
      lng: -97.721483,
      category: "meal",
      country: "US",
      coordinateStatus: "seed-review-recommended"
    },

    "total-wine-mueller": {
      name: "Total Wine & More",
      officialName: "Total Wine & More Mueller",
      address: "1201 Barbara Jordan Blvd Suite 900, Austin, TX 78723",
      lat: 30.30636,
      lng: -97.7069,
      category: "shopping",
      country: "US",
      coordinateStatus: "needs-review"
    },

    "minneapolis-airport": {
      name: "미니애폴리스 공항",
      officialName: "Minneapolis-Saint Paul International Airport",
      address: "Minneapolis-Saint Paul International Airport, MN, USA",
      lat: 44.883333,
      lng: -93.220833,
      category: "airport",
      country: "US",
      coordinateStatus: "verified-seed"
    }
  },

  journeySteps: [
    {
      stepId: 1,
      locationId: "incheon-airport",
      title: "인천공항",
      subtitle: "출발!",
      role: "departure",
      storyType: "flight-start",
      summary: "🛫 08:45 비행기로 출국",
      mediaGroupId: "incheon-airport-departure"
    },
    {
      stepId: 2,
      locationId: "atlanta-airport",
      title: "애틀란타 공항",
      subtitle: "미국 입국 및 환승",
      role: "flight-transfer",
      storyType: "flight-transfer",
      summary: "처음 맛 본 미국 쉨쉨 버거",
      mediaGroupId: "atlanta-airport"
    },
    {
      stepId: 3,
      locationId: "austin-airport",
      title: "오스틴 공항",
      subtitle: "Austin 도착",
      role: "arrival",
      storyType: "arrival",
      summary: "🚙 짐 찾고 렌트카 수령",
      mediaGroupId: "austin-airport-arrival"
    },
    {
      stepId: 4,
      locationId: "austin-lodging",
      title: "오스틴 숙소",
      subtitle: "Austin Local Hub",
      role: "lodging-hub",
      storyType: "basecamp",
      summary: "🌅 깔끔한 시설의 일몰 맛집 숙소",
      mediaGroupId: "austin-lodging"
    },
    {
      stepId: 5,
      locationId: "bjs-restaurant",
      title: "BJ's Restaurant",
      subtitle: "첫 미국미국한 식당",
      role: "meal",
      storyType: "local-meal",
      summary: "햄버거, 프라이 엄청 많이",
      mediaGroupId: "bjs-restaurant"
    },
    {
      stepId: 6,
      locationId: "the-domain",
      title: "The Domain",
      subtitle: "Austin Shopping Area",
      role: "shopping",
      storyType: "local-shopping",
      summary: "오스틴 대표 쇼핑 아울렛",
      mediaGroupId: "the-domain"
    },
    {
      stepId: 7,
      locationId: "mueller-lake-park",
      title: "Mueller Lake Park",
      subtitle: "Austin의 여유로운 공원",
      role: "nature",
      storyType: "local-nature",
      summary: "우연히 들른 너무 평화로웠던 공원",
      mediaGroupId: "mueller-lake-park"
    },
    {
      stepId: 8,
      locationId: "stiles-switch-bbq",
      title: "Stiles Switch BBQ",
      subtitle: "Texas BBQ",
      role: "meal",
      storyType: "bbq",
      summary: "처음 먹어 본 텍사스 BBQ, 충격적",
      mediaGroupId: "stiles-switch-bbq"
    },
    {
      stepId: 9,
      locationId: "space-center-houston",
      title: "Space Center Houston",
      subtitle: "NASA와 우주 경험",
      role: "space",
      storyType: "space-center",
      summary: "우주 좋아하면 너무너무 가봐야 할 곳",
      mediaGroupId: "space-center-houston"
    },
    {
      stepId: 10,
      locationId: "houston-museum-natural-science",
      title: "Houston Museum of Natural Science",
      subtitle: "자연사 박물관",
      role: "museum",
      storyType: "museum",
      summary: "이공계생에게 딱 맞는 공간",
      mediaGroupId: "houston-museum-natural-science"
    },
    {
      stepId: 11,
      locationId: "buc-ees-waller",
      title: "Buc-ee's",
      subtitle: "Houston에서 Austin으로 돌아오는 길",
      role: "return-stop",
      storyType: "road-trip-stop",
      summary: "미국식 휴게소 체험, 모든게 크다",
      mediaGroupId: "buc-ees-waller"
    },
    {
      stepId: 12,
      locationId: "ut-austin-coop",
      title: "UT Austin Co-op",
      subtitle: "University of Texas Austin",
      role: "shopping",
      storyType: "campus",
      summary: "더워서 캠퍼스는 정작 많이 못 본..",
      mediaGroupId: "ut-austin-coop"
    },
    {
      stepId: 13,
      locationId: "cota",
      title: "Circuit of The Americas",
      subtitle: "COTA",
      role: "race",
      storyType: "race",
      summary: "🏎️ F1 서킷, Ferrari Driving Day, 고 카트!",
      mediaGroupId: "cota"
    },
    {
      stepId: 14,
      locationId: "texas-capitol",
      title: "Texas Capitol",
      subtitle: "텍사스 주 의사당",
      role: "landmark",
      storyType: "capital",
      summary: "너무 예쁜 건물 외부와 내부",
      mediaGroupId: "texas-capitol"
    },
    {
      stepId: 15,
      locationId: "yard-house",
      title: "Yard House",
      subtitle: "Domain Northside",
      role: "meal",
      storyType: "local-meal",
      summary: "마지막 오스틴 외식",
      mediaGroupId: "yard-house"
    },
    {
      stepId: 16,
      locationId: "total-wine-mueller",
      title: "Total Wine & More",
      subtitle: "Mueller Shopping Stop",
      role: "shopping",
      storyType: "local-shopping",
      summary: "부모님 선물 위스키",
      mediaGroupId: "total-wine-mueller"
    },
    {
      stepId: 17,
      locationId: "austin-airport",
      title: "오스틴 공항",
      subtitle: "Austin 출국",
      role: "departure",
      storyType: "departure",
      summary: "새벽 2시에 출발, 바뀐 항공일정 😨",
      mediaGroupId: "austin-airport-departure"
    },
    {
      stepId: 18,
      locationId: "minneapolis-airport",
      title: "미니애폴리스 공항",
      subtitle: "귀국편 환승",
      role: "flight-transfer",
      storyType: "flight-transfer",
      summary: "시애틀 대신 미네소타 공항 경험",
      mediaGroupId: "minneapolis-airport"
    },
    {
      stepId: 19,
      locationId: "incheon-airport",
      title: "인천공항",
      subtitle: "끝!",
      role: "arrival-home",
      storyType: "return-home",
      summary: "17시 한국 도착",
      mediaGroupId: "incheon-airport-return"
    }
  ],

  routeLinks: [
    { from: 1, to: 2, type: "flight", label: "ICN -> ATL", importance: "primary" },
    { from: 2, to: 3, type: "flight", label: "ATL -> AUS", importance: "primary" },
    { from: 3, to: 4, type: "arrival-drive", label: "AUS -> Austin Lodging", importance: "primary" },

    { from: 4, to: 5, type: "local", label: "Lodging <-> BJ's Restaurant", importance: "secondary" },
    { from: 4, to: 6, type: "local", label: "Lodging <-> The Domain", importance: "secondary" },
    { from: 4, to: 7, type: "local", label: "Lodging <-> Mueller Lake Park", importance: "secondary" },
    { from: 4, to: 8, type: "local", label: "Lodging <-> Stiles Switch BBQ", importance: "secondary" },

    { from: 4, to: 9, type: "long-drive", label: "Austin -> Space Center Houston", importance: "primary" },
    { from: 9, to: 10, type: "houston-local", label: "Space Center Houston -> HMNS", importance: "primary" },
    { from: 10, to: 11, type: "return-stop", label: "HMNS -> Buc-ee's", importance: "primary" },
    { from: 11, to: 4, type: "long-drive", label: "Buc-ee's -> Austin Lodging", importance: "primary" },

    { from: 4, to: 12, type: "local", label: "Lodging <-> UT Austin Co-op", importance: "secondary" },
    { from: 12, to: 13, type: "local-story", label: "UT Austin Co-op -> COTA", importance: "primary" },
    { from: 13, to: 4, type: "local", label: "COTA -> Lodging", importance: "secondary" },

    { from: 4, to: 14, type: "local", label: "Lodging <-> Texas Capitol", importance: "secondary" },
    { from: 4, to: 15, type: "local", label: "Lodging <-> Yard House", importance: "secondary" },
    { from: 4, to: 16, type: "local", label: "Lodging <-> Total Wine & More", importance: "secondary" },

    { from: 4, to: 17, type: "departure-drive", label: "Austin Lodging -> AUS", importance: "primary" },
    { from: 17, to: 18, type: "flight", label: "AUS -> MSP", importance: "primary" },
    { from: 18, to: 19, type: "flight", label: "MSP -> ICN", importance: "primary" }
  ],

  mediaGroups: {
    "incheon-airport-departure": {
      basePath: "assets/images/places/incheon-airport",
      images: []
    },
    "atlanta-airport": {
      basePath: "assets/images/places/atlanta-airport",
      images: []
    },
    "austin-airport-arrival": {
      basePath: "assets/images/places/austin-airport",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "austin-lodging": {
      basePath: "assets/images/places/austin-lodging",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "bjs-restaurant": {
      basePath: "assets/images/places/bjs-restaurant",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "the-domain": {
      basePath: "assets/images/places/the-domain",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "mueller-lake-park": {
      basePath: "assets/images/places/mueller-lake-park",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "stiles-switch-bbq": {
      basePath: "assets/images/places/stiles-switch-bbq",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "space-center-houston": {
      basePath: "assets/images/places/space-center-houston",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "houston-museum-natural-science": {
      basePath: "assets/images/places/houston-museum-natural-science",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "buc-ees-waller": {
      basePath: "assets/images/places/buc-ees-waller",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "ut-austin-coop": {
      basePath: "assets/images/places/ut-austin-coop",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "cota": {
      basePath: "assets/images/places/cota",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "texas-capitol": {
      basePath: "assets/images/places/texas-capitol",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "yard-house": {
      basePath: "assets/images/places/yard-house",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "total-wine-mueller": {
      basePath: "assets/images/places/total-wine-mueller",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "austin-airport-departure": {
      basePath: "assets/images/places/austin-airport",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "minneapolis-airport": {
      basePath: "assets/images/places/minneapolis-airport",
      images: [{ file: "cover.webp", caption: "" }]
    },
    "incheon-airport-return": {
      basePath: "assets/images/places/incheon-airport",
      images: []
    }
  }
};
