/* ============================================================
 *  全站配置与数据源 —— 想改品牌 / 产品 / 联系方式，只改这个文件
 * ============================================================
 *
 * 改 WhatsApp：下面的 whatsapp 用「国家码+号码」，不要加 + 或空格
 * 加产品：往 PRODUCTS 数组里照抄一条即可，image 会自动匹配同名图片
 * 加分类：往 CATEGORIES 里加一条，并放一张 img/cat/<slug>.png
 */

window.SITE_CONFIG = {
  "brand": "Axeltrading",
  "tagline": "Wholesale Product Finder",
  "contactName": "Eddy",
  "whatsapp": "4915224901963",
  "whatsappDisplay": "+49 152 2490 1963",
  "contactEmail": "axeltrading@163.com",
  "greeting": "Hi Eddy! I'd like some information about your products.",
  "inquiryIntro": "Hi Eddy! I'd like a quote for the following:",
  "inquiryOutro": "Please send me pricing, MOQ and shipping details.",
  "heroBadge": "Axeltrading · reliable supplier",
  "heroTitle": "Wholesale products",
  "heroTitleAccent": "Made Effortless",
  "heroSubtitle": "Explore the full catalog, curate your inquiry list, and send it to Eddy in a single message to get a fast quote.",
  "searchPlaceholder": "Search product, brand, category…",
  "seoDescription": "Discover wholesale electronics, perfumes, watches and accessories from EddySupply — then order in one tap on WhatsApp."
};

/* ---------------- 分类 ---------------- */
window.CATEGORIES = [
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
        "slug": "rolex-style",
        "name": "Rolex Style"
      },
      {
        "slug": "ap-style",
        "name": "AP Style"
      },
      {
        "slug": "tissot-style",
        "name": "Tissot Style"
      },
      {
        "slug": "cartier-style",
        "name": "Cartier Style"
      },
      {
        "slug": "swatch",
        "name": "Swatch"
      }
    ],
    "image": "img/cat/watches.png"
  },
  {
    "slug": "speakers",
    "name": "Speakers",
    "tagline": "Room-filling sound",
    "image": "img/cat/speakers.png"
  },
  {
    "slug": "hair-dryers",
    "name": "Home Appliance",
    "tagline": "Salon at home",
    "image": "img/cat/hair-dryers.png",
    "subcategories": [
      {
        "slug": "hair-care",
        "name": "Hair Care"
      },
      {
        "slug": "vacuum-cleaners",
        "name": "Vacuum Cleaners"
      }
    ]
  },
  {
    "slug": "other",
    "name": "Smart Products",
    "tagline": "Smart watch-AI glasses-Security",
    "image": "img/cat/other.png",
    "subcategories": [
      {
        "slug": "smart-watch",
        "name": "Smart Watch"
      },
      {
        "slug": "ai-glasses",
        "name": "AI Glasses"
      },
      {
        "slug": "other-products",
        "name": "Other Products"
      }
    ]
  },
  {
    "slug": "clothes-and-s-hose",
    "name": "Clothes & Shoes",
    "tagline": "fashion style",
    "subcategories": [
      {
        "slug": "clothes",
        "name": "Clothes"
      },
      {
        "slug": "shose",
        "name": "Shoes"
      }
    ],
    "image": "img/cat/clothes-and-s-hose.png"
  },
  {
    "slug": "sunglasses",
    "name": "Fashion Accessories",
    "tagline": "Frame your day",
    "subcategories": [
      {
        "slug": "luxury",
        "name": "Luxury Glasses"
      },
      {
        "slug": "luxury-bags",
        "name": "Luxury Bags"
      },
      {
        "slug": "belts",
        "name": "Belts"
      }
    ],
    "image": "img/cat/sunglasses.png"
  },
  {
    "slug": "chargers",
    "name": "Cellphone Accessories",
    "tagline": "Power and protection",
    "image": "img/cat/chargers.png",
    "subcategories": [
      {
        "slug": "chargers",
        "name": "Chargers"
      },
      {
        "slug": "phonecase",
        "name": "Phone Cases"
      },
      {
        "slug": "pencil-and-airtag",
        "name": "Pencil & AirTag"
      }
    ]
  }
];

