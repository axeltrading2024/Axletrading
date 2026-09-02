/* ============================================================
 *  全站配置与数据源 —— 想改品牌 / 产品 / 联系方式，只改这个文件
 * ============================================================
 *
 * 改 WhatsApp：下面的 whatsapp 用「国家码+号码」，不要加 + 或空格
 * 加产品：往 PRODUCTS 数组里照抄一条即可，image 会自动匹配同名图片
 * 加分类：往 CATEGORIES 里加一条，并放一张 img/cat/<slug>.png
 */

window.SITE_CONFIG = {
  "brand": "EddySupply",
  "tagline": "Wholesale Product Finder",
  "contactName": "Eddy",
  "whatsapp": "8615875209571",
  "whatsappDisplay": "+86 158 7520 9571",
  "greeting": "Hi Eddy! I'd like some information about your products.",
  "inquiryIntro": "Hi Eddy! I'd like a quote for the following:",
  "inquiryOutro": "Please send me pricing, MOQ and shipping details.",
  "heroTitle": "Wholesale products",
  "heroTitleAccent": "made simple.",
  "heroSubtitle": "Browse the full catalogue, build your inquiry list, and send it all to Eddy in one message. No more back-and-forth on WhatsApp.",
  "searchPlaceholder": "Search product, brand, category…",
  "seoDescription": "Discover wholesale electronics, perfumes, watches and accessories from EddySupply — then order in one tap on WhatsApp."
};

/* ---------------- 分类 ---------------- */
window.CATEGORIES = [
  {
    "slug": "speakers",
    "name": "Speakers",
    "tagline": "Room-filling sound",
    "image": "img/cat/speakers.png"
  },
  {
    "slug": "perfumes",
    "name": "Perfumes",
    "tagline": "Signature scents",
    "subcategories": [
      {
        "slug": "best-sellers",
        "name": "Best Sellers"
      },
      {
        "slug": "niche",
        "name": "Niche Perfumes"
      },
      {
        "slug": "arabic",
        "name": "Arabic Perfumes"
      }
    ],
    "image": "img/cat/perfumes.png"
  },
  {
    "slug": "earbuds-headphones",
    "name": "Earbuds & Headphones",
    "tagline": "Immersive audio",
    "image": "img/cat/earbuds-headphones.png"
  },
  {
    "slug": "watches",
    "name": "Watches",
    "tagline": "Time, refined",
    "subcategories": [
      {
        "slug": "luxury",
        "name": "Luxury Watches"
      },
      {
        "slug": "smart",
        "name": "Smart Watches"
      }
    ],
    "image": "img/cat/watches.png"
  },
  {
    "slug": "hair-dryers",
    "name": "Home applaince",
    "tagline": "Salon at home",
    "image": "img/cat/hair-dryers.png",
    "subcategories": [
      {
        "slug": "hair-care",
        "name": "hair care"
      },
      {
        "slug": "vacuum-cleaners",
        "name": "vacuum cleaners"
      }
    ]
  },
  {
    "slug": "sunglasses",
    "name": "Sunglasses",
    "tagline": "Frame your day",
    "subcategories": [
      {
        "slug": "ai",
        "name": "AI Glasses"
      },
      {
        "slug": "luxury",
        "name": "Luxury Glasses"
      }
    ],
    "image": "img/cat/sunglasses.png"
  },
  {
    "slug": "chargers",
    "name": "Cellphone accessories",
    "tagline": "Power and protection",
    "image": "img/cat/chargers.png",
    "subcategories": [
      {
        "slug": "chargers",
        "name": "chargers"
      },
      {
        "slug": "phonecase",
        "name": "phonecase"
      }
    ]
  },
  {
    "slug": "other",
    "name": "Other Products",
    "tagline": "The rest",
    "image": "img/cat/other.png"
  }
];

/* ---------------- 产品 ---------------- */
window.PRODUCTS = [
  {
    "id": "airpods-pro-2",
    "name": "AirPods Pro 2",
    "brand": "Apple",
    "price": "€10",
    "note": "ANC · Wireless charging case-serial number",
    "desc": "Adaptive noise cancellation with a precision-tuned driver and a MagSafe-ready charging case.",
    "collection": "earbuds-headphones",
    "popular": true,
    "keywords": [
      "airpods",
      "apple",
      "wireless",
      "earbuds",
      "anc"
    ]
  },
  {
    "id": "airpods-max",
    "name": "AirPods Max",
    "brand": "oem",
    "price": "€75",
    "note": "Over-ear · Spatial audio-meta earmuffs",
    "desc": "Over-ear design with computational audio, personalised spatial sound and up to 20 hours of battery.",
    "collection": "earbuds-headphones",
    "keywords": [
      "airpods",
      "apple",
      "headphones",
      "over-ear"
    ]
  },
  {
    "id": "airpods-4",
    "name": "AirPods 4",
    "brand": "oem",
    "price": "€12",
    "note": "New generation-ANC-serial number",
    "desc": "Redesigned for all-day comfort with a smaller case and improved call quality.",
    "collection": "earbuds-headphones",
    "keywords": [
      "airpods",
      "apple"
    ]
  },
  {
    "id": "sony-wh1000",
    "name": "Sony-style Wireless Headphones",
    "brand": "Sony",
    "price": "€65",
    "note": "Active noise cancelling",
    "desc": "Industry-leading noise cancellation, 30-hour battery and multipoint pairing.",
    "collection": "earbuds-headphones",
    "keywords": [
      "sony",
      "wh1000",
      "headphones",
      "anc"
    ]
  },
  {
    "id": "dior-sauvage",
    "name": "Dior Sauvage 100ml",
    "brand": "oem",
    "price": "€18",
    "note": "Icon fragrance",
    "desc": "A fresh, spicy signature built on bergamot and ambroxan — the modern classic.",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "popular": true,
    "keywords": [
      "dior",
      "sauvage",
      "perfume",
      "cologne"
    ],
    "variants": [
      {
        "name": "EDT",
        "price": "",
        "image": "img/prod/dior-sauvage-edp.jpg"
      },
      {
        "name": "Exilir",
        "price": "",
        "image": "img/prod/dior-sauvage-exilir.jpg"
      },
      {
        "name": "parfum",
        "price": "",
        "image": "img/prod/dior-sauvage-parfum.jpg"
      },
      {
        "name": "EDP",
        "price": "",
        "image": ""
      }
    ]
  },
  {
    "id": "jbl-charge",
    "name": "JBL Charge 6",
    "brand": "Oem",
    "price": "€20",
    "note": "Powerbank speaker-protable",
    "desc": "Room-filling sound plus a built-in powerbank to top up your phone on the go.",
    "collection": "speakers",
    "keywords": [
      "jbl",
      "charge",
      "speaker"
    ]
  },
  {
    "id": "boom-tower",
    "name": "Party Tower 120 Speaker",
    "brand": "EddySupply",
    "price": "€180",
    "note": "LED · Karaoke ready-outdoor swimming pool",
    "desc": "Tall-format party speaker with synchronised LED lighting and dual mic inputs for karaoke.",
    "collection": "speakers",
    "keywords": [
      "party",
      "tower",
      "karaoke"
    ]
  },
  {
    "id": "jbl-flip-7",
    "name": "JBL Flip 7",
    "brand": "oem",
    "price": "€18",
    "note": "Portable · Waterproof",
    "desc": "Rugged IP67 portable speaker with punchy bass and 10 hours of playtime.",
    "collection": "speakers",
    "popular": true,
    "keywords": [
      "jbl",
      "flip",
      "speaker",
      "bluetooth"
    ]
  },
  {
    "id": "bleu-chanel",
    "name": "Bleu de Chanel EDP 100ml",
    "brand": "Chanel",
    "price": "€18",
    "note": "Woody aromatic",
    "desc": "Woody-aromatic composition balancing citrus freshness with cedar and amber.",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "keywords": [
      "chanel",
      "bleu",
      "perfume"
    ]
  },
  {
    "id": "baccarat",
    "name": "Baccarat Rouge 540",
    "brand": "MFK",
    "price": "€18",
    "note": "Niche · Saffron amber",
    "desc": "Saffron, jasmine and ambergris — the cult niche scent with enormous sillage.",
    "collection": "perfumes",
    "subcategory": "niche",
    "keywords": [
      "baccarat",
      "niche",
      "perfume"
    ]
  },
  {
    "id": "valentino-born-in-roma",
    "name": "Valentino born in roma",
    "brand": "oem",
    "price": "€18",
    "note": "cool floral-woody elegance, capturing the rebellious yet sophisticated spirit of Rome",
    "desc": "Valentino Born in Roma is a \"cool couture\" fragrance that pays homage to the Eternal City. It perfectly balances the luxury of haute couture with a modern, free-spirited attitude, blending a luminous jasmine trio, warm bourbon vanilla, and cool contemporary woods",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "popular": true,
    "keywords": [
      "oud",
      "arabic",
      "perfume"
    ],
    "variants": [
      {
        "name": "intensely",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-intensely.jpg"
      },
      {
        "name": "uno",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-uno.jpg"
      },
      {
        "name": "extradose",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-extradose.jpg"
      },
      {
        "name": "donna",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-miss.jpg"
      },
      {
        "name": "caro fantasy",
        "price": "",
        "image": ""
      }
    ]
  },
  {
    "id": "rolex-submariner",
    "name": "Rolex Submariner Style",
    "brand": "Rolex",
    "price": "€65",
    "note": "Automatic · Steel",
    "desc": "Classic dive-watch silhouette with a ceramic bezel insert and automatic movement.",
    "collection": "watches",
    "subcategory": "luxury",
    "keywords": [
      "rolex",
      "submariner",
      "luxury",
      "watch"
    ]
  },
  {
    "id": "rolex-daytona",
    "name": "Rolex Daytona Style",
    "brand": "Rolex",
    "price": "€65",
    "note": "Chronograph",
    "desc": "Motorsport chronograph layout with a tachymeter bezel and screw-down pushers.",
    "collection": "watches",
    "subcategory": "luxury",
    "keywords": [
      "rolex",
      "daytona",
      "luxury",
      "watch"
    ]
  },
  {
    "id": "dyson-supersonic",
    "name": "Dyson Supersonic",
    "brand": "Dyson",
    "price": "€65",
    "note": "Ionic · 5 attachments-10 colors option",
    "desc": "Fast drying with intelligent heat control and five magnetic styling attachments.",
    "collection": "hair-dryers",
    "popular": true,
    "keywords": [
      "dyson",
      "supersonic",
      "hair",
      "dryer"
    ]
  },
  {
    "id": "ap-royal-oak",
    "name": "AP Royal Oak Style",
    "brand": "Audemars Piguet",
    "price": "€65",
    "note": "Octagonal bezel",
    "desc": "Iconic octagonal bezel with a tapisserie dial and integrated steel bracelet.",
    "collection": "watches",
    "subcategory": "luxury",
    "popular": true,
    "keywords": [
      "ap",
      "royal oak",
      "luxury"
    ]
  },
  {
    "id": "galaxy-watch",
    "name": "Galaxy Watch Ultra",
    "brand": "Samsung",
    "price": "€30",
    "note": "AMOLED · GPS",
    "desc": "Rugged titanium-style smartwatch with a bright AMOLED display and multi-day battery.",
    "collection": "watches",
    "subcategory": "smart",
    "keywords": [
      "samsung",
      "galaxy",
      "smart",
      "watch"
    ]
  },
  {
    "id": "apple-watch-11",
    "name": "Apple Watch Series 11",
    "brand": "Apple",
    "price": "€30",
    "note": "three colors option care your daily routine",
    "desc": "Bigger, brighter display with advanced health tracking and fast charging.",
    "collection": "watches",
    "subcategory": "smart",
    "popular": true,
    "keywords": [
      "apple",
      "watch",
      "smart"
    ]
  },
  {
    "id": "dyson-airwrap",
    "name": "Dyson Airwrap Style",
    "brand": "Dyson",
    "price": "$249",
    "note": "Multi-styler",
    "desc": "Curl, wave, smooth and dry with no extreme heat, using controlled Coanda airflow.",
    "collection": "hair-dryers",
    "keywords": [
      "dyson",
      "airwrap",
      "styler"
    ]
  },
  {
    "id": "dyson-v15",
    "name": "Dyson V15 detective",
    "brand": "Dyson",
    "price": "€165",
    "note": "Cordless · HEPA",
    "desc": "High-torque cordless vacuum with laser dust detection and full-machine HEPA filtration.",
    "collection": "hair-dryers",
    "subcategory": "vacuum-cleaners",
    "keywords": [
      "dyson",
      "v15",
      "vacuum",
      "cordless"
    ],
    "variants": [
      {
        "name": "V15 submarine",
        "price": "€180",
        "image": "img/prod/dyson-v15-v15-submarine.jpg"
      }
    ]
  },
  {
    "id": "cartier-glasses",
    "name": "Cartier Style Sunglasses",
    "brand": "Cartier",
    "price": "€35",
    "note": "Gold accents",
    "desc": "Slim metal frame with signature gold-tone detailing and gradient lenses.",
    "collection": "sunglasses",
    "subcategory": "luxury",
    "keywords": [
      "cartier",
      "sunglasses",
      "luxury",
      "glasses"
    ]
  },
  {
    "id": "rayban-meta",
    "name": "Ray-Ban Meta AI Glasses",
    "brand": "Ray-Ban",
    "price": "€75",
    "note": "Camera · Voice AI-real translation",
    "desc": "Hands-free capture, open-ear audio and a built-in voice assistant in a classic frame.",
    "collection": "sunglasses",
    "subcategory": "ai",
    "keywords": [
      "rayban",
      "meta",
      "ai",
      "smart glasses"
    ],
    "variants": [
      {
        "name": "MT5",
        "price": "€60",
        "image": "img/prod/rayban-meta-mt5.jpg"
      },
      {
        "name": "rayban meata",
        "price": "",
        "image": ""
      }
    ]
  },
  {
    "id": "gentle-monster",
    "name": "Gentle Monster Style",
    "brand": "Gentle Monster",
    "price": "€35",
    "note": "Acetate frame",
    "desc": "Chunky acetate silhouette with a sculpted browline and UV400 lenses.",
    "collection": "sunglasses",
    "subcategory": "luxury",
    "keywords": [
      "gentle monster",
      "sunglasses"
    ]
  },
  {
    "id": "gan-65w",
    "name": "GaN Fast Charger 65W",
    "brand": "EddySupply",
    "price": "€10",
    "note": "USB-C · 3-port",
    "desc": "Compact GaN charger delivering 65W across three ports for laptop, tablet and phone.",
    "collection": "chargers",
    "subcategory": "chargers",
    "keywords": [
      "charger",
      "usb-c",
      "gan"
    ]
  },
  {
    "id": "magsafe-pad",
    "name": "MagSafe Wireless Pad",
    "brand": "EddySupply",
    "price": "$25",
    "note": "15W",
    "desc": "Magnetic 15W wireless charging pad with an aluminium shell and slip-free base.",
    "collection": "chargers",
    "subcategory": "chargers",
    "keywords": [
      "magsafe",
      "wireless",
      "charger"
    ]
  },
  {
    "id": "iphone-case-clear",
    "name": "iPhone 17 official case",
    "brand": "EddySupply",
    "price": "€6",
    "note": "MagSafe compatible",
    "desc": "Slim clear case with reinforced corners and a full-strength MagSafe magnet ring.",
    "collection": "chargers",
    "subcategory": "phonecase",
    "keywords": [
      "iphone",
      "case",
      "clear"
    ],
    "variants": [
      {
        "name": "clear",
        "price": "",
        "image": "img/prod/iphone-case-clear-clear.jpg"
      },
      {
        "name": "Woven",
        "price": "",
        "image": "img/prod/iphone-case-clear-woven.jpg"
      },
      {
        "name": "silicon",
        "price": "",
        "image": "img/prod/iphone-case-clear-silicon.jpg"
      }
    ]
  },
  {
    "id": "leather-case",
    "name": "brand phoncase",
    "brand": "EddySupply",
    "price": "€5",
    "note": "premium protectiion-magsafe",
    "desc": "",
    "collection": "chargers",
    "subcategory": "phonecase",
    "keywords": [
      "otter",
      "case",
      "iphone"
    ],
    "variants": [
      {
        "name": "defender",
        "price": "",
        "image": "img/prod/leather-case-silicon-protection.jpg"
      },
      {
        "name": "symmetry+",
        "price": "",
        "image": "img/prod/leather-case-semmetry.jpg"
      }
    ]
  },
  {
    "id": "b",
    "name": "JBL boom box4",
    "brand": "",
    "price": "€40",
    "note": "protable-bass sound-",
    "desc": "",
    "collection": "speakers",
    "popular": true
  },
  {
    "id": "a",
    "name": "Armani strong with you",
    "brand": "Armani",
    "price": "€18",
    "note": "A captivating blend of sugar-coated chestnut and vanilla, defining modern masculine strength through a warm, addictive gourmand-woody scent",
    "desc": "Armani Stronger With You is an oriental gourmand fragrance crafted for the modern man. It opens with the spice of pink pepper, revealing a signature heart of sugar-coated chestnut and sage, before settling into a warm base of vanilla, amberwood, and cedar. The intertwined gold rings around the bottle's neck symbolize eternal love and connection, making it more than just a fragrance—it's a heartfelt vow of \"being stronger with you.\"",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "popular": true
  },
  {
    "id": "s",
    "name": "security camera",
    "brand": "EddySupply",
    "price": "€59",
    "note": "dual camera-360 protection",
    "desc": "",
    "collection": "other"
  }
];

/* ---------------- 派生：图片路径 ---------------- */
var FALLBACK_TO_CATEGORY = ["boom-tower","dyson-airwrap","magsafe-pad"];

(function buildImagePaths() {
  window.CATEGORIES.forEach(function (c) {
    c.image = 'img/cat/' + c.slug + '.png';
  });
  window.PRODUCTS.forEach(function (p) {
    p.categoryImage = 'img/cat/' + p.collection + '.png';
    p.image = FALLBACK_TO_CATEGORY.indexOf(p.id) > -1
      ? p.categoryImage
      : 'img/prod/' + p.id + '.jpg';
  });
})();