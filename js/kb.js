/**
 * js/kb.js —— 自动接待助理「意图库」
 *
 * 这份文件是挂件的大脑：
 *   1) 现在（规则版）—— assistant.js 用 keywords 匹配买家问题，回一段标准答案；
 *   2) 以后（AI 版）—— 同一份 intent/answer 可以直接喂给大模型，换引擎不用重写文案。
 *
 * 口径来源：eddytrading.com 站点 i18n.js FAQ 1–9 / How-it-works / SITE_CONFIG，
 * 由「EddySupply 自动接待 · 应答知识库」整理而来。
 * ⚠️ 改动前先确认站端口径，两边说法要一致（历史上踩过幻灯片与站点分叉的坑）。
 *
 * 兼容浏览器与 Node：Node 下 require() 直接拿到对象，便于跑冒烟测试。
 */
(function (root, factory) {
  var KB = factory();
  if (typeof module === 'object' && module.exports) module.exports = KB;
  else root.ASSISTANT_KB = KB;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KB = {
    version: '1.0.0',
    updated: '2026-10-28',

    /* ---------------- 品牌与联络 ---------------- */
    brand: {
      name: 'Axeltrading',
      site: 'EddySupply',
      url: 'https://eddytrading.com',
    },
    contact: {
      /* 挂件「转人工」专用线：Eddy 2026-10-28 指定为 +86 158 7520 9571。
         注意与站点询盘主号（data.js 的 +49 152 2490 1963）是两条不同的线：
         站点的下单/报价/物流仍走 +49，这里只负责把聊到一半的买家转到真人。 */
      whatsapp: '8615875209571',
      whatsappDisplay: '+86 158 7520 9571',
      email: 'axeltrading@163.com', /* 邮箱保持不变 */
      hours: 'Mon–Sat 9:00–18:00 (GMT+8)',
      replyWithin: '24 hours',
    },

    /* ---------------- 界面文案 ---------------- */
    ui: {
      title: { en: 'Axeltrading Assistant', es: 'Asistente Axeltrading' },
      status: { en: 'Online · replies within 24h', es: 'En línea · respuesta en 24 h' },
      welcome: {
        en: "Hi! I'm the Axeltrading assistant. Ask me about products, MOQ, pricing, shipping or payment — or pick a topic below.",
        es: '¡Hola! Soy el asistente de Axeltrading. Pregúntame por productos, MOQ, precios, envío o pago — o elige un tema abajo.',
      },
      placeholder: { en: 'Type your question…', es: 'Escribe tu pregunta…' },
      handoff: { en: 'Talk to a human on WhatsApp →', es: 'Hablar con una persona por WhatsApp →' },
      send: { en: 'Send', es: 'Enviar' },
      typing: { en: 'Eddy’s assistant is typing…', es: 'El asistente está escribiendo…' },
      teaser: {
        en: 'Questions about MOQ or shipping?',
        es: '¿Dudas sobre MOQ o envío?',
      },
      leadTitle: { en: 'Leave your contact', es: 'Déjanos tu contacto' },
      leadContact: { en: 'WhatsApp or email', es: 'WhatsApp o email' },
      leadMsg: { en: 'Your question', es: 'Tu pregunta' },
      leadSend: { en: 'Send to Eddy', es: 'Enviar a Eddy' },
      leadNote: { en: 'Eddy reads every request himself. No spam, ever.', es: 'Eddy lee cada solicitud en persona. Sin spam.' },
      leadOk: {
        en: "Got it — Eddy has your details and will reply within 24 hours.",
        es: 'Recibido — Eddy ya tiene tus datos y responderá en 24 horas.',
      },
      leadErr: {
        en: 'The online form is unavailable right now. Use WhatsApp instead — it opens with your message already written.',
        es: 'El formulario no está disponible ahora. Usa WhatsApp: se abrirá con tu mensaje ya escrito.',
      },
      leadPlaceholder: {
        en: '+1 555 000 1234 or you@company.com',
        es: '+1 555 000 1234 o tu@empresa.com',
      },
    },

    /* ---------------- 快捷问题（对应挂件面板上的 6 个按钮） ---------------- */
    quickReplies: [
      { id: 'catalog', label: { en: 'Products & categories', es: 'Productos y categorías' } },
      { id: 'pricing', label: { en: 'Pricing & MOQ', es: 'Precios y MOQ' } },
      { id: 'shipping', label: { en: 'Shipping & delivery', es: 'Envío y entrega' } },
      { id: 'payment', label: { en: 'Payment & after-sales', es: 'Pago y postventa' } },
      { id: 'custom', label: { en: 'Custom branding (OEM)', es: 'Marca propia (OEM)' } },
      { id: 'dropship', label: { en: 'Dropshipping', es: 'Dropshipping' } },
    ],

    /* ---------------- 意图（标准问答） ---------------- */
    intents: [
      {
        id: 'catalog',
        label: { en: 'Products & categories', es: 'Productos y categorías' },
        short: {
          en: 'We carry 9 collections and 1000+ products — perfumes, audio, watches, hair care, speakers, smart devices, bags, phone cases and chargers. Tell me which one interests you and I’ll pull a shortlist.',
          es: 'Tenemos 9 colecciones y más de 1000 productos: perfumes, audio, relojes, cuidado del cabello, bocinas, dispositivos inteligentes, bolsos, fundas y cargadores. Dime cuál te interesa y te preparo una lista.',
        },
        keywords: [
          'product', 'products', 'catalog', 'catalogue', 'category', 'categories',
          'what do you sell', 'what do you have', 'what do you offer', 'items', 'stock',
          'collection', 'collections', 'assortment',
          'perfume', 'perfumes', 'watch', 'watches', 'bag', 'bags', 'shoes', 'electronics',
          'earbuds', 'headphones', 'speaker', 'speakers', 'charger', 'chargers',
          '产品', '目录', '品类', '香水', '手表', '包', '鞋', '电子', '现货', '卖什么', '有哪些', '商品',
        ],
        answer: {
          en: 'We carry 9 collections and 1000+ products:\n• Perfumes — best sellers, niche, Arabic\n• Audio — earbuds & headphones\n• Watches\n• Hair care\n• Speakers\n• Smart devices — smart watch, AI glasses, smart home\n• Bags\n• Phone cases & frames\n• Chargers & power protection\n\nBrowse and search everything at eddytrading.com — no sign-up needed. Tell me which collection interests you and I\'ll put together a shortlist for you.',
          es: 'Tenemos 9 colecciones y más de 1000 productos:\n• Perfumes — más vendidos, nicho, árabes\n• Audio — auriculares\n• Relojes\n• Cuidado del cabello\n• Bocinas\n• Dispositivos inteligentes — smartwatch, gafas IA, hogar inteligente\n• Bolsos\n• Fundas y marcos para el móvil\n• Cargadores y protección\n\nExplora todo en eddytrading.com sin registrarte. Dime qué colección te interesa y te preparo una lista corta.',
        },
      },
      {
        id: 'pricing',
        label: { en: 'Pricing & MOQ', es: 'Precios y MOQ' },
        short: {
          en: 'MOQ is usually 12 pcs (some 10 pcs/colour, a few single units). Pricing is tiered — the more you order, the better the unit price. Send me the item and I’ll get you a quote within 24h.',
          es: 'El MOQ suele ser 12 unidades (algunos 10 por color, pocos sueltas). Los precios son escalonados: más pedidos, mejor precio. Envíame el artículo y te cotizo en 24 h.',
        },
        keywords: [
          'price', 'prices', 'pricing', 'cost', 'how much', 'unit price', 'wholesale price',
          'moq', 'minimum', 'minimum order', 'order quantity', 'qty', 'how many pieces',
          'tier', 'tiered', 'discount', 'bulk', 'sample', 'samples',
          '报价', '价格', '多少钱', '起订量', '最低', '批发价', '阶梯', '折扣', '样品', '多少件',
        ],
        answer: {
          en: 'MOQ is flexible and depends on the item:\n• Most products: 12 pcs\n• Some: 10 pcs per colour\n• A few: single units, so you can test the market first\n\nPricing is tiered — the more you order, the better the unit price. Samples are available as well, and the sample fee is usually deducted from your first order.\n\nFor an exact price on a specific item, send it over and you\'ll have a quote (unit price + MOQ + shipping) within 24 hours.',
          es: 'El MOQ es flexible y depende del artículo:\n• La mayoría de productos: 12 unidades\n• Algunos: 10 unidades por color\n• Algunos: unidades sueltas, para que pruebes el mercado primero\n\nLos precios son escalonados: más pedidos, mejor precio unitario. También hay muestras, y su coste suele descontarse de tu primer pedido.\n\nPara el precio exacto de un artículo, envíamelo y tendrás cotización (precio unitario + MOQ + envío) en 24 horas.',
        },
      },
      {
        id: 'shipping',
        label: { en: 'Shipping & delivery', es: 'Envío y entrega' },
        short: {
          en: 'Express air is ~8–10 working days to most countries; 18–22 days for perfumes & battery items; sea freight ~50 days from 20 kg. Where are you shipping to?',
          es: 'El aéreo exprés tarda ~8–10 días hábiles a la mayoría de países; 18–22 días para perfumes y artículos con batería; marítimo ~50 días desde 20 kg. ¿A qué país envías?',
        },
        keywords: [
          'shipping', 'ship', 'shipment', 'delivery', 'deliver', 'freight', 'courier', 'postage',
          'how long', 'how many days', 'when will it arrive', 'dispatch', 'lead time', 'transit',
          '物流', '运费', '发货', '交期', '几天', '多久', '到货', '快递', '海运', '国际运输',
        ],
        answer: {
          en: 'We ship worldwide. Freight is a first-kilo rate plus a per-kilo rate on chargeable weight — whichever is heavier, actual or volumetric, rounded up to the next kg.\n• Express air (DHL / UPS / FedEx): usually 8–10 working days\n• Perfumes & battery items: dedicated sensitive-goods line, about 18–22 days\n• Sea freight: from 20 kg, around 50 days — lowest cost per kg\n\nRates: Europe €30 first kg + €10/kg · North America $40 + $15/kg · Australia & NZ $30 + $10/kg. Other destinations are quoted per shipment.\n\nDuties: DDP to the US and Europe (we clear it, the invoice price is the landed price). Elsewhere DAP — duties paid by the buyer. In-stock items ship within 24–48 hours after payment. Transit times are carrier estimates, not guaranteed.',
          es: 'Enviamos a todo el mundo. El flete se cobra con una tarifa de primer kilo más una tarifa por kilo sobre el peso facturable — el mayor entre el real y el volumétrico, redondeado al kilo siguiente.\n• Aéreo exprés (DHL / UPS / FedEx): normalmente 8–10 días laborables\n• Perfumes y artículos con batería: línea dedicada de productos sensibles, unos 18–22 días\n• Marítimo: desde 20 kg, unos 50 días — el menor coste por kilo\n\nTarifas: Europa 30 € primer kilo + 10 €/kg · Norteamérica 40 $ + 15 $/kg · Australia y NZ 30 $ + 10 $/kg. Otros destinos se cotizan por envío.\n\nAranceles: DDP a EE. UU. y Europa (nosotros lo gestionamos, el precio de factura es el precio final). En el resto, DAP — el comprador paga los aranceles. Los artículos en stock se envían en 24–48 horas tras el pago. Los tiempos son estimaciones del transportista.',
        },
      },
      {
        id: 'payment',
        label: { en: 'Payment & after-sales', es: 'Pago y postventa' },
        short: {
          en: 'We take T/T bank transfer (bulk), Alipay (small/repeat), and USDT / Western Union / Remitly (samples). Pay only to the account on the invoice; production starts after payment clears.',
          es: 'Aceptamos transferencia T/T (al por mayor), Alipay (pequeños/repetidos) y USDT / Western Union / Remitly (muestras). Paga solo a la cuenta de la factura; producción tras el pago.',
        },
        keywords: [
          'payment', 'payments', 'pay', 'paypal', 'invoice', 't/t', 'tt', 'bank transfer',
          'alipay', 'usdt', 'western union', 'remitly', 'credit card', 'card',
          '付款', '支付', '发票', '支付宝', '电汇', '转账', '货代', '怎么付',
        ],
        answer: {
          en: 'Payment options:\n• T/T bank transfer — best for bulk orders, formal invoice provided\n• Alipay — small orders and repeat buyers\n• USDT / Western Union / Remitly — fast, good for samples\n\nEvery order comes with a formal invoice showing the exact account to pay. Pay only to the account printed on that invoice — if anyone asks you to pay a different one, it isn\'t us. We start production or picking only after the payment clears.\n\nAfter-sales: if something arrives damaged or defective, send photos on WhatsApp within 7 days of delivery and we\'ll replace or refund the affected units.',
          es: 'Formas de pago:\n• Transferencia bancaria (T/T) — mejor para pedidos al por mayor, con factura formal\n• Alipay — pedidos pequeños y clientes que repiten\n• USDT / Western Union / Remitly — rápido, ideal para muestras\n\nCada pedido lleva factura formal con la cuenta exacta. Paga solo a la cuenta impresa en esa factura: si alguien te pide pagar a otra, no somos nosotros. Empezamos la producción o la preparación tras confirmarse el pago.\n\nPostventa: si algo llega dañado o defectuoso, envíanos fotos por WhatsApp dentro de los 7 días posteriores a la entrega y reemplazamos o reembolsamos las unidades afectadas.',
        },
      },
      {
        id: 'aftersales',
        label: { en: 'After-sales & warranty', es: 'Postventa y garantía' },
        short: {
          en: 'Damaged or defective? Send photos on WhatsApp within 7 days and we’ll replace or refund the affected units — transit damage is covered too.',
          es: '¿Dañado o defectuoso? Envíanos fotos por WhatsApp en 7 días y reemplazamos o reembolsamos las unidades afectadas; también el daño en tránsito.',
        },
        keywords: [
          'damaged', 'damage', 'broken', 'defect', 'defective', 'refund', 'return', 'replace',
          'replacement', 'warranty', 'quality', 'complaint', 'claim', 'wrong item', 'missing',
          '售后', '退款', '退货', '换货', '破损', '损坏', '质量', '投诉', '保修', '少件', '发错',
        ],
        answer: {
          en: 'We stand behind the goods:\n• Send photos on WhatsApp within 7 days of delivery\n• Damaged or defective units are replaced or refunded\n• Transit damage is covered — you don\'t pay twice for the same problem\n\nTell us what went wrong and how you\'d like it resolved (replacement, store credit or a partial refund) — we\'ll act on it without a long back-and-forth.',
          es: 'Respaldamos la mercancía:\n• Envíanos fotos por WhatsApp dentro de los 7 días posteriores a la entrega\n• Las unidades dañadas o defectuosas se reemplazan o reembolsan\n• Los daños en tránsito están cubiertos — no pagas dos veces por lo mismo\n\nCuéntanos qué pasó y cómo prefieres resolverlo (reemplazo, crédito o reembolso parcial) y lo gestionamos sin largas idas y venidas.',
        },
      },
      {
        id: 'custom',
        label: { en: 'Custom branding (OEM/ODM)', es: 'Marca propia (OEM/ODM)' },
        short: {
          en: 'Yes — logo, packaging and inserts are possible for many products. Custom work has its own MOQ, mould fees may apply, and sampling takes extra time. Send me your idea + quantity and Eddy will confirm.',
          es: 'Sí — logo, envase e insertos son posibles en muchos productos. El trabajo personalizado tiene su propio MOQ, pueden aplicar costes de molde y la muestra lleva tiempo extra. Envíame tu idea + cantidad y Eddy confirmará.',
        },
        keywords: [
          'custom', 'customization', 'customise', 'customize', 'oem', 'odm', 'private label',
          'white label', 'logo', 'branding', 'brand it', 'packaging', 'insert', 'gift box',
          '定制', '贴牌', '代工', '品牌定制', '包装', '礼盒', '刻字',
        ],
        answer: {
          en: 'Yes — for many products we can do custom logo, packaging and inserts.\n\nThree things to keep in mind before we quote:\n• Custom work has its own minimum quantity\n• Mould / tooling fees may apply, depending on the design\n• Sampling takes extra time before production starts\n\nSend me your idea and target quantity and Eddy will confirm what\'s feasible and the exact numbers — the specifics are best discussed directly.',
          es: 'Sí — en muchos productos podemos hacer logo, envase e insertos personalizados.\n\nTres cosas a tener en cuenta antes de cotizar:\n• El trabajo personalizado tiene su propia cantidad mínima\n• Pueden aplicarse costes de molde o herramienta, según el diseño\n• La muestra lleva tiempo extra antes de empezar la producción\n\nEnvíame tu idea y la cantidad objetivo y Eddy confirmará qué es viable y las cifras exactas — los detalles concretos se hablan mejor directamente.',
        },
      },
      {
        id: 'dropship',
        label: { en: 'Dropshipping', es: 'Dropshipping' },
        short: {
          en: 'Yes — including one-piece and blind shipping (your customer never sees our name). MOQ and shipping rates are the same as regular wholesale; you handle returns first, escalate quality issues to us.',
          es: 'Sí — incluido a una unidad y blind shipping (tu cliente nunca ve nuestro nombre). MOQ y tarifas igual que el mayorista normal; gestionas las devoluciones y nos escalas los problemas de calidad.',
        },
        keywords: [
          'dropship', 'dropshipping', 'drop ship', 'dropshipping service', 'blind shipping',
          'ship to customer', 'no inventory', 'reseller', 'fulfilment', 'fulfillment',
          '代发', '一件代发', '无痕发货', '铺货', '分销',
        ],
        answer: {
          en: 'Yes, we support dropshipping — including one-piece dropshipping and blind shipping, so your customer never sees our name on the parcel.\n\n• MOQ is the same as for regular wholesale orders\n• Shipping rates are the same as for regular wholesale orders\n• Returns and after-sales are handled by you first; if it turns out to be a product quality issue, escalate it to Axeltrading and we\'ll take it from there\n\nTell Eddy your niche and monthly volume and he\'ll share the listing data and the practical details.',
          es: 'Sí, trabajamos con dropshipping — incluido el envío a una unidad y el blind shipping, para que tu cliente nunca vea nuestro nombre en el paquete.\n\n• El MOQ es el mismo que en los pedidos mayoristas habituales\n• Las tarifas de envío son las mismas que en los pedidos mayoristas habituales\n• Las devoluciones y la postventa las gestionas tú primero; si al final resulta que es un problema de calidad del producto, escálalo a Axeltrading y lo asumimos desde ahí\n\nDile a Eddy tu nicho y el volumen mensual y te compartirá los datos de publicación y los detalles prácticos.',
        },
      },
      {
        id: 'contact',
        label: { en: 'Talk to a human', es: 'Hablar con una persona' },
        short: {
          en: 'I’ll connect you to Eddy — he replies within 24h on WhatsApp. Tap the button below and your message is pre-written.',
          es: 'Te paso con Eddy — responde en 24 h por WhatsApp. Toca el botón de abajo y tu mensaje ya estará escrito.',
        },
        keywords: [
          'whatsapp', 'contact', 'email', 'phone', 'call', 'talk', 'human', 'agent', 'someone',
          'representative', 'speak', 'manager', 'owner',
          '联系', '人工', '客服', '电话', '邮箱', '找谁', '真人',
        ],
        answer: {
          en: 'I\'ll pass you to Eddy directly — he replies within 24 hours, Mon–Sat 9:00–18:00 (GMT+8).\n\nUse the WhatsApp button below and your message is already written, or leave your contact here and he\'ll come back to you.',
          es: 'Te paso con Eddy directamente — responde en 24 horas, de lunes a sábado, 9:00–18:00 (GMT+8).\n\nUsa el botón de WhatsApp y tu mensaje ya estará escrito, o deja aquí tu contacto y él te responderá.',
        },
      },
    ],

    /* ---------------- 兜底 ---------------- */
    fallback: {
      en: 'Thanks — that\'s a detail Eddy confirms personally, so I don\'t want to guess.\n\nTwo quick options:\n• WhatsApp below — fastest, your message is pre-written\n• Leave your contact here and Eddy replies within 24 hours\n\nOr pick one of the topics above.',
      es: 'Gracias — ese detalle lo confirma Eddy en persona, así que no quiero improvisar.\n\nDos opciones rápidas:\n• WhatsApp abajo — lo más rápido, con el mensaje ya escrito\n• Déjanos tu contacto y Eddy responde en 24 horas\n\nO elige uno de los temas de arriba.',
    },
  };

  /* ---------------- 意图匹配（纯函数，可被 Node 直接测） ---------------- */

  function normalize(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 给一条输入打分。
   * 规则：完全相等 > 短语命中 > 单词命中；命中词越长权重越高。
   * @returns {{id:string,score:number,intent:object}|null}
   */
  KB.match = function (text) {
    var q = normalize(text);
    if (!q) return null;
    var best = null;
    KB.intents.forEach(function (intent) {
      var sc = 0;
      (intent.keywords || []).forEach(function (kw) {
        var k = normalize(kw);
        if (!k) return;
        if (q === k) {
          sc += 14;
          return;
        }
        if (q.indexOf(k) !== -1) {
          sc += 4 + Math.min(k.length, 14) * 0.3;
        }
      });
      if (sc > 0 && (!best || sc > best.score)) best = { id: intent.id, score: sc, intent: intent };
    });
    /* 门槛：低于 4 分视为没听懂，走兜底 */
    if (!best || best.score < 4) return null;
    return best;
  };

  KB.normalize = normalize;
  return KB;
});