/* ---------------- 产品 ---------------- */
window.PRODUCTS = [
  {
    "id": "airpods-pro-2",
    "name": "AirPods",
    "brand": "Apple",
    "price": "€12",
    "note": "ANC · Wireless charging case-serial number",
    "desc": "Adaptive noise cancellation with a precision-tuned driver and a MagSafe-ready charging case.",
    "collection": "earbuds-headphones",
    "popular": true,
    "video": "img/vid/airpods-pro-2.mp4",
    "keywords": [
      "airpods",
      "apple",
      "wireless",
      "earbuds",
      "anc"
    ],
    "variants": [
      {
        "name": "Airpods-pro2",
        "price": "",
        "image": "img/prod/airpods-pro-2-airpods-pro2.jpg"
      },
      {
        "name": "Airpods-gen4",
        "price": "",
        "image": "img/prod/airpods-pro-2-airpods-gen4.jpg"
      },
      {
        "name": "Airpods-pro3",
        "price": "",
        "image": "img/prod/airpods-pro-2-pro3.jpg"
      }
    ]
  },
  {
    "id": "airpods-max",
    "name": "AirPods Max",
    "brand": "OEM",
    "price": "€75",
    "note": "Over-ear · Spatial audio-meta earmuffs",
    "desc": "Over-ear design with computational audio, personalised spatial sound and up to 20 hours of battery.",
    "collection": "earbuds-headphones",
    "keywords": [
      "airpods",
      "apple",
      "headphones",
      "over-ear"
    ],
    "variants": [
      {
        "name": "midnight",
        "price": "",
        "image": "img/prod/airpods-max-night-black.jpg"
      },
      {
        "name": "starlight",
        "price": "",
        "image": "img/prod/airpods-max-starlight.jpg"
      },
      {
        "name": "orange",
        "price": "",
        "image": "img/prod/airpods-max-orange.jpg"
      },
      {
        "name": "purple",
        "price": "",
        "image": "img/prod/airpods-max-purple.jpg"
      },
      {
        "name": "blue",
        "price": "",
        "image": "img/prod/airpods-max-blue.jpg"
      }
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
    "brand": "Dior",
    "price": "€18",
    "note": "Icon fragrance",
    "desc": "A fresh, spicy signature built on bergamot and ambroxan — the modern classic.",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "popular": true,
    "video": "img/vid/dior-sauvage.mp4",
    "keywords": [
      "dior",
      "sauvage",
      "perfume",
      "cologne"
    ],
    "variants": [
      {
        "name": "Sauvage-EDP",
        "price": "",
        "image": "img/prod/dior-sauvage-sauvage-edp.jpg"
      },
      {
        "name": "Sauvage-Elixir",
        "price": "",
        "image": "img/prod/dior-sauvage-exilir.jpg"
      },
      {
        "name": "Sauvage-parfum",
        "price": "",
        "image": "img/prod/dior-sauvage-parfum.jpg"
      },
      {
        "name": "Sauvage-EDT",
        "price": "",
        "image": "img/prod/dior-sauvage-sauvage-edt.jpg"
      },
      {
        "name": "Homme-1",
        "price": "",
        "image": "img/prod/dior-sauvage-homme-1.jpg"
      },
      {
        "name": "Homme-2",
        "price": "",
        "image": "img/prod/dior-sauvage-homme-2.jpg"
      },
      {
        "name": "jadore-1",
        "price": "",
        "image": "img/prod/dior-sauvage-jadore-1.jpg"
      },
      {
        "name": "jadore-2",
        "price": "",
        "image": "img/prod/dior-sauvage-jadore-2.jpg"
      },
      {
        "name": "Miss Dior-1",
        "price": "",
        "image": "img/prod/dior-sauvage-miss-dior.jpg"
      },
      {
        "name": "Miss Dior-2",
        "price": "",
        "image": "img/prod/dior-sauvage-miss-dior-2.jpg"
      },
      {
        "name": "Miss Dior-3",
        "price": "",
        "image": "img/prod/dior-sauvage-miss-dior-3.jpg"
      }
    ]
  },
  {
    "id": "jbl-flip-7",
    "name": "JBL Flip 7",
    "brand": "JBL",
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
    ],
    "variants": [
      {
        "name": "Flip 7-purple",
        "price": "",
        "image": "img/prod/jbl-flip-7-flip-7-1.jpg"
      },
      {
        "name": "Flip7-blue",
        "price": "",
        "image": "img/prod/jbl-flip-7-flip7-2.jpg"
      },
      {
        "name": "Flip7-black",
        "price": "",
        "image": "img/prod/jbl-flip-7-flip7-3.jpg"
      },
      {
        "name": "Flip7-red",
        "price": "",
        "image": "img/prod/jbl-flip-7-flip7-4.jpg"
      },
      {
        "name": "Charge6-black1",
        "price": "",
        "image": "img/prod/jbl-flip-7-charge6.jpg"
      },
      {
        "name": "Charge6-black2",
        "price": "",
        "image": "img/prod/jbl-flip-7-charge6-black2.jpg"
      },
      {
        "name": "Charge6-blue",
        "price": "",
        "image": "img/prod/jbl-flip-7-charge6-blue.jpg"
      },
      {
        "name": "Charge6-purple",
        "price": "",
        "image": "img/prod/jbl-flip-7-charge6-purple.jpg"
      },
      {
        "name": "Charge6-red",
        "price": "",
        "image": "img/prod/jbl-flip-7-charge6-red.jpg"
      },
      {
        "name": "GO5-1",
        "price": "",
        "image": "img/prod/jbl-flip-7-go5-1.jpg"
      },
      {
        "name": "GO5-2",
        "price": "",
        "image": "img/prod/jbl-flip-7-go5-2.jpg"
      },
      {
        "name": "GO5-3",
        "price": "",
        "image": "img/prod/jbl-flip-7-go5-3.jpg"
      },
      {
        "name": "GO5-4",
        "price": "",
        "image": "img/prod/jbl-flip-7-go5-4.jpg"
      }
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
    ],
    "variants": [
      {
        "name": "blue channle",
        "price": "",
        "image": "img/prod/bleu-chanel-blue-channle.jpg"
      },
      {
        "name": "coco-1",
        "price": "",
        "image": "img/prod/bleu-chanel-coco-1.jpg"
      },
      {
        "name": "coco-2",
        "price": "",
        "image": "img/prod/bleu-chanel-coco-2.jpg"
      },
      {
        "name": "coco-3",
        "price": "",
        "image": "img/prod/bleu-chanel-coco-3.jpg"
      },
      {
        "name": "coco-4",
        "price": "",
        "image": "img/prod/bleu-chanel-coco-4.jpg"
      },
      {
        "name": "chance-1",
        "price": "",
        "image": "img/prod/bleu-chanel-chance-1.jpg"
      },
      {
        "name": "chance-2",
        "price": "",
        "image": "img/prod/bleu-chanel-chance-2.jpg"
      }
    ]
  },
  {
    "id": "valentino-born-in-roma",
    "name": "Valentino born in roma",
    "brand": "OEM",
    "price": "€18",
    "note": "cool floral-woody elegance, capturing the rebellious yet sophisticated spirit of Rome",
    "desc": "perfectly balances the luxury of haute couture with a modern, free-spirited attitude",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "video": "img/vid/valentino-born-in-roma.mp4",
    "keywords": [
      "valentino",
      "born in roma",
      "luxury perfumes"
    ],
    "variants": [
      {
        "name": "Born in roma-intensely",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-intensely.jpg"
      },
      {
        "name": "Born in roma",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-uno.jpg"
      },
      {
        "name": "Born in roma-extradose",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-extradose.jpg"
      },
      {
        "name": "Born in roma-coral fantasy",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-born-in-roma-caro-fantasy.jpg"
      },
      {
        "name": "Born in roma-donna intense",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-born-in-roma-donna-intense.jpg"
      },
      {
        "name": "Born in roma-donna coral fantasy",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-born-in-roma-donna-coral-fantasy.jpg"
      },
      {
        "name": "Born in roma-donna extradose",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-born-in-roma-donna-extradose.jpg"
      },
      {
        "name": "donna",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-donna.jpg"
      },
      {
        "name": "Uomo",
        "price": "",
        "image": "img/prod/valentino-born-in-roma-uomo.jpg"
      }
    ]
  },
  {
    "id": "a",
    "name": "Armani style perfumes",
    "brand": "Armani",
    "price": "€18",
    "note": "A captivating blend of sugar-coated chestnut and vanilla, defining modern masculine strength through a warm, addictive gourmand-woody scent",
    "desc": "an oriental gourmand fragrance crafted for the modern man.it's a heartfelt vow of \"being stronger with you.\"",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/a-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/a-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/a-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/a-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/a-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/a-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/a-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/a-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/a-9.jpg"
      }
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
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/baccarat-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/baccarat-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/baccarat-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/baccarat-4.jpg"
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
    "subcategory": "rolex-style",
    "popular": true,
    "video": "img/vid/rolex-submariner.mp4",
    "keywords": [
      "rolex",
      "submariner",
      "luxury",
      "watch"
    ],
    "variants": [
      {
        "name": "Black",
        "price": "",
        "image": "img/prod/rolex-submariner-black.jpg"
      },
      {
        "name": "Green-black",
        "price": "",
        "image": "img/prod/rolex-submariner-green-black.jpg"
      },
      {
        "name": "Green",
        "price": "",
        "image": "img/prod/rolex-submariner-green.jpg"
      },
      {
        "name": "Black-gold-1",
        "price": "",
        "image": "img/prod/rolex-submariner-black-golden.jpg"
      },
      {
        "name": "Blue",
        "price": "",
        "image": "img/prod/rolex-submariner-blue-golden.jpg"
      },
      {
        "name": "Blue-black",
        "price": "",
        "image": "img/prod/rolex-submariner-blue-black.jpg"
      },
      {
        "name": "Ultra-black",
        "price": "",
        "image": "img/prod/rolex-submariner-ultra-black.jpg"
      },
      {
        "name": "Labubu",
        "price": "",
        "image": "img/prod/rolex-submariner-labubu.jpg"
      },
      {
        "name": "Black-gold-2",
        "price": "",
        "image": "img/prod/rolex-submariner-black-gold-2.jpg"
      }
    ]
  },
  {
    "id": "r",
    "name": "Rolex day-date style",
    "brand": "Rolex",
    "price": "€65",
    "note": "classic-elegant-waterprrof-practical",
    "desc": "",
    "collection": "watches",
    "video": "img/vid/r.mp4",
    "keywords": [
      "Rolex",
      "datejust",
      "day date",
      "luxury",
      "watch"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/r-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/r-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/r-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/r-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/r-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/r-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/r-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/r-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/r-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/r-10.jpg"
      },
      {
        "name": "11",
        "price": "",
        "image": "img/prod/r-11.jpg"
      },
      {
        "name": "12",
        "price": "",
        "image": "img/prod/r-12.jpg"
      }
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
    "video": "img/vid/rolex-daytona.mp4",
    "keywords": [
      "rolex",
      "daytona",
      "luxury",
      "watch"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/rolex-daytona-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/rolex-daytona-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/rolex-daytona-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/rolex-daytona-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/rolex-daytona-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/rolex-daytona-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/rolex-daytona-7.jpg"
      }
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
    ],
    "variants": [
      {
        "name": "Classic Rose",
        "price": "",
        "image": "img/prod/dyson-supersonic-1.jpg"
      },
      {
        "name": "other color",
        "price": "",
        "image": "img/prod/dyson-supersonic-2.jpg"
      }
    ]
  },
  {
    "id": "r-2",
    "name": "Rolex GMT-Master style",
    "brand": "Rolex",
    "price": "€65",
    "note": "dual timing-luxury",
    "desc": "For dual time zone",
    "collection": "watches",
    "video": "img/vid/r-2.mp4",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/r-2-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/r-2-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/r-2-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/r-2-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/r-2-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/r-2-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/r-2-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/r-2-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/r-2-9.jpg"
      }
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
    "subcategory": "ap-style",
    "video": "img/vid/ap-royal-oak.mp4",
    "keywords": [
      "ap",
      "royal oak",
      "luxury"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/ap-royal-oak-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/ap-royal-oak-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/ap-royal-oak-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/ap-royal-oak-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/ap-royal-oak-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/ap-royal-oak-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/ap-royal-oak-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/ap-royal-oak-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/ap-royal-oak-9.jpg"
      }
    ]
  },
  {
    "id": "c-2",
    "name": "Cartier Style",
    "brand": "",
    "price": "€65",
    "note": "elegant-luxury",
    "desc": "",
    "collection": "watches",
    "subcategory": "cartier-style",
    "video": "img/vid/c-2.mp4",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/c-2-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/c-2-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/c-2-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/c-2-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/c-2-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/c-2-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/c-2-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/c-2-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/c-2-9.jpg"
      }
    ]
  },
  {
    "id": "t-2",
    "name": "Tissot Style",
    "brand": "Tissot",
    "price": "€65",
    "note": "Luxury-young-passion",
    "desc": "",
    "collection": "watches",
    "subcategory": "tissot-style",
    "video": "img/vid/t-2.mp4",
    "keywords": [
      "luxury watch",
      "tissot"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/t-2-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/t-2-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/t-2-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/t-2-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/t-2-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/t-2-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/t-2-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/t-2-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/t-2-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/t-2-10.jpg"
      }
    ]
  },
  {
    "id": "g-3",
    "name": "Gshock style",
    "brand": "",
    "price": "€18",
    "note": "sport-passion-young",
    "desc": "",
    "collection": "watches",
    "subcategory": "swatch",
    "variants": [
      {
        "name": "GA 2100",
        "price": "",
        "image": "img/prod/g-3-ga-2100.jpg"
      },
      {
        "name": "GA800",
        "price": "",
        "image": "img/prod/g-3-ga800.jpg"
      },
      {
        "name": "GA110",
        "price": "",
        "image": "img/prod/g-3-ga110.jpg"
      },
      {
        "name": "GA+BA couple",
        "price": "",
        "image": "img/prod/g-3-ga-ba-couple.jpg"
      }
    ]
  },
  {
    "id": "apple-watch-11",
    "name": "Apple Watch Series 11",
    "brand": "Apple",
    "price": "€30",
    "note": "smart watch-care your daily routine",
    "desc": "Bigger, brighter display with advanced health tracking and fast charging.",
    "collection": "other",
    "subcategory": "smart-watch",
    "popular": true,
    "keywords": [
      "apple",
      "watch",
      "smart"
    ],
    "variants": [
      {
        "name": "S11",
        "price": "",
        "image": "img/prod/apple-watch-11-s11.jpg"
      },
      {
        "name": "Ultra3",
        "price": "",
        "image": "img/prod/apple-watch-11-ultra3.jpg"
      }
    ]
  },
  {
    "id": "galaxy-watch",
    "name": "Galaxy Watch",
    "brand": "Samsung",
    "price": "€30",
    "note": "AMOLED · GPS",
    "desc": "Rugged titanium-style smartwatch with a bright AMOLED display and multi-day battery.",
    "collection": "other",
    "subcategory": "smart-watch",
    "keywords": [
      "samsung",
      "galaxy",
      "smart",
      "watch"
    ],
    "variants": [
      {
        "name": "Galaxy serial 8",
        "price": "",
        "image": "img/prod/galaxy-watch-serial8-classic.jpg"
      },
      {
        "name": "Galaxy ultra",
        "price": "",
        "image": "img/prod/galaxy-watch-galaxy-ultra.jpg"
      },
      {
        "name": "Galaxyserial 9",
        "price": "",
        "image": "img/prod/galaxy-watch-serial-9.jpg"
      },
      {
        "name": "Galaxyultra2",
        "price": "",
        "image": "img/prod/galaxy-watch-ultra2.jpg"
      }
    ]
  },
  {
    "id": "dyson-airwrap",
    "name": "Dyson Airwrap Style",
    "brand": "Dyson",
    "price": "€150",
    "note": "Multi-styler",
    "desc": "Curl, wave, smooth and dry with no extreme heat, using controlled Coanda airflow.",
    "collection": "hair-dryers",
    "keywords": [
      "dyson",
      "airwrap",
      "styler"
    ],
    "variants": [
      {
        "name": "HS05-1",
        "price": "€135",
        "image": "img/prod/dyson-airwrap-1.jpg"
      },
      {
        "name": "HS05-2",
        "price": "€135",
        "image": "img/prod/dyson-airwrap-2.jpg"
      },
      {
        "name": "HS05-3",
        "price": "€135",
        "image": "img/prod/dyson-airwrap-3.jpg"
      },
      {
        "name": "HS05-4",
        "price": "€135",
        "image": "img/prod/dyson-airwrap-hs05-4.jpg"
      },
      {
        "name": "HS08-1",
        "price": "€145",
        "image": "img/prod/dyson-airwrap-hs08-1.jpg"
      },
      {
        "name": "HS08-2",
        "price": "€145",
        "image": "img/prod/dyson-airwrap-hs08-2.jpg"
      },
      {
        "name": "HS08-3",
        "price": "€145",
        "image": "img/prod/dyson-airwrap-hs08-3.jpg"
      },
      {
        "name": "HS08-4",
        "price": "€145",
        "image": "img/prod/dyson-airwrap-hs08-4.jpg"
      },
      {
        "name": "Hs09-1",
        "price": "€150",
        "image": "img/prod/dyson-airwrap-hs09-1.jpg"
      },
      {
        "name": "Hs09-2",
        "price": "€150",
        "image": "img/prod/dyson-airwrap-hs09-2.jpg"
      }
    ]
  },
  {
    "id": "d",
    "name": "Dyson airstrait style",
    "brand": "",
    "price": "€130",
    "note": "tempreture control-harmless-gift box",
    "desc": "",
    "collection": "hair-dryers",
    "subcategory": "hair-care",
    "variants": [
      {
        "name": "Classic",
        "price": "",
        "image": "img/prod/d-1.jpg"
      },
      {
        "name": "Gift box",
        "price": "",
        "image": "img/prod/d-2.jpg"
      }
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
      },
      {
        "name": "V15 detective",
        "price": "",
        "image": "img/prod/dyson-v15-v15-detective.jpg"
      }
    ]
  },
  {
    "id": "prada-glasses",
    "name": "Prada Style Sunglasses",
    "brand": "Prada",
    "price": "€35",
    "note": "Gold accents",
    "desc": "Slim metal frame with signature gold-tone detailing and gradient lenses.",
    "collection": "sunglasses",
    "subcategory": "luxury",
    "keywords": [
      "prada",
      "sunglasses",
      "luxury",
      "glasses"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/prada-glasses-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/prada-glasses-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/prada-glasses-3.jpg"
      }
    ]
  },
  {
    "id": "r-3",
    "name": "Rayban style sunglasses",
    "brand": "Ray-Ban",
    "price": "€35",
    "note": "fashion-uvprotection",
    "desc": "",
    "collection": "sunglasses",
    "subcategory": "luxury",
    "keywords": [
      "rayban",
      "sunglasses"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/r-3-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/r-3-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/r-3-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/r-3-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/r-3-7.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/r-3-8.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/r-3-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/r-3-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/r-3-9.jpg"
      }
    ]
  },
  {
    "id": "gentle-monster",
    "name": "LV style sunglasses",
    "brand": "OEM",
    "price": "€35",
    "note": "Acetate frame",
    "desc": "Chunky acetate silhouette with a sculpted browline and UV400 lenses.",
    "collection": "sunglasses",
    "subcategory": "luxury",
    "keywords": [
      "LV",
      "luxury",
      "sunglasses"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/gentle-monster-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/gentle-monster-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/gentle-monster-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/gentle-monster-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/gentle-monster-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/gentle-monster-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/gentle-monster-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/gentle-monster-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/gentle-monster-9.jpg"
      }
    ]
  },
  {
    "id": "rayban-meta",
    "name": "Ray-Ban Meta AI Glasses",
    "brand": "Ray-Ban",
    "price": "€75",
    "note": "Camera · Voicerecord- AI-real translation",
    "desc": "Hands-free capture, open-ear audio and a built-in voice assistant in a classic frame.",
    "collection": "other",
    "subcategory": "ai-glasses",
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
        "name": "Rayban meta gen2",
        "price": "",
        "image": ""
      }
    ]
  },
  {
    "id": "gan-65w",
    "name": "GaN Fast Charger 45W",
    "brand": "EddySupply",
    "price": "€8",
    "note": "USB-C · 2-port",
    "desc": "Compact GaN charger delivering 65W across three ports for laptop, tablet and phone.",
    "collection": "chargers",
    "subcategory": "chargers",
    "keywords": [
      "charger",
      "usb-c",
      "gan"
    ],
    "variants": [
      {
        "name": "25W adapter",
        "price": "€4",
        "image": "img/prod/gan-65w-1.jpg"
      },
      {
        "name": "25W  fit",
        "price": "€6",
        "image": "img/prod/gan-65w-25w-fit.jpg"
      },
      {
        "name": "45W fit",
        "price": "€8",
        "image": "img/prod/gan-65w-45w-fit.jpg"
      },
      {
        "name": "45W adapter",
        "price": "€6",
        "image": "img/prod/gan-65w-45w-adapter.jpg"
      }
    ]
  },
  {
    "id": "magsafe-pad",
    "name": "cellphone charger",
    "brand": "EddySupply",
    "price": "€2",
    "note": "20W fast charger",
    "desc": "Magnetic 15W wireless charging pad with an aluminium shell and slip-free base.",
    "collection": "chargers",
    "subcategory": "chargers",
    "keywords": [
      "magsafe",
      "wireless",
      "charger"
    ],
    "variants": [
      {
        "name": "20W adapter",
        "price": "€2",
        "image": "img/prod/magsafe-pad-20w-charger.jpg"
      },
      {
        "name": "cable",
        "price": "€2",
        "image": "img/prod/magsafe-pad-cable.jpg"
      },
      {
        "name": "charger fit",
        "price": "€4",
        "image": "img/prod/magsafe-pad-charger-fit.jpg"
      },
      {
        "name": "wireless",
        "price": "€6",
        "image": "img/prod/magsafe-pad-wireless.jpg"
      },
      {
        "name": "magsafe pack",
        "price": "€8",
        "image": "img/prod/magsafe-pad-magsafe-pack.jpg"
      }
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
    "name": "Otter style phoncase",
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
    "note": "protable-bass sound-logo",
    "desc": "",
    "collection": "speakers",
    "keywords": [
      "JBL",
      "boom box",
      "portable"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/b-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/b-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/b-3.jpg"
      }
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
    ],
    "variants": [
      {
        "name": "party box120",
        "price": "€180",
        "image": "img/prod/boom-tower-party-box120.jpg"
      },
      {
        "name": "partybox 320",
        "price": "€225",
        "image": "img/prod/boom-tower-partybox-320.jpg"
      }
    ]
  },
  {
    "id": "s",
    "name": "security camera",
    "brand": "EddySupply",
    "price": "€59",
    "note": "dual lens dual views-AI alert",
    "desc": "",
    "collection": "other",
    "subcategory": "other-products",
    "keywords": [
      "camera",
      "security"
    ],
    "variants": [
      {
        "name": "dual lens",
        "price": "",
        "image": ""
      }
    ]
  },
  {
    "id": "n",
    "name": "NFC card",
    "brand": "",
    "price": "€2",
    "note": "NFC card-google card",
    "desc": "tap and rate you  five star",
    "collection": "other",
    "subcategory": "other-products",
    "popular": true,
    "keywords": [
      "NFC",
      "google"
    ],
    "variants": [
      {
        "name": "sticker",
        "price": "",
        "image": "img/prod/n-sticker.jpg"
      },
      {
        "name": "stand white",
        "price": "",
        "image": "img/prod/n-stand-white.jpg"
      },
      {
        "name": "stand black",
        "price": "",
        "image": "img/prod/n-stand-black.jpg"
      }
    ]
  },
  {
    "id": "m",
    "name": "Nike mind001",
    "brand": "Nike",
    "price": "€25",
    "note": "foot massage",
    "desc": "",
    "collection": "clothes-and-s-hose",
    "subcategory": "shose",
    "keywords": [
      "nike",
      "shose",
      "mind001"
    ],
    "variants": [
      {
        "name": "red",
        "price": "",
        "image": "img/prod/m-1.jpg"
      },
      {
        "name": "beige",
        "price": "",
        "image": "img/prod/m-2.jpg"
      },
      {
        "name": "black",
        "price": "",
        "image": "img/prod/m-3.jpg"
      },
      {
        "name": "grey",
        "price": "",
        "image": "img/prod/m-4.jpg"
      },
      {
        "name": "blue",
        "price": "",
        "image": "img/prod/m-blue.jpg"
      },
      {
        "name": "green",
        "price": "",
        "image": "img/prod/m-green.jpg"
      }
    ]
  },
  {
    "id": "g",
    "name": "Gucci style luxury bags",
    "brand": "",
    "price": "€85",
    "note": "leather-metal-logo",
    "desc": "",
    "collection": "sunglasses",
    "subcategory": "luxury-bags",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/g-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/g-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/g-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/g-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/g-5.jpg"
      }
    ]
  },
  {
    "id": "l",
    "name": "LV style bags",
    "brand": "",
    "price": "€85",
    "note": "fashional-elegance-metal logo",
    "desc": "",
    "collection": "sunglasses",
    "subcategory": "luxury-bags",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": ""
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/l-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/l-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/l-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/l-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/l-6.jpg"
      }
    ]
  },
  {
    "id": "g-2",
    "name": "Goyard bags",
    "brand": "",
    "price": "€8",
    "note": "understated luxury: featuring a feather-light, hand-painted Y-pattern that speaks only to those who truly know.",
    "desc": "",
    "collection": "sunglasses",
    "subcategory": "luxury-bags",
    "variants": [
      {
        "name": "1",
        "price": "€8",
        "image": "img/prod/g-2-1.jpg"
      },
      {
        "name": "2",
        "price": "€10",
        "image": "img/prod/g-2-2.jpg"
      },
      {
        "name": "3",
        "price": "€40",
        "image": "img/prod/g-2-3.jpg"
      },
      {
        "name": "4",
        "price": "€65",
        "image": "img/prod/g-2-4.jpg"
      }
    ]
  },
  {
    "id": "t",
    "name": "Tom Ford style perfume",
    "brand": "",
    "price": "€18",
    "note": "Bold Luxury-Private Sensuality-Scent of Power",
    "desc": "",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "keywords": [
      "tom ford",
      "luxury",
      "scent"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/t-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/t-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/t-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/t-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/t-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/t-6.jpg"
      }
    ]
  },
  {
    "id": "c",
    "name": "Carolina Herrera style",
    "brand": "",
    "price": "€18",
    "note": "Embrace your duality, rule with fearless elegance",
    "desc": "it is good to be bad",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/c-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/c-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/c-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/c-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/c-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/c-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/c-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/c-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/c-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/c-10.jpg"
      }
    ]
  },
  {
    "id": "jean-paul-gaultter",
    "name": "Jean Paul Gaultier style",
    "brand": "",
    "price": "€18",
    "note": "A sensory manifesto for the fearless: Celebrate diversity, embrace the scandal",
    "desc": "",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": ""
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-10.jpg"
      },
      {
        "name": "11",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-11.jpg"
      },
      {
        "name": "12",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-12.jpg"
      },
      {
        "name": "13",
        "price": "",
        "image": "img/prod/jean-paul-gaultter-13.jpg"
      }
    ]
  },
  {
    "id": "p",
    "name": "popular perfumes",
    "brand": "",
    "price": "€18",
    "note": "popular hot perfumes",
    "desc": "",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "variants": [
      {
        "name": "xerjoff erba pura",
        "price": "",
        "image": "img/prod/p-creed-pura-herb.jpg"
      },
      {
        "name": "xerjoff  coro",
        "price": "",
        "image": "img/prod/p-xerjoff-coro.jpg"
      },
      {
        "name": "xerjoff Accento",
        "price": "",
        "image": "img/prod/p-xerjoff-accento.jpg"
      },
      {
        "name": "marly layton",
        "price": "",
        "image": "img/prod/p-marly-layton.jpg"
      },
      {
        "name": "creed",
        "price": "",
        "image": "img/prod/p-creed.jpg"
      },
      {
        "name": "YSL libre",
        "price": "",
        "image": "img/prod/p-ysl-libre.jpg"
      },
      {
        "name": "YSL saint laurent",
        "price": "",
        "image": "img/prod/p-ysl-saint-laurent.jpg"
      }
    ]
  },
  {
    "id": "v",
    "name": "Versace style perfume",
    "brand": "",
    "price": "€18",
    "note": "",
    "desc": "",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/v-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/v-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/v-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/v-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/v-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/v-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/v-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/v-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/v-9.jpg"
      }
    ]
  },
  {
    "id": "l-2",
    "name": "LV style perfume",
    "brand": "",
    "price": "€30",
    "note": "Wear the art of travel, embrace your endless journey",
    "desc": "",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "keywords": [
      "lv",
      "perfumes",
      "brave"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/l-2-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/l-2-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/l-2-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/l-2-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/l-2-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/l-2-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/l-2-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/l-2-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/l-2-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/l-2-10.jpg"
      }
    ]
  },
  {
    "id": "paco-rabannel",
    "name": "Paco Rabanne style perfume",
    "brand": "",
    "price": "€18",
    "note": "",
    "desc": "",
    "collection": "perfumes",
    "subcategory": "best-sellers",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/paco-rabannel-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/paco-rabannel-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/paco-rabannel-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/paco-rabannel-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/paco-rabannel-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/paco-rabannel-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/paco-rabannel-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/paco-rabannel-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/paco-rabannel-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/paco-rabannel-10.jpg"
      },
      {
        "name": "11",
        "price": "",
        "image": "img/prod/paco-rabannel-11.jpg"
      },
      {
        "name": "12",
        "price": "",
        "image": "img/prod/paco-rabannel-12.jpg"
      },
      {
        "name": "13",
        "price": "",
        "image": "img/prod/paco-rabannel-13.jpg"
      },
      {
        "name": "14",
        "price": "",
        "image": "img/prod/paco-rabannel-14.jpg"
      },
      {
        "name": "15",
        "price": "",
        "image": "img/prod/paco-rabannel-15.jpg"
      }
    ]
  },
  {
    "id": "y",
    "name": "Yeezy style slide",
    "brand": "Yeezy",
    "price": "€15",
    "note": "comfortable-soft-fashion",
    "desc": "",
    "collection": "clothes-and-s-hose",
    "subcategory": "shose",
    "keywords": [
      "yeezy",
      "slide",
      "adidas"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/y-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/y-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/y-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/y-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/y-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/y-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/y-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/y-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/y-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/y-10.jpg"
      },
      {
        "name": "11",
        "price": "",
        "image": "img/prod/y-11.jpg"
      }
    ]
  },
  {
    "id": "football-training-kit",
    "name": "Football training kit",
    "brand": "",
    "price": "€30",
    "note": "quick-dry fabric -maximum comfort-unrestricted movement",
    "desc": "",
    "collection": "clothes-and-s-hose",
    "subcategory": "clothes",
    "keywords": [
      "football kit",
      "trainning kit"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/football-training-kit-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/football-training-kit-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/football-training-kit-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/football-training-kit-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/football-training-kit-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/football-training-kit-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/football-training-kit-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/football-training-kit-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/football-training-kit-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/football-training-kit-10.jpg"
      },
      {
        "name": "11",
        "price": "",
        "image": "img/prod/football-training-kit-11.jpg"
      },
      {
        "name": "12",
        "price": "",
        "image": "img/prod/football-training-kit-12.jpg"
      },
      {
        "name": "13",
        "price": "",
        "image": "img/prod/football-training-kit-13.jpg"
      },
      {
        "name": "14",
        "price": "",
        "image": "img/prod/football-training-kit-14.jpg"
      },
      {
        "name": "15",
        "price": "",
        "image": "img/prod/football-training-kit-15.jpg"
      }
    ]
  },
  {
    "id": "j",
    "name": "jersey",
    "brand": "EddySupply",
    "price": "€15",
    "note": "football club or national team jersey",
    "desc": "numbers and name could be customized, vintage style are also in stock",
    "collection": "clothes-and-s-hose",
    "subcategory": "clothes",
    "keywords": [
      "jersey. football kit",
      "club jersey"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/j-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/j-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/j-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/j-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/j-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/j-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/j-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/j-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/j-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/j-10.jpg"
      },
      {
        "name": "11",
        "price": "",
        "image": "img/prod/j-11.jpg"
      },
      {
        "name": "12",
        "price": "",
        "image": "img/prod/j-12.jpg"
      }
    ]
  },
  {
    "id": "m-2",
    "name": "wireless microphone",
    "brand": "",
    "price": "€30",
    "note": "wireless- 2-channel",
    "desc": "2-channel wireless microphone system",
    "collection": "speakers",
    "variants": [
      {
        "name": "gen1",
        "price": "",
        "image": "img/prod/m-2-gen1.jpg"
      },
      {
        "name": "gen2",
        "price": "",
        "image": "img/prod/m-2-gen2.jpg"
      }
    ]
  },
  {
    "id": "s-2",
    "name": "Sony style",
    "brand": "",
    "price": "€18",
    "note": "bluetooth 5.2-mini",
    "desc": "",
    "collection": "speakers"
  },
  {
    "id": "p-2",
    "name": "RIMOWA style",
    "brand": "",
    "price": "€8",
    "note": "suitcase style-colorful",
    "desc": "moq 10 units for one color",
    "collection": "chargers",
    "subcategory": "phonecase",
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/p-2-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/p-2-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/p-2-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/p-2-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/p-2-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/p-2-6.jpg"
      }
    ]
  },
  {
    "id": "l-3",
    "name": "Lululemon style",
    "brand": "Lululemon",
    "price": "€30",
    "note": "slim style and fashionable",
    "desc": "",
    "collection": "clothes-and-s-hose",
    "subcategory": "clothes",
    "keywords": [
      "lululemon",
      "slim clothes",
      "clothes"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/l-3-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/l-3-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/l-3-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/l-3-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/l-3-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/l-3-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/l-3-7.jpg"
      },
      {
        "name": "8",
        "price": "",
        "image": "img/prod/l-3-8.jpg"
      },
      {
        "name": "9",
        "price": "",
        "image": "img/prod/l-3-9.jpg"
      },
      {
        "name": "10",
        "price": "",
        "image": "img/prod/l-3-10.jpg"
      }
    ]
  },
  {
    "id": "l-4",
    "name": "LV belt",
    "brand": "",
    "price": "€30",
    "note": "luxury belt",
    "desc": "",
    "collection": "sunglasses",
    "subcategory": "belts",
    "keywords": [
      "LV",
      "luxury.belts"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/l-4-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/l-4-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/l-4-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/l-4-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/l-4-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/l-4-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/l-4-7.jpg"
      }
    ]
  },
  {
    "id": "h",
    "name": "Hermes style belt",
    "brand": "",
    "price": "€30",
    "note": "Hermes belt",
    "desc": "",
    "collection": "sunglasses",
    "subcategory": "belts",
    "keywords": [
      "Hermes",
      "luxury belt"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/h-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/h-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/h-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/h-4.jpg"
      }
    ]
  },
  {
    "id": "g-4",
    "name": "Gucci style luxury belt",
    "brand": "",
    "price": "€30",
    "note": "Luxry belt",
    "desc": "",
    "collection": "sunglasses",
    "subcategory": "belts",
    "keywords": [
      "Gucci",
      "luxury belt"
    ],
    "variants": [
      {
        "name": "1",
        "price": "",
        "image": "img/prod/g-4-1.jpg"
      },
      {
        "name": "2",
        "price": "",
        "image": "img/prod/g-4-2.jpg"
      },
      {
        "name": "3",
        "price": "",
        "image": "img/prod/g-4-3.jpg"
      },
      {
        "name": "4",
        "price": "",
        "image": "img/prod/g-4-4.jpg"
      },
      {
        "name": "5",
        "price": "",
        "image": "img/prod/g-4-5.jpg"
      },
      {
        "name": "6",
        "price": "",
        "image": "img/prod/g-4-6.jpg"
      },
      {
        "name": "7",
        "price": "",
        "image": "img/prod/g-4-7.jpg"
      }
    ]
  },
  {
    "id": "d-2",
    "name": "down",
    "brand": "EddySupply",
    "price": "€85",
    "note": "down jacket- down coat-fashion and warm",
    "desc": "",
    "collection": "clothes-and-s-hose",
    "subcategory": "clothes",
    "keywords": [
      "jacket",
      "down",
      "coat",
      "clothese",
      "burberry",
      "northface"
    ],
    "variants": [
      {
        "name": "Northface-1",
        "price": "",
        "image": "img/prod/d-2-northface-1.jpg"
      },
      {
        "name": "Burberry-1",
        "price": "",
        "image": "img/prod/d-2-burberry-1.jpg"
      },
      {
        "name": "Burberry-2",
        "price": "",
        "image": "img/prod/d-2-burberry-2.jpg"
      }
    ]
  },
  {
    "id": "s-3",
    "name": "Apple stylus",
    "brand": "Apple",
    "price": "€18",
    "note": "smart pencil-bluetooth connection",
    "desc": "",
    "collection": "chargers",
    "subcategory": "pencil-and-airtag",
    "keywords": [
      "apple",
      "pencil",
      "stylus"
    ],
    "variants": [
      {
        "name": "Pencil pro",
        "price": "",
        "image": "img/prod/s-3-pencil-pro.jpg"
      },
      {
        "name": "Pencil gen3",
        "price": "",
        "image": "img/prod/s-3-pencil-gen3.jpg"
      }
    ]
  }
];

/* ---------------- 派生：图片路径（分类图与产品图相互独立） ---------------- */
(function buildImagePaths() {
  window.CATEGORIES.forEach(function (c) {
    c.image = 'img/cat/' + c.slug + '.png';
  });
  window.PRODUCTS.forEach(function (p) {
    p.image = 'img/prod/' + p.id + '.jpg';
  });
})();