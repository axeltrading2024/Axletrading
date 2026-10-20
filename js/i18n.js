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
    inquiry_title:      { en: 'Inquiry', es: 'Cotización' },
    inquiry_sub:        { en: 'Tell us what you need — we reply within 24h.', es: 'Cuéntanos qué necesitas — respondemos en 24 h.' },
    inquiry_name:       { en: 'Name', es: 'Nombre' },
    inquiry_phone:      { en: 'Phone number', es: 'Número de teléfono' },
    inquiry_address:    { en: 'Address', es: 'Dirección' },
    inquiry_address_ph: { en: 'Street, building, apt.', es: 'Calle, edificio, depto.' },
    inquiry_city:       { en: 'City', es: 'Ciudad' },
    inquiry_province:   { en: 'Province', es: 'Provincia' },
    inquiry_zip:        { en: 'City zip code', es: 'Código postal' },
    inquiry_country:    { en: 'Country', es: 'País' },
    inquiry_email:      { en: 'Email', es: 'Correo' },
    inquiry_note:       { en: 'Fields marked * are required. We only use these details to prepare your quote.',
                          es: 'Los campos con * son obligatorios. Solo usamos estos datos para preparar tu cotización.' },
    inquiry_ctx:        { en: 'Product', es: 'Producto' },
    inquiry_products:   { en: 'Products you need', es: 'Productos que necesitas' },
    inquiry_products_ph:{ en: 'e.g. RIMOWA style × 50, AirPods × 20', es: 'p. ej. RIMOWA style × 50, AirPods × 20' },
    inquiry_company:    { en: 'Company', es: 'Empresa' },
    inquiry_product:    { en: 'Product / category', es: 'Producto / categoría' },
    inquiry_qty:        { en: 'Estimated quantity', es: 'Cantidad estimada' },
    inquiry_msg:        { en: 'Message', es: 'Mensaje' },
    inquiry_submit:     { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp' },
    inquiry_submit_fast:{ en: 'Get a fast quote', es: 'Cotización rápida' },
    inquiry_send_now:   { en: 'Send products now', es: 'Enviar productos ahora' },
    inquiry_err_products:{ en: 'Add at least one product first', es: 'Agrega al menos un producto' },
    variant_hint:       { en: 'Tap once to preview · tap again to confirm · tap again to add. Double-tap to deselect.',
                          es: 'Toca una vez para ver · otra para confirmar · otra para añadir. Doble toque para quitar.' },
    inquiry_mail_alt:   { en: 'or send by email', es: 'o envía por correo' },
    inquiry_product_btn:{ en: 'Inquire this product', es: 'Cotizar este producto' },
    inquiry_err_name:   { en: 'Please enter your name', es: 'Por favor ingresa tu nombre' },
    inquiry_err_phone:  { en: 'Please enter your phone number', es: 'Por favor ingresa tu teléfono' },
    inquiry_country_ph: { en: 'Select your country…', es: 'Selecciona tu país…' },

    /* ---- 阶梯价 / 运费估算 / 报价单 ---- */
    tier_title:         { en: 'Volume pricing', es: 'Precios por volumen' },
    tier_auto:          { en: 'Auto-applied', es: 'Se aplica solo' },
    tier_qty:           { en: 'Qty', es: 'Cant.' },
    tier_unit:          { en: 'Unit price', es: 'Precio unitario' },
    tier_your_qty:      { en: 'Your qty', es: 'Tu cantidad' },
    tier_total:         { en: 'Total', es: 'Total' },
    tier_saved:         { en: 'You save {v} at this quantity', es: 'Ahorras {v} con esta cantidad' },
    tier_below_moq:     { en: 'MOQ is {n} pcs — {q} is below it', es: 'El mínimo es {n} uds — {q} está por debajo' },
    ship_title:         { en: 'Estimate shipping', es: 'Estimar envío' },
    ship_dest:          { en: 'Destination', es: 'Destino' },
    ship_weight:        { en: 'Actual weight (kg)', es: 'Peso real (kg)' },
    ship_dims:          { en: 'Box size (cm)', es: 'Medidas de caja (cm)' },
    ship_empty:         { en: 'Enter weight or box size to estimate.', es: 'Ingresa peso o medidas para estimar.' },
    ship_chargeable:    { en: 'Chargeable weight', es: 'Peso facturable' },
    ship_vol:           { en: 'Volumetric weight', es: 'Peso volumétrico' },
    ship_first:         { en: 'First 1 kg', es: 'Primer kg' },
    ship_extra:         { en: 'Extra {n} kg', es: '{n} kg adicionales' },
    ship_estimate:      { en: 'Estimated freight', es: 'Flete estimado' },
    ship_transit:       { en: 'Estimated transit: {d}', es: 'Tránsito estimado: {d}' },
    ship_other_country: { en: 'Other country', es: 'Otro país' },
    ship_zone_other:    { en: 'Other destinations', es: 'Otros destinos' },
    ship_quote_only:    { en: 'We don’t have a fixed freight rate for {country} yet — it is quoted case by case.', es: 'Todavía no tenemos tarifa fija para {country} — se cotiza caso por caso.' },
    ship_quote_cta:     { en: 'Ask Eddy on WhatsApp', es: 'Pregunta a Eddy por WhatsApp' },
    ship_note:          { en: 'Indicative only — billed weight is rounded up to the next kg, and final freight is confirmed with your quotation.', es: 'Solo orientativo — el peso facturable se redondea al siguiente kg y el flete final se confirma con tu cotización.' },
    fx_rate_note:       { en: 'Approximate conversion at 1 EUR = 1.1 USD — we invoice in the quoted currency.', es: 'Conversión aproximada a 1 EUR = 1,1 USD — facturamos en la moneda cotizada.' },
    quote_pdf:          { en: 'Download quote (PDF)', es: 'Descargar cotización (PDF)' },
    quote_no:           { en: 'Quote no.', es: 'N.º de cotización' },
    quote_date:         { en: 'Date', es: 'Fecha' },
    quote_valid:        { en: 'Valid', es: 'Válida' },
    quote_valid_hours:   { en: '48 hours', es: '48 horas' },
    quote_freight:      { en: 'Freight (est.)', es: 'Envío (est.)' },
    quote_freight_to:   { en: 'Freight to {country} (est.)', es: 'Envío a {country} (est.)' },
    quote_freight_pending: { en: 'Quoted separately', es: 'Se cotiza aparte' },
    quote_est_total:    { en: 'Estimated total', es: 'Total estimado' },
    est_excl_freight:   { en: 'Freight is quoted separately — the estimate covers goods only.', es: 'El envío se cotiza aparte — el estimado solo incluye la mercancía.' },
    fx_conv_note:       { en: 'Goods converted at 1 EUR = 1.1 USD.', es: 'Mercancía convertida a 1 EUR = 1,1 USD.' },
    quote_terms:        { en: 'Prices are wholesale, ex-works. Freight, duties and taxes are quoted separately. Quantities and prices are indicative until confirmed by our written quotation.',
                          es: 'Precios al por mayor, ex-works. El flete, aranceles e impuestos se cotizan por separado. Cantidades y precios son orientativos hasta confirmarse por nuestra cotización escrita.' },
    inquiry_err_fix:    { en: 'Please check the highlighted fields', es: 'Revisa los campos marcados' },
    inquiry_err_name_short:  { en: 'Name is too short', es: 'El nombre es demasiado corto' },
    inquiry_err_name_chars:  { en: 'Name can only contain letters, spaces, hyphen or apostrophe',
                               es: 'El nombre solo puede tener letras, espacios, guion o apóstrofo' },
    inquiry_err_junk:   { en: 'Looks like random characters', es: 'Parece texto al azar' },
    inquiry_err_city_short:  { en: 'Too short', es: 'Demasiado corto' },
    inquiry_err_city_chars:  { en: 'Only letters, spaces and hyphens', es: 'Solo letras, espacios y guiones' },
    inquiry_err_addr_short:  { en: 'Address is too short — include street and number',
                               es: 'La dirección es muy corta — incluye calle y número' },
    inquiry_err_addr_long:   { en: 'Address is too long', es: 'La dirección es demasiado larga' },
    inquiry_err_phone_chars: { en: 'Digits only — no letters allowed', es: 'Solo números — sin letras' },
    inquiry_err_phone_dial:  { en: 'This number does not start with {dial} ({country})',
                               es: 'El número no empieza con {dial} ({country})' },
    inquiry_err_phone_len:   { en: '{country} numbers need {min}–{max} digits',
                               es: 'Los números de {country} tienen {min}–{max} dígitos' },
    inquiry_err_phone_len_generic: { en: 'Phone must be 6–15 digits', es: 'El teléfono debe tener 6–15 dígitos' },
    inquiry_err_phone_fake:  { en: 'This phone number looks invalid', es: 'Este teléfono no parece válido' },
    inquiry_err_zip_req:     { en: 'Postal code is required for {country} (e.g. {ex})',
                               es: 'El código postal es obligatorio para {country} (ej. {ex})' },
    inquiry_err_zip_fmt:     { en: 'Invalid postal code for {country} — format like {ex}',
                               es: 'Código postal inválido para {country} — formato tipo {ex}' },
    inquiry_err_zip_chars:   { en: 'Postal code has invalid characters', es: 'El código postal tiene caracteres inválidos' },
    inquiry_err_country:     { en: 'Please select your country', es: 'Selecciona tu país' },
    inquiry_err_email:       { en: 'Enter a valid email address', es: 'Escribe un correo válido' },
    drawer_empty:       { en: 'Your list is empty.<br>Add products and send them in one message.',
                           es: 'Tu lista todavía está vacía.<br>Agrega productos y mándalos en un mensaje.' },
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
    spec_shipping_val:  { en: 'Worldwide · Quoted on request', es: 'Mundial · te cotizamos al pedir' },
    spec_moq:           { en: 'MOQ', es: 'MOQ' },
    spec_flexible:      { en: 'Flexible', es: 'Flexible' },
    you_may_like:       { en: 'You may also like', es: 'También te puede gustar' },
    more_in:            { en: 'More in ', es: 'Más en ' },
    collection_not_found: { en: 'Collection not found', es: 'Colección no encontrada' },
    collection_not_found_desc: { en: "The collection you're looking for doesn't exist.",
                                 es: 'La colección que buscas no existe.' },
    cat_sub:            { en: '{n} products in this collection. Wholesale pricing — ask for a volume quote on WhatsApp. Add anything you like to your inquiry list.',
                          es: '{n} productos en esta colección. Precios de mayoreo — escríbenos por WhatsApp y te cotizamos por volumen. Agrega lo que quieras a tu lista.' },
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
    home_most_asked:    { en: 'Most asked', es: 'Lo más pedido' },
    home_popular_sub:   { en: 'The ones customers ask about the most on WhatsApp.',
                          es: 'Los que más nos piden por WhatsApp.' },
    home_explore:       { en: 'Explore', es: 'Explora' },
    home_browse_title:  { en: 'Browse products', es: 'Explora productos' },
    home_browse_sub:    { en: 'Everything Eddy supplies, organised so you find it in seconds.',
                          es: 'Todo lo que Eddy suministra, organizado para que lo encuentres en segundos.' },
    home_who:           { en: 'Who we are', es: 'Quiénes somos' },
    about_home_sub:     { en: 'The wholesale partner behind your next bestseller.',
                          es: 'El socio de mayoreo detrás de tu próximo bestseller.' },
    home_cap_packed:    { en: 'Packed and signed by Eddy', es: 'Empacado y firmado por Eddy' },
    home_cap_stock:     { en: 'In stock right now', es: 'En stock ahora mismo' },
    home_see_faq:       { en: 'See all FAQs & how we work', es: 'Ver todas las preguntas y cómo trabajamos' },
    footer_chat:        { en: 'Chat with us on WhatsApp', es: 'Chatea con nosotros por WhatsApp' },
    footer_backup:      { en: '· calls & backup', es: '· llamadas y respaldo' },
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
    shared_review:      { en: 'Review your {n}-line quote', es: 'Revisa tu cotización ({n} art.)' },
    shared_note:        { en: 'Quantities are adjustable. Contact us for an official quotation.',
                          es: 'Las cantidades se pueden ajustar. Escríbenos y te damos una cotización oficial.' },
    toast_added:        { en: '{name} added to inquiry', es: '{name} añadido a la cotización' },
    toast_cleared:      { en: 'Inquiry list cleared', es: 'Lista vaciada' },
    toast_share:        { en: 'Share link copied — send it to your customer', es: 'Enlace copiado — envíalo a tu cliente' },
    toast_moq_min:      { en: 'Minimum order for this item is {n} pcs', es: 'El pedido mínimo de este artículo es {n} pzs' },
    moq_min_label:      { en: 'Min. {n}', es: 'Mín. {n}' },
    copy_failed:        { en: 'Copy failed — please copy from the address bar', es: 'Copia fallida — cópialo de la barra de direcciones' },

    /* ---------------- About 页（静态文案） ---------------- */
    about_hero:         { en: 'Premium quality, factory pricing', es: 'Calidad premium, precio de fábrica' },
    about_lede:         { en: 'EddySupply is the wholesale catalog of <strong>Axeltrading</strong>, run by Eddy. We help overseas retailers, Amazon sellers and dropshippers source trending products — electronics, perfumes, watches and accessories — with clear photos, honest specs and fast, direct communication on WhatsApp. No middlemen, no marketplace fees, no guesswork.',
                           es: 'EddySupply es el catálogo de mayoreo de <strong>Axeltrading</strong>, dirigido por Eddy. Ayudamos a minoristas, vendedores de Amazon y dropshippers a abastecerse de productos de tendencia — electrónica, perfumes, relojes y accesorios — con fotos claras, especificaciones honestas y comunicación rápida y directa por WhatsApp. Sin intermediarios, sin comisiones de marketplace, sin sorpresas.' },
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
                           es: '<b>Revisado y firmado por Eddy</b><i>Nada sale de la sala hasta que se pesa, etiqueta y cotejamos con tu lista.</i>' },
    about_cap4:         { en: '<b>1,000+ SKUs on hand</b><i>Perfumes, watches, earbuds, speakers and accessories — laid out before a shipping day.</i>',
                           es: '<b>Más de 1.000 SKU en stock</b><i>Perfumes, relojes, earbuds, bocinas y accesorios — desplegados antes de un día de envío.</i>' },
    about_cap5:         { en: '<b>Shock-proof protection</b><i>Fragile goods travel inside air-pillow cushions, so glass and boxes arrive intact.</i>',
                           es: '<b>Protección antigolpes</b><i>Los frágiles viajan dentro de cojines de aire, para que el vidrio y las cajas lleguen intactos.</i>' },
    about_cap6:         { en: '<b>Every model, on the wall</b><i>ANC, TWS and Pro-style earbuds plus over-ear headphones — sample units kept on site, so you get a real answer instead of a guess.</i>',
                           es: '<b>Cada modelo, en el muro</b><i>Earbuds ANC, TWS y estilo Pro, además de auriculares over-ear — unidades de muestra en sitio, para darte una respuesta real, no suposiciones.</i>' },
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
    hiw_order_3d:       { en: 'The site writes the message for you', es: 'nosotros armamos el mensaje por ti' },
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
    hiw_pay_foot:       { en: 'Payment confirmed, then we start packing.', es: 'Pago confirmado, luego armamos y empacamos tu pedido.' },
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
                           es: '<b>Los tiempos de tránsito son estimaciones de la transportista, no fechas garantizadas de entrega.</b> Los artículos en stock se despachan en 24–48 horas tras confirmar el pago. Si algo llega dañado, mándanos fotos por WhatsApp en 7 días y lo resolvemos: reemplazamos o reembolsamos las piezas afectadas.' },
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
    faq4_a:             { en: '<p>We ship worldwide. Freight is a first-kilo rate plus a per-kilo rate on the billed weight (the heavier of actual and volumetric weight, rounded up to the next kg):</p><ul><li><b>Europe (EU · UK · Norway · Sweden · Denmark)</b> — €30 for the first kg, + €10 per extra kg</li><li><b>North America (US · CA · MX)</b> — $40 for the first kg, + $15 per extra kg</li><li><b>Australia &amp; New Zealand</b> — $30 for the first kg, + $10 per extra kg (USD)</li></ul><p>Other destinations, including Switzerland, are quoted case by case. Send your inquiry list with your country and we confirm the exact freight before you pay anything.</p>',
                           es: '<p>Enviamos a todo el mundo. El flete se calcula con una tarifa por el primer kilo más una tarifa por kilo adicional sobre el peso facturable (el mayor entre peso real y volumétrico, redondeado al siguiente kg):</p><ul><li><b>Europa (UE · Reino Unido · Noruega · Suecia · Dinamarca)</b> — 30 € el primer kg, + 10 € por kg adicional</li><li><b>Norteamérica (EE. UU. · CA · MX)</b> — 40 $ el primer kg, + 15 $ por kg adicional</li><li><b>Australia y Nueva Zelanda</b> — 30 $ el primer kg, + 10 $ por kg adicional (USD)</li></ul><p>El resto de destinos, incluida Suiza, se cotizan caso por caso. Envía tu lista con tu país y confirmamos el flete exacto antes de que pagues nada.</p>' },
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
    cta_browse:         { en: 'Browse the catalog', es: 'Explora el catálogo' },

    /* ---- 需求收集 / 客服悬浮窗（js/lead-form.js） ---- */
    req_eyebrow:        { en: 'Custom sourcing', es: 'Búsqueda personalizada' },
    req_title:          { en: 'Tell us more. We’ll go further.', es: 'Cuéntanos más. Llegamos más lejos.' },
    req_sub:            { en: 'The more you share — quantity, target price, packaging, deadline — the further we can go on sourcing, options and pricing. Eddy reads every request himself and usually replies the same day.',
                          es: 'Cuanto más nos cuentes — cantidad, precio objetivo, empaque, fecha — más lejos podemos llegar en búsqueda, opciones y precios. Eddy lee cada solicitud personalmente y suele responder el mismo día.' },
    ask_tab:            { en: 'Ask Eddy', es: 'Pregunta a Eddy' },
    ask_tab_aria:       { en: 'Tell us what you are looking for', es: 'Cuéntanos qué estás buscando' },
    ask_close:          { en: 'Close', es: 'Cerrar' },
    req_f_product:      { en: 'What are you looking for?', es: '¿Qué estás buscando?' },
    req_ph_product:     { en: 'e.g. 200 pcs Dior Sauvage EDT 100ml, or paste a product link',
                          es: 'ej. 200 uds de Dior Sauvage EDT 100ml, o pega un enlace del producto' },
    req_f_contact:      { en: 'Your WhatsApp or email', es: 'Tu WhatsApp o email' },
    req_ph_contact:     { en: '+1 555 000 1234 or you@company.com', es: '+34 600 000 000 o tu@empresa.com' },
    req_f_category:     { en: 'Category', es: 'Categoría' },
    req_cat_any:        { en: 'Not sure / other', es: 'No estoy seguro / otro' },
    req_f_country:      { en: 'Your country', es: 'Tu país' },
    req_ph_country:     { en: 'United States', es: 'España' },
    req_f_qty:          { en: 'Quantity (pcs)', es: 'Cantidad (uds)' },
    req_ph_qty:         { en: 'e.g. 100', es: 'ej. 100' },
    req_f_price:        { en: 'Target price (per unit)', es: 'Precio objetivo (por unidad)' },
    req_ph_price:       { en: 'e.g. $12', es: 'ej. 12 $' },
    req_f_msg:          { en: 'Tell us more (optional)', es: 'Cuéntanos más (opcional)' },
    req_ph_msg:         { en: 'Packaging, label, certification, deadline — the more detail, the better we can quote.',
                          es: 'Empaque, etiqueta, certificación, fecha — cuantos más detalles, mejor podemos cotizar.' },
    req_f_files:        { en: 'Reference photos or files (optional)', es: 'Fotos o archivos de referencia (opcional)' },
    req_files_cta:      { en: 'Click to upload, or drag files here', es: 'Haz clic para subir o arrastra los archivos aquí' },
    req_files_hint:     { en: 'Photos, PDF, Word or Excel · up to 5 files, 6MB each',
                          es: 'Fotos, PDF, Word o Excel · hasta 5 archivos, 6 MB cada uno' },
    req_file_remove:    { en: 'Remove', es: 'Quitar' },
    req_file_failed:    { en: 'failed', es: 'error' },
    req_files_uploading:{ en: 'Uploading your files, please wait…', es: 'Subiendo tus archivos, espera…' },
    req_files_retry:    { en: 'Some files could not be uploaded. Remove them and try again.',
                          es: 'Algunos archivos no se pudieron subir. Quítalos e inténtalo de nuevo.' },
    req_files_unavailable:{ en: 'File upload is not available right now — you can still send your request, and share photos on WhatsApp afterwards.',
                          es: 'La subida de archivos no está disponible ahora — puedes enviar tu solicitud y compartir fotos por WhatsApp después.' },
    req_err_file_size:  { en: 'Each file must be under 6MB.', es: 'Cada archivo debe pesar menos de 6 MB.' },
    req_ok_files:       { en: 'Your {n} attachment(s) came through too.', es: 'También recibimos tus {n} archivo(s).' },
    req_submit:         { en: 'Send request', es: 'Enviar solicitud' },
    req_note:           { en: 'We reply within 24 hours. No spam, ever.', es: 'Respondemos en 24 horas. Nunca enviamos spam.' },
    req_sending:        { en: 'Sending…', es: 'Enviando…' },
    req_ok_title:       { en: 'Request received', es: 'Solicitud recibida' },
    req_ok_body:        { en: 'Thank you — your request is in. We’ll come back to you within 24 hours with pricing and options.',
                          es: 'Gracias — tu solicitud está registrada. Te responderemos en menos de 24 horas con precios y opciones.' },
    req_ok_wa:          { en: 'Chat on WhatsApp now', es: 'Hablar por WhatsApp ahora' },
    req_ok_again:       { en: 'Send another request', es: 'Enviar otra solicitud' },
    req_ok_again_hint:  { en: 'Sourcing more than one item? Send them separately — we quote each one properly.',
                          es: '¿Buscas más de un artículo? Envíalos por separado — cotizamos cada uno como corresponde.' },
    req_err_product:    { en: 'Please tell us what you are looking for.', es: 'Cuéntanos qué estás buscando.' },
    req_err_contact:    { en: 'Please add a valid WhatsApp number or email.', es: 'Añade un WhatsApp o email válido.' },
    req_err_rate:       { en: 'Too many requests from your network. Please try again later, or message us on WhatsApp.',
                          es: 'Demasiadas solicitudes desde tu red. Inténtalo más tarde o escríbenos por WhatsApp.' },
    req_err_validate:   { en: 'Please check the fields and try again.', es: 'Revisa los campos e inténtalo de nuevo.' },
    req_err_generic:    { en: 'Something went wrong. Please try again, or message us on WhatsApp.',
                          es: 'Algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.' },
    req_fb_title:       { en: 'The online form is unavailable right now.', es: 'El formulario no está disponible ahora mismo.' },
    req_fb_body:        { en: 'Send the same details straight to Eddy on WhatsApp — one tap, and the message is already written.',
                          es: 'Envía los mismos datos directamente a Eddy por WhatsApp — un toque y el mensaje ya está escrito.' },
    req_fb_btn:         { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp' },
    req_wa_intro:       { en: 'Hi Eddy! I am looking for:', es: '¡Hola Eddy! Estoy buscando:' },
    footer_request:     { en: 'Send a product request', es: 'Enviar una solicitud' }
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
