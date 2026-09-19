/* ============================================================
 *  多语言层（EN / ES）
 *  - 加载顺序：i18n.js 必须在 app.js 之前
 *  - 用法：
 *      · 静态/动态文案加 data-i18n="key"（applyLang 会回填 textContent）
 *      · 占位符加 data-i18n-ph="key"
 *      · 富文本加 data-i18n-html="key"
 *      · JS 里动态拼的文案用 window.T('key', {n: x})
 *  - 切换器注入到页头的 [data-lang-switch]
 * ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'eddysupply_lang';

  /* ---------------- 翻译词典 ---------------- */
  var I18N = {
    nav_home:           { en: 'Home', es: 'Inicio' },
    nav_popular:        { en: 'Popular', es: 'Populares' },
    nav_browse:         { en: 'Browse', es: 'Catálogo' },
    nav_about:          { en: 'About Us', es: 'Nosotros' },
    search_placeholder: { en: 'Search product, brand, category…', es: 'Busca producto, marca o categoría…' },
    search_aria:        { en: 'Search products', es: 'Buscar productos' },
    open_menu:          { en: 'Open menu', es: 'Abrir menú' },
    inquiry:            { en: 'Inquiry', es: 'Cotización' },
    chat_wa:            { en: 'Chat on WhatsApp', es: 'Chatea en WhatsApp' },
    drawer_title:       { en: 'Inquiry list', es: 'Lista de cotización' },
    drawer_count:       { en: '{n} item', es: '{n} artículo' },        // 复数在 T() 里处理
    products_total:     { en: 'Products total', es: 'Total productos' },
    send_wa:            { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp' },
    copy_link:          { en: '🔗 Copy share link', es: '🔗 Copiar enlace' },
    clear_list:         { en: 'Clear list', es: 'Vaciar lista' },
    drawer_empty:       { en: 'Your list is empty.<br>Add products and send them in one message.',
                           es: 'Tu lista está vacía.<br>Añade productos y envíalos en un mensaje.' },
    footer_tagline:     { en: 'Wholesale catalog of Axeltrading — electronics, perfumes, watches and accessories sourced for overseas retailers, Amazon sellers and dropshippers.',
                           es: 'Catálogo de mayoreo de Axeltrading — electrónica, perfumes, relojes y accesorios para minoristas, vendedores de Amazon y dropshippers.' },
    footer_shop:        { en: 'Shop', es: 'Tienda' },
    footer_all:         { en: 'All collections', es: 'Todas las colecciones' },
    footer_company:     { en: 'Company', es: 'Empresa' },
    footer_faq:         { en: 'FAQ', es: 'Preguntas' },
    footer_popular:     { en: 'Popular products', es: 'Productos populares' },
    footer_how:         { en: 'How it works', es: 'Cómo funciona' },
    footer_contact:     { en: 'Contact', es: 'Contacto' },
    footer_reply:       { en: 'Reply within 24 hours', es: 'Respondemos en 24 h' },
    footer_payment:     { en: 'Payment', es: 'Pago' },
    footer_shipping:    { en: 'Shipping', es: 'Envío' },
    footer_moq:         { en: 'MOQ', es: 'MOQ' },
    footer_wholesale_only: { en: 'Wholesale only · no retail orders', es: 'Solo mayoreo · sin ventas minoristas' },
    add_to_inquiry:     { en: 'Add to Inquiry', es: 'Añadir a cotización' },
    in_inquiry_list:    { en: 'In inquiry list', es: 'En la lista' },
    review_list:        { en: 'Review inquiry list', es: 'Ver lista' },
    product_not_found:  { en: 'Product not found', es: 'Producto no encontrado' },
    product_not_found_desc: { en: "The product you're looking for doesn't exist or has been removed.",
                              es: 'El producto que buscas no existe o ha sido retirado.' },
    back_home:          { en: 'Back home', es: 'Volver al inicio' },
    watch_video:        { en: '▶ Watch video', es: '▶ Ver vídeo' },
    show_photo:         { en: '🖼 Show photo', es: '🖼 Ver foto' },
    wholesale_vol:      { en: 'Wholesale · Ask for volume pricing', es: 'Mayoreo · Pide precio por volumen' },
    model_option:       { en: 'Model / Option', es: 'Modelo / Opción' },
    back_to:            { en: 'Back to ', es: 'Volver a ' },
    spec_brand:         { en: 'Brand', es: 'Marca' },
    spec_collection:    { en: 'Collection', es: 'Colección' },
    spec_shipping:      { en: 'Shipping', es: 'Envío' },
    spec_shipping_val:  { en: 'Worldwide · Quoted on request', es: 'Mundial · Cotizado bajo pedido' },
    spec_moq:           { en: 'MOQ', es: 'MOQ' },
    spec_flexible:      { en: 'Flexible', es: 'Flexible' },
    you_may_like:       { en: 'You may also like', es: 'También te puede gustar' },
    more_in:            { en: 'More in ', es: 'Más en ' },
    collection_not_found: { en: 'Collection not found', es: 'Colección no encontrada' },
    collection_not_found_desc: { en: "The collection you're looking for doesn't exist.",
                                 es: 'La colección que buscas no existe.' },
    cat_sub:            { en: '{n} products in this collection. Wholesale pricing — ask for a volume quote on WhatsApp. Add anything you like to your inquiry list.',
                          es: '{n} productos en esta colección. Precios de mayoreo — pide una cotización por volumen en WhatsApp. Añade lo que quieras a tu lista.' },
    sub_all:            { en: 'All', es: 'Todos' },
    nothing_here:       { en: 'Nothing here yet', es: 'Todavía nada aquí' },
    no_products_sub:    { en: 'No products in this sub-collection at the moment.',
                          es: 'No hay productos en esta subcolección por ahora.' },
    search_hint:        { en: 'Type to search across all 1000+ products — brand, product name or category.',
                          es: 'Escribe para buscar entre más de 1000 productos — marca, nombre o categoría.' },
    search_no_match:    { en: 'No products match that search.', es: 'Ningún producto coincide con esa búsqueda.' },
    browse_all:         { en: 'Browse all collections →', es: 'Ver todas las colecciones →' },
    hero_strip_what:    { en: 'What we ship', es: 'Lo que enviamos' },
    hero_strip_collections: { en: '{n} collections · 1000+ products', es: '{n} colecciones · 1000+ productos' },
    about_stat:         { en: '{n} of 9 collections', es: '{n} de 9 colecciones' },
    contact_wa_k:       { en: 'WhatsApp · fastest', es: 'WhatsApp · más rápido' },
    contact_wa_sub:     { en: 'Send your inquiry list — quote within 24 hours',
                           es: 'Envía tu lista — cotización en 24 h' },
    contact_mail_k:     { en: 'Email · catalogs & docs', es: 'Email · catálogos y docs' },
    contact_mail_sub:   { en: 'Price lists, shipping documents and invoices',
                           es: 'Listas de precios, documentos de envío y facturas' },
    shared_quote_list:  { en: 'Quote list · ', es: 'Lista de cotización · ' },
    shared_out_of_date: { en: 'This quote list is out of date', es: 'Esta lista de cotización está desactualizada' },
    shared_note_expired: { en: 'The items in this link are no longer in the catalog — our stock and prices change often. Message us and we’ll send you a fresh quotation.',
                            es: 'Los productos de este enlace ya no están en el catálogo — nuestro stock y precios cambian a menudo. Escríbenos y te enviaremos una cotización nueva.' },
    shared_review:      { en: '{n} product for your review', es: '{n} producto para tu revisión' },
    shared_note:        { en: 'Quantities are adjustable. Contact us for an official quotation.',
                          es: 'Las cantidades son ajustables. Contáctanos para una cotización oficial.' },
    toast_added:        { en: '{name} added to inquiry', es: '{name} añadido a la cotización' },
    toast_cleared:      { en: 'Inquiry list cleared', es: 'Lista vaciada' },
    toast_share:        { en: 'Share link copied — send it to your customer', es: 'Enlace copiado — envíalo a tu cliente' },
    copy_failed:        { en: 'Copy failed — please copy from the address bar', es: 'Copia fallida — cópialo de la barra de direcciones' },

    /* ---------------- About 页（静态文案） ---------------- */
    about_hero:         { en: 'Your wholesale product finder', es: 'Tu buscador de productos al por mayor' },
    about_lede:         { en: 'EddySupply is the wholesale catalog of <strong>Axeltrading</strong>, run by Eddy. We help overseas retailers, Amazon sellers and dropshippers source trending products — electronics, perfumes, watches and accessories — with clear photos, honest specs and fast, direct communication on WhatsApp. No middlemen, no marketplace fees, no guesswork.',
                           es: 'EddySupply es el catálogo de mayoreo de <strong>Axeltrading</strong>, dirigido por Eddy. Ayudamos a minoristas, vendedores de Amazon y dropshippers a abastecerse de productos de tendencia — electrónica, perfumes, relojes y accesorios — con fotos claras, especificaciones honestas y comunicación rápida y directa por WhatsApp. Sin intermediarios, sin comisiones de marketplace, sin adivinar.' },
    about_mosaic_what:  { en: 'What we ship', es: 'Lo que enviamos' },
    fact_products:      { en: 'products curated', es: 'productos seleccionados' },
    fact_countries:     { en: 'countries served', es: 'países atendidos' },
    fact_moq:           { en: 'flexible quantity', es: 'cantidad flexible' },
    fact_custom:        { en: 'OEM / ODM welcome', es: 'OEM / ODM bienvenido' },
    fact_reply:         { en: 'quote reply time', es: 'tiempo de cotización' },
    real_head1:         { en: 'Inside the operation', es: 'Dentro de la operación' },
    real_sub1:          { en: 'Shot in Guangdong', es: 'Fotografiado en Guangdong' },
    real_h2:            { en: 'Real photos, real packing room', es: 'Fotos reales, sala de empaque real' },
    real_lede:          { en: 'No stock renders and no borrowed pictures — these were taken in our own warehouse and packing room. It is the same place your order leaves from.',
                           es: 'Sin renders de stock ni fotos prestadas — estas se tomaron en nuestro propio almacén y sala de empaque. Es el mismo lugar de donde sale tu pedido.' },
    real_head2:         { en: 'Earbuds & headphones', es: 'Auriculares y earbuds' },
    real_sub2:          { en: 'Line & sample wall', es: 'Línea y muro de muestras' },
    real_h2_2:          { en: 'Where the audio range comes from', es: 'De dónde viene la línea de audio' },
    real_lede_2:        { en: 'The line that builds our earbuds and headphones, the burn-in racks every batch goes through, and the sample wall those models are photographed on.',
                           es: 'La línea que fabrica nuestros earbuds y auriculares, los racks de burn-in por los que pasa cada lote, y el muro de muestras donde se fotografían esos modelos.' },
    about_cap1:         { en: '<b>In stock right now</b><i>Dior, Chanel, YSL, Xerjoff, Creed and more — photographed on the packing table, not in a studio.</i>',
                           es: '<b>En stock ahora mismo</b><i>Dior, Chanel, YSL, Xerjoff, Creed y más — fotografiados en la mesa de empaque, no en un estudio.</i>' },
    about_cap2:         { en: '<b>Export-ready packing</b><i>Double-walled cartons, corner guards and stretch wrap on every order — box no., size and weight written by hand.</i>',
                           es: '<b>Empaque listo para exportar</b><i>Cajas de doble pared, protectores de esquina y film estirable en cada pedido — n.º de caja, tamaño y peso escritos a mano.</i>' },
    about_cap3:         { en: '<b>Signed off by Eddy</b><i>Nothing leaves the room until it is weighed, labelled and checked against your list.</i>',
                           es: '<b>Revisado y firmado por Eddy</b><i>Nada sale de la sala hasta que se pesa, etiqueta y verifica contra tu lista.</i>' },
    about_cap4:         { en: '<b>1,000+ SKUs on hand</b><i>Perfumes, watches, earbuds, speakers and accessories — laid out before a shipping day.</i>',
                           es: '<b>Más de 1.000 SKU en stock</b><i>Perfumes, relojes, earbuds, bocinas y accesorios — desplegados antes de un día de envío.</i>' },
    about_cap5:         { en: '<b>Shock-proof protection</b><i>Fragile goods travel inside air-pillow cushions, so glass and boxes arrive intact.</i>',
                           es: '<b>Protección antigolpes</b><i>Los frágiles viajan dentro de cojines de aire, para que el vidrio y las cajas lleguen intactos.</i>' },
    about_cap6:         { en: '<b>Every model, on the wall</b><i>ANC, TWS and Pro-style earbuds plus over-ear headphones — sample units kept on site, so you get a real answer instead of a guess.</i>',
                           es: '<b>Cada modelo, en el muro</b><i>Earbuds ANC, TWS y estilo Pro, además de auriculares over-ear — unidades de muestra en sitio, para darte una respuesta real y no un invento.</i>' },
    about_cap7:         { en: '<b>Assembled and checked by hand</b><i>Chips, batteries and shells go together on the line, then every unit is inspected before packing.</i>',
                           es: '<b>Ensamblados y revisados a mano</b><i>Chips, baterías y carcasas se unen en la línea; luego cada unidad se inspecciona antes de empacar.</i>' },
    about_cap8:         { en: '<b>Burn-in tested before packing</b><i>Charging and battery-cycle racks catch dead units at the factory, not in your customer’s hands.</i>',
                           es: '<b>Prueba de burn-in antes de empacar</b><i>Los racks de carga y ciclo de batería detectan unidades muertas en la fábrica, no en manos de tu cliente.</i>' },
    hiw_eyebrow:        { en: 'How it works', es: 'Cómo funciona' },
    hiw_title:          { en: 'How to order, pay & ship', es: 'Cómo pedir, pagar y enviar' },
    hiw_sub:            { en: 'Three steps from catalog to your door.', es: 'Tres pasos del catálogo a tu puerta.' },
    hiw_order_title:    { en: 'How to order?', es: '¿Cómo pedir?' },
    hiw_order_1t:       { en: 'Browse the catalog', es: 'Explora el catálogo' },
    hiw_order_1d:       { en: 'eddytrading.com — 1000+ products', es: 'eddytrading.com — más de 1000 productos' },
    hiw_order_2t:       { en: 'Add items to your inquiry list', es: 'Añade artículos a tu lista de cotización' },
    hiw_order_2d:       { en: 'One tap per item, kept in your browser', es: 'Un toque por artículo, guardado en tu navegador' },
    hiw_order_3t:       { en: 'Send the list on WhatsApp', es: 'Envía la lista por WhatsApp' },
    hiw_order_3d:       { en: 'The site writes the message for you', es: 'El sitio escribe el mensaje por ti' },
    hiw_order_4t:       { en: 'Get your quote within 24 hours', es: 'Recibe tu cotización en 24 h' },
    hiw_order_4d:       { en: 'Unit price, MOQ and shipping cost', es: 'Precio unitario, MOQ y costo de envío' },
    hiw_order_foot:     { en: 'No account needed — send your list as it is.', es: 'Sin cuenta — envía tu lista tal cual.' },
    hiw_pay_title:      { en: 'How to pay?', es: '¿Cómo pagar?' },
    hiw_pay_1t:         { en: 'T/T bank transfer', es: 'Transferencia bancaria (T/T)' },
    hiw_pay_1d:         { en: 'Best for bulk orders', es: 'Ideal para pedidos grandes' },
    hiw_pay_2t:         { en: 'Alipay', es: 'Alipay' },
    hiw_pay_2d:         { en: 'Small orders and repeat buyers', es: 'Pedidos pequeños y compradores frecuentes' },
    hiw_pay_3t:         { en: 'USDT · Western Union · Remitly', es: 'USDT · Western Union · Remitly' },
    hiw_pay_3d:         { en: 'Samples and fast payments', es: 'Muestras y pagos rápidos' },
    hiw_pay_4t:         { en: 'Formal invoice for every order', es: 'Factura formal en cada pedido' },
    hiw_pay_4d:         { en: 'Pay only to the account shown on it', es: 'Paga solo a la cuenta que aparece en ella' },
    hiw_pay_foot:       { en: 'Payment confirmed, then we start packing.', es: 'Pago confirmado, luego empezamos a empacar.' },
    hiw_ship_title:     { en: 'How about shipping?', es: '¿Cómo va el envío?' },
    hiw_ship_1t:        { en: 'Express air', es: 'Aéreo exprés' },
    hiw_ship_1d:        { en: 'DHL · UPS · FedEx — typically 8–10 working days', es: 'DHL · UPS · FedEx — típicamente 8–10 días hábiles' },
    hiw_ship_2t:        { en: 'Perfumes & batteries', es: 'Perfumes y baterías' },
    hiw_ship_2d:        { en: '18–22 days on the sensitive-goods line', es: '18–22 días en la línea de mercancías sensibles' },
    hiw_ship_3t:        { en: 'Sea freight', es: 'Flete marítimo' },
    hiw_ship_3d:        { en: '20 kg minimum — about 50 days, lowest cost per kg', es: 'Mínimo 20 kg — unos 50 días, menor costo por kg' },
    hiw_ship_4t:        { en: 'Duties', es: 'Aranceles' },
    hiw_ship_4d:        { en: 'DDP in the US & Europe, DAP elsewhere', es: 'DDP en EE. UU. y Europa, DAP en el resto' },
    hiw_ship_foot:      { en: 'Shipping is quoted per order, before you pay.', es: 'El envío se cotiza por pedido, antes de pagar.' },
    hiw_note:           { en: '<b>Transit times are carrier estimates, not guaranteed delivery dates.</b> In-stock items are dispatched within 24–48 hours after payment clears. If something arrives damaged, send photos within 7 days and we replace or refund the affected units.',
                           es: '<b>Los tiempos de tránsito son estimaciones de la transportista, no fechas garantizadas de entrega.</b> Los artículos en stock se despachan en 24–48 horas tras confirmar el pago. Si algo llega dañado, envía fotos en 7 días y reemplazamos o reembolsamos las unidades afectadas.' },
    faq_title:          { en: 'Frequently asked questions', es: 'Preguntas frecuentes' },
    faq1_q:             { en: 'How do I place an order?', es: '¿Cómo hago un pedido?' },
    faq1_a:             { en: '<p>Browse the catalog and add each item to your inquiry list — one tap per item and no account needed. Then send the list to Eddy on WhatsApp or by email: the site writes the message for you.</p><p>You get a quote within 24 hours with the unit price, MOQ and shipping cost. We start picking and packing once payment is confirmed, and we send you the tracking number as soon as your parcel leaves.</p>',
                           es: '<p>Entra al catálogo y agrega cada producto a tu lista de cotización — un clic por producto y sin necesidad de crear cuenta. Luego mándale la lista a Eddy por WhatsApp o por email: nosotros armamos el mensaje por ti.</p><p>Te enviamos la cotización en 24 h con el precio unitario, el MOQ y el envío. En cuanto confirmas el pago armamos y empacamos tu pedido, y te pasamos el número de seguimiento en cuanto sale.</p>' },
    faq2_q:             { en: 'What is the MOQ (minimum order quantity)?', es: '¿Qué es el MOQ (cantidad mínima de pedido)?' },
    faq2_a:             { en: '<p>MOQ is flexible and varies by product. Some items ship as single units for testing; better prices kick in at volume. Just ask on WhatsApp for the exact MOQ of anything you’re interested in.</p>',
                           es: '<p>El MOQ es flexible y cambia según el producto. Algunos los mandamos sueltos para que pruebes; el precio baja conforme compras más. Escríbenos por WhatsApp y te decimos el MOQ exacto de lo que te interese.</p>' },
    faq3_q:             { en: 'Can I get samples before a bulk order?', es: '¿Puedo pedir muestras antes de un pedido grande?' },
    faq3_a:             { en: '<p>Yes. Samples are recommended for first-time buyers — you only pay the sample price plus shipping. The sample cost can often be deducted from your first bulk order.</p>',
                           es: '<p>Sí. Si compras por primera vez, mejor pide muestras — solo pagas el precio de la muestra y el envío. Casi siempre podemos restar ese costo de tu primer pedido grande.</p>' },
    faq4_q:             { en: 'How is shipping handled and what does it cost?', es: '¿Cómo se maneja el envío y cuánto cuesta?' },
    faq4_a:             { en: '<p>We ship worldwide. Shipping isn’t a flat fee — it depends on weight, destination and speed (express air vs. sea freight). Send your inquiry list with your country and we quote the exact shipping cost before you pay anything.</p>',
                           es: '<p>Enviamos a todo el mundo. El envío no es una tarifa fija — depende del peso, destino y velocidad (aéreo exprés vs. flete marítimo). Envía tu lista con tu país y cotizamos el costo exacto antes de que pagues algo.</p>' },
    faq5_q:             { en: 'What payment methods do you accept?', es: '¿Qué métodos de pago aceptan?' },
    faq5_a:             { en: '<p>We accept bank transfer (T/T), Alipay, USDT, Western Union and Remitly:</p><ul><li><b>T/T bank transfer</b> — the usual route for bulk orders.</li><li><b>Alipay</b> — suits smaller orders and repeat buyers.</li><li><b>USDT · Western Union · Remitly</b> — fast, good for samples.</li></ul><p>Every order comes with a <b>formal invoice</b> showing the exact account to pay into. Pay only to the account on that invoice — if anyone asks you to pay somewhere else, it is not us. Production starts once payment is confirmed.</p>',
                           es: '<p>Aceptamos transferencia bancaria (T/T), Alipay, USDT, Western Union y Remitly:</p><ul><li><b>Transferencia bancaria (T/T)</b> — la vía usual para pedidos grandes.</li><li><b>Alipay</b> — para pedidos pequeños y compradores frecuentes.</li><li><b>USDT · Western Union · Remitly</b> — rápido, ideal para muestras.</li></ul><p>Cada pedido incluye una <b>factura formal</b> con la cuenta exacta donde pagar. Paga solo a la cuenta de esa factura — si alguien te pide pagar en otro lado, no somos nosotros. La producción empieza al confirmar el pago.</p>' },
    faq6_q:             { en: 'How long does delivery take?', es: '¿Cuánto tarda la entrega?' },
    faq6_a:             { en: '<p>In-stock items are dispatched within 24–48 hours after payment is confirmed.</p><ul><li>Express air by <b>DHL / UPS / FedEx</b> — typically <b>8–10 working days</b>.</li><li><b>Perfumes and battery products</b> — about <b>18–22 days</b>. Alcohol-based liquids and lithium batteries can’t travel on standard express, so they fly on a dedicated sensitive-goods line instead. It isn’t slower handling, it’s a different channel.</li><li><b>Sea freight</b> — minimum <b>20 kg</b>, about <b>50 days</b>. Lowest cost per kg for large, non-urgent orders.</li></ul><p>These are carrier estimates, not guaranteed delivery dates — we confirm the exact timeline with every quote.</p>',
                           es: '<p>Los artículos en stock se despachan en 24–48 horas tras confirmar el pago.</p><ul><li>Aéreo exprés por <b>DHL / UPS / FedEx</b> — típicamente <b>8–10 días hábiles</b>.</li><li><b>Perfumes y productos con batería</b> — unos <b>18–22 días</b>. Los líquidos a base de alcohol y las baterías de litio no viajan en exprés estándar, así que van por una línea dedicada de mercancías sensibles. No es manejo más lento, es otro canal.</li><li><b>Flete marítimo</b> — mínimo <b>20 kg</b>, unos <b>50 días</b>. Menor costo por kg para pedidos grandes y no urgentes.</li></ul><p>Son estimaciones de la transportista, no fechas garantizadas — confirmamos la línea de tiempo exacta con cada cotización.</p>' },
    faq7_q:             { en: 'Are import duties and taxes included?', es: '¿Los aranceles e impuestos de importación están incluidos?' },
    faq7_a:             { en: '<p>It depends on where you are:</p><ul><li><b>United States and Europe — DDP.</b> We clear customs and pay the duties, so the price on your invoice is the final price. Nothing extra to settle on delivery.</li><li><b>All other regions — DAP.</b> We deliver to your address; duties and taxes are paid by you on arrival.</li></ul><p>We declare your goods at their real value — no under-declaring, which keeps your customs records clean. Tell Eddy your destination and we quote DDP or DAP up front.</p>',
                           es: '<p>Depende de dónde estés:</p><ul><li><b>Estados Unidos y Europa — DDP.</b> Nosotros hacemos la aduana y pagamos los aranceles, así el precio de tu factura es el precio final. Nada extra que pagar al recibir.</li><li><b>Resto de regiones — DAP.</b> Entregamos en tu dirección; aranceles e impuestos los pagas al llegar.</li></ul><p>Declaramos tus mercancías por su valor real — sin subdeclarar, lo que mantiene limpios tus registros aduaneros. Dile a Eddy tu destino y cotizamos DDP o DAP por adelantado.</p>' },
    faq8_q:             { en: 'Do you offer custom branding / OEM?', es: '¿Ofrecen marca propia / OEM?' },
    faq8_a:             { en: '<p>For many products, yes — custom logo, packaging and inserts are possible at higher quantities. Message Eddy with your idea and target quantity to check feasibility.</p>',
                           es: '<p>En muchos productos sí — logotipo, empaque e insertos personalizados se pueden hacer a partir de cierta cantidad. Escríbele a Eddy tu idea y la cantidad que tienes en mente para ver si se puede.</p>' },
    faq9_q:             { en: 'What if something arrives damaged or defective?', es: '¿Qué pasa si algo llega dañado o defectuoso?' },
    faq9_a:             { en: '<p>Send photos on WhatsApp within 7 days of delivery. We’ll arrange a replacement or refund on the affected units — we keep buyers coming back by keeping this simple.</p>',
                           es: '<p>Manda fotos por WhatsApp dentro de los 7 días tras recibirlo. Hacemos el reemplazo o reembolso de las piezas afectadas — lo resolvemos rápido para que sigas comprando con confianza.</p>' },
    cta_title:          { en: 'Ready to start?', es: '¿Listo para empezar?' },
    cta_sub:            { en: 'Tell Eddy what you’re looking for — or send your inquiry list straight from the catalog.', es: 'Cuéntale a Eddy lo que buscas — o envía tu lista de cotización directo desde el catálogo.' },
    cta_browse:         { en: 'Browse the catalog', es: 'Explora el catálogo' }
  };

  /* ---------------- 语言状态 ---------------- */
  function detectLang() {
    try {
      var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      return nav.indexOf('es') === 0 ? 'es' : 'en';
    } catch (e) { return 'en'; }
  }
  function getLang() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch (e) {}
    return detectLang();
  }
  function setLang(l) {
    try { localStorage.setItem(STORE_KEY, l); } catch (e) {}
    applyLang();
  }

  /* ---------------- 取词（支持 {n} 占位替换） ---------------- */
  function pick(key, lang) {
    var entry = I18N[key];
    if (!entry) return key;
    return entry[lang] != null ? entry[lang] : (entry.en != null ? entry.en : key);
  }
  function T(key, vars, lang) {
    lang = lang || getLang();
    var s = pick(key, lang);
    if (vars) {
      for (var k in vars) {
        if (!Object.prototype.hasOwnProperty.call(vars, k)) continue;
        var v = vars[k];
        // 复数（仅英文 item/artículo）
        if (k === 'n' && (key === 'drawer_count' || key === 'shared_review')) {
          s = s.replace('{n}', v).replace(lang === 'es' ? 'artículo' : 'item', v === 1 ? (lang === 'es' ? 'artículo' : 'item') : (lang === 'es' ? 'artículos' : 'items'));
        } else {
          s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
        }
      }
    }
    return s;
  }

  /* ---------------- 应用翻译 ---------------- */
  function applyStatic() {
    var lang = getLang();
    try { document.documentElement.lang = lang; } catch (e) {}
    document.querySelectorAll('[data-i18n],[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html');
      if (!key) return;
      var val = pick(key, lang);
      if (el.getAttribute('data-i18n-html') != null) el.innerHTML = val;
      else el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', pick(el.getAttribute('data-i18n-ph'), lang));
    });
  }

  /* ---------------- 切换器（注入页头 [data-lang-switch]） ---------------- */
  function renderToggle() {
    var host = document.querySelector('[data-lang-switch]');
    if (!host) return;
    var lang = getLang();
    if (host.getAttribute('data-rendered') === lang) return;
    host.setAttribute('data-rendered', lang);
    host.innerHTML =
      '<button type="button" class="lang-opt' + (lang === 'en' ? ' is-on' : '') + '" data-lang="en" aria-pressed="' + (lang === 'en') + '">EN</button>' +
      '<button type="button" class="lang-opt' + (lang === 'es' ? ' is-on' : '') + '" data-lang="es" aria-pressed="' + (lang === 'es') + '">ES</button>';
    Array.prototype.slice.call(host.querySelectorAll('[data-lang]')).forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
  }

  function applyLang() {
    applyStatic();
    renderToggle();
    if (typeof window.__translateDynamic === 'function') window.__translateDynamic();
  }

  /* ---------------- 暴露接口 ---------------- */
  window.I18N = I18N;
  window.T = T;
  window.getLang = getLang;
  window.setLang = setLang;
  window.applyLang = applyLang;
})();
