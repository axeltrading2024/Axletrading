/* ============================================================
 *  多语言层（EN / ES / FR）
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
    nav_home: { en: 'Home', es: 'Inicio' , fr: 'Accueil' },
    nav_products: { en: 'Products', es: 'Productos' , fr: 'Produits' },
    nav_browse: { en: 'Browse', es: 'Catálogo' , fr: 'Catalogue' },
    nav_about: { en: 'About Us', es: 'Nosotros' , fr: 'À propos' },
    search_placeholder: { en: 'Search product, brand, category…', es: 'Busca producto, marca o categoría…' , fr: 'Rechercher un produit, une marque, une catégorie…' },
    search_hot: { en: 'Popular:', es: 'Popular:' , fr: 'Populaire :' },
    search_aria: { en: 'Search products', es: 'Buscar productos' , fr: 'Rechercher des produits' },
    open_menu: { en: 'Open menu', es: 'Abrir menú' , fr: 'Ouvrir le menu' },
    inquiry: { en: 'Inquiry', es: 'Cotización' , fr: 'Demande de devis' },
    chat_wa: { en: 'Chat on WhatsApp', es: 'Chatea en WhatsApp' , fr: 'Discuter sur WhatsApp' },
    drawer_title: { en: 'Inquiry list', es: 'Lista de cotización' , fr: 'Liste de devis' },
    drawer_count: { en: '{n} item', es: '{n} artículo' , fr: '{n} article' },        // 复数在 T() 里处理
    products_total: { en: 'Products total', es: 'Total productos' , fr: 'Total des produits' },
    send_wa: { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp' , fr: 'Envoyer sur WhatsApp' },
    pay_alipay_btn: { en: 'Pay on Alipay', es: 'Pagar con Alipay' , fr: 'Payer avec Alipay' },
    send_list_wa: { en: 'Send list on WhatsApp', es: 'Enviar lista por WhatsApp' , fr: 'Envoyer la liste sur WhatsApp' },
    share_wa_intro: { en: 'Hi Eddy! I\'d like a quote for:', es: '¡Hola Eddy! Me gustaría una cotización para:' , fr: 'Bonjour Eddy ! Je voudrais un devis pour :' },
    clear_list: { en: 'Clear list', es: 'Vaciar lista' , fr: 'Vider la liste' },
    more_options: { en: 'More options', es: 'Más opciones' , fr: 'Plus d’options' },
    inquiry_title: { en: 'Inquiry', es: 'Cotización' , fr: 'Demande de devis' },
    inquiry_sub: { en: 'Tell us what you need — we reply within 24h.', es: 'Cuéntanos qué necesitas — respondemos en 24 h.' , fr: 'Dites-nous ce dont vous avez besoin — réponse sous 24 h.' },
    inquiry_name: { en: 'Name', es: 'Nombre' , fr: 'Nom' },
    inquiry_phone: { en: 'Phone number', es: 'Número de teléfono' , fr: 'Numéro de téléphone' },
    inquiry_address: { en: 'Address', es: 'Dirección' , fr: 'Adresse' },
    inquiry_address_ph: { en: 'Street, building, apt.', es: 'Calle, edificio, depto.' , fr: 'Rue, bâtiment, apt.' },
    inquiry_city: { en: 'City', es: 'Ciudad' , fr: 'Ville' },
    inquiry_province: { en: 'Province', es: 'Provincia' , fr: 'Province' },
    inquiry_zip: { en: 'City zip code', es: 'Código postal' , fr: 'Code postal' },
    inquiry_country: { en: 'Country', es: 'País' , fr: 'Pays' },
    inquiry_email: { en: 'Email', es: 'Correo' , fr: 'E-mail' },
    inquiry_note: { en: 'Fields marked * are required. We only use these details to prepare your quote.',
                          es: 'Los campos con * son obligatorios. Solo usamos estos datos para preparar tu cotización.' , fr: 'Les champs marqués d’un * sont obligatoires. Nous n’utilisons ces informations que pour préparer votre devis.' },
    inquiry_ctx: { en: 'Product', es: 'Producto' , fr: 'Produit' },
    inquiry_products: { en: 'Products you need', es: 'Productos que necesitas' , fr: 'Produits souhaités' },
    inquiry_products_ph: { en: 'e.g. RIMOWA style × 50, AirPods × 20', es: 'p. ej. RIMOWA style × 50, AirPods × 20' , fr: 'ex. : style RIMOWA × 50, AirPods × 20' },
    inquiry_company: { en: 'Company', es: 'Empresa' , fr: 'Entreprise' },
    inquiry_product: { en: 'Product / category', es: 'Producto / categoría' , fr: 'Produit / catégorie' },
    inquiry_qty: { en: 'Estimated quantity', es: 'Cantidad estimada' , fr: 'Quantité estimée' },
    inquiry_msg: { en: 'Message', es: 'Mensaje' , fr: 'Message' },
    inquiry_submit: { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp' , fr: 'Envoyer sur WhatsApp' },
    inquiry_submit_fast: { en: 'Get a fast quote', es: 'Cotización rápida' , fr: 'Obtenir un devis rapide' },
    more_questions: { en: 'More questions', es: 'Más preguntas' , fr: 'Autres questions' },
    inquiry_send_now: { en: 'Send products now', es: 'Enviar productos ahora' , fr: 'Envoyer les produits maintenant' },
    inquiry_err_products: { en: 'Add at least one product first', es: 'Agrega al menos un producto' , fr: 'Ajoutez d’abord au moins un produit' },
    variant_hint: { en: 'Tap once to preview · tap again to confirm · tap again to add. Double-tap to deselect.',
                          es: 'Toca una vez para ver · otra para confirmar · otra para añadir. Doble toque para quitar.' , fr: 'Un appui pour prévisualiser · un deuxième pour confirmer · un troisième pour ajouter. Double appui pour désélectionner.' },
    inquiry_mail_alt: { en: 'or send by email', es: 'o envía por correo' , fr: 'ou envoyer par e-mail' },
    inquiry_product_btn: { en: 'Inquire this product', es: 'Cotizar este producto' , fr: 'Demander un devis pour ce produit' },
    /* 产品页主 CTA：一键唤起 AI 客服（原「Inquire this product」改成 Quick answer）
       文案刻意压短：这一行是 3 个按钮并排，太长会挤到第二行 */
    quick_answer_btn: { en: 'Quick answer', es: 'Respuesta rápida' , fr: 'Réponse rapide' },
    inquiry_err_name: { en: 'Please enter your name', es: 'Por favor ingresa tu nombre' , fr: 'Veuillez saisir votre nom' },
    inquiry_err_phone: { en: 'Please enter your phone number', es: 'Por favor ingresa tu teléfono' , fr: 'Veuillez saisir votre numéro de téléphone' },
    inquiry_country_ph: { en: 'Select your country…', es: 'Selecciona tu país…' , fr: 'Sélectionnez votre pays…' },

    /* ---- 阶梯价 / 运费估算 / 报价单 ---- */
    tier_title: { en: 'Volume pricing', es: 'Precios por volumen' , fr: 'Tarifs par volume' },
    tier_sum: { en: '{n} tiers · up to −{p}%', es: '{n} tramos · hasta −{p}%' , fr: '{n} paliers · jusqu’à −{p} %' },
    tier_sum_flat: { en: '{n} tiers', es: '{n} tramos' , fr: '{n} paliers' },
    tier_auto: { en: 'Auto-applied', es: 'Se aplica solo' , fr: 'Appliqué automatiquement' },
    tier_qty: { en: 'Qty', es: 'Cant.' , fr: 'Qté' },
    tier_unit: { en: 'Unit price', es: 'Precio unitario' , fr: 'Prix unitaire' },
    tier_your_qty: { en: 'Your qty', es: 'Tu cantidad' , fr: 'Votre quantité' },
    tier_total: { en: 'Total', es: 'Total' , fr: 'Total' },
    tier_saved: { en: 'You save {v} at this quantity', es: 'Ahorras {v} con esta cantidad' , fr: 'Vous économisez {v} à cette quantité' },
    tier_below_moq: { en: 'MOQ is {n} pcs — {q} is below it', es: 'El mínimo es {n} uds — {q} está por debajo' , fr: 'Le minimum est de {n} pièces — {q} est en dessous' },
    volume_off: { en: '−{n}% volume', es: '−{n}% por volumen' , fr: '−{n} % sur volume' },
    filter_brand: { en: 'Brand', es: 'Marca' , fr: 'Marque' },
    filter_all_brands: { en: 'All brands', es: 'Todas las marcas' , fr: 'Toutes les marques' },
    filter_sort: { en: 'Sort', es: 'Ordenar' , fr: 'Trier' },
    sort_default: { en: 'Featured', es: 'Destacados' , fr: 'Suggestions' },
    sort_price_asc: { en: 'Price: low to high', es: 'Precio: menor a mayor' , fr: 'Prix : croissant' },
    sort_price_desc: { en: 'Price: high to low', es: 'Precio: mayor a menor' , fr: 'Prix : décroissant' },
    sort_name: { en: 'Name: A to Z', es: 'Nombre: A a Z' , fr: 'Nom : A à Z' },
    filter_showing: { en: 'Showing {n} of {total}', es: 'Mostrando {n} de {total}' , fr: '{n} affichés sur {total}' },
    styles_count: { en: '{n} styles', es: '{n} estilos' , fr: '{n} modèles' },
    restore_last: { en: 'Restore last list', es: 'Restaurar última lista' , fr: 'Restaurer la dernière liste' },
    restored_last: { en: 'Restored {n} items', es: 'Se restauraron {n} artículos' , fr: '{n} articles restaurés' },
    restore_empty: { en: 'No saved list found', es: 'No hay lista guardada' , fr: 'Aucune liste enregistrée' },
    add_all_styles: { en: 'Add all {n} styles to inquiry', es: 'Añadir los {n} estilos a la cotización' , fr: 'Ajouter les {n} modèles au devis' },
    added_all_styles: { en: 'Added {n} styles of {name}', es: 'Se añadieron {n} estilos de {name}' , fr: '{n} modèles de {name} ajoutés' },
    recent_title: { en: 'Recently viewed', es: 'Visto recientemente' , fr: 'Consultés récemment' },
    ship_title: { en: 'Estimate shipping', es: 'Estimar envío' , fr: 'Estimer les frais de port' },
    ship_dest: { en: 'Destination', es: 'Destino' , fr: 'Destination' },
    ship_weight: { en: 'Actual weight (kg)', es: 'Peso real (kg)' , fr: 'Poids réel (kg)' },
    ship_weight_hint: { en: 'Auto-filled from your cart — adjust if needed.', es: 'Rellenado desde tu carrito — ajústalo si hace falta.' , fr: 'Rempli automatiquement depuis votre panier — ajustez si besoin.' },
    ship_dims: { en: 'Box size (cm)', es: 'Medidas de caja (cm)' , fr: 'Dimensions du carton (cm)' },
    ship_empty: { en: 'Enter weight or box size to estimate.', es: 'Ingresa peso o medidas para estimar.' , fr: 'Saisissez le poids ou les dimensions pour estimer.' },
    ship_chargeable: { en: 'Chargeable weight', es: 'Peso facturable' , fr: 'Poids taxable' },
    quote_item_as_quoted: { en: 'Price as quoted · not in catalog', es: 'Precio según cotización · ya no en catálogo' , fr: 'Prix selon devis · retiré du catalogue' },
    estimate_weight: { en: 'Estimate weight', es: 'Peso estimado' , fr: 'Poids estimé' },
    ship_vol: { en: 'Volumetric weight', es: 'Peso volumétrico' , fr: 'Poids volumétrique' },
    ship_first: { en: 'First 1 kg', es: 'Primer kg' , fr: 'Premier kg' },
    ship_extra: { en: 'Extra {n} kg', es: '{n} kg adicionales' , fr: '{n} kg supplémentaires' },
    ship_estimate: { en: 'Estimated freight', es: 'Flete estimado' , fr: 'Fret estimé' },
    ship_transit: { en: 'Estimated transit: {d}', es: 'Tránsito estimado: {d}' , fr: 'Transit estimé : {d}' },
    ship_other_country: { en: 'Other country', es: 'Otro país' , fr: 'Autre pays' },
    ship_zone_other: { en: 'Other destinations', es: 'Otros destinos' , fr: 'Autres destinations' },
    ship_quote_only: { en: 'We don’t have a fixed freight rate for {country} yet — it is quoted case by case.', es: 'Todavía no tenemos tarifa fija para {country} — se cotiza caso por caso.' , fr: 'Nous n’avons pas encore de tarif fixe pour {country} — devis au cas par cas.' },
    ship_quote_cta: { en: 'Ask Eddy on WhatsApp', es: 'Pregunta a Eddy por WhatsApp' , fr: 'Demander à Eddy sur WhatsApp' },
    ship_note: { en: 'Indicative only — billed weight is rounded up to the next kg, and final freight is confirmed with your quotation.', es: 'Solo orientativo — el peso facturable se redondea al siguiente kg y el flete final se confirma con tu cotización.' , fr: 'Indicatif uniquement — le poids taxable est arrondi au kg supérieur et le fret final est confirmé avec votre devis.' },
    fx_rate_note: { en: 'Approximate conversion at 1 EUR = 1.1 USD — we invoice in the quoted currency.', es: 'Conversión aproximada a 1 EUR = 1,1 USD — facturamos en la moneda cotizada.' , fr: 'Conversion approximative : 1 EUR = 1,1 USD — nous facturons dans la devise du devis.' },
    quote_no: { en: 'Quote no.', es: 'N.º de cotización' , fr: 'N° de devis' },
    quote_date: { en: 'Date', es: 'Fecha' , fr: 'Date' },
    quote_valid: { en: 'Valid', es: 'Válida' , fr: 'Valable' },
    quote_valid_hours: { en: '48 hours', es: '48 horas' , fr: '48 heures' },
    quote_freight: { en: 'Freight (est.)', es: 'Envío (est.)' , fr: 'Fret (est.)' },
    quote_freight_to: { en: 'Freight to {country} (est.)', es: 'Envío a {country} (est.)' , fr: 'Fret vers {country} (est.)' },
    quote_freight_pending: { en: 'Quoted separately', es: 'Se cotiza aparte' , fr: 'Devis séparé' },
    quote_est_total: { en: 'Estimated total', es: 'Total estimado' , fr: 'Total estimé' },
    est_excl_freight: { en: 'Freight is quoted separately — the estimate covers goods only.', es: 'El envío se cotiza aparte — el estimado solo incluye la mercancía.' , fr: 'Le fret est devisé séparément — l’estimation ne couvre que la marchandise.' },
    fx_conv_note: { en: 'Goods converted at 1 EUR = 1.1 USD.', es: 'Mercancía convertida a 1 EUR = 1,1 USD.' , fr: 'Marchandise convertie à 1 EUR = 1,1 USD.' },
    quote_terms: { en: 'Prices are wholesale, ex-works. Freight, duties and taxes are quoted separately. Quantities and prices are indicative until confirmed by our written quotation.',
                          es: 'Precios al por mayor, ex-works. El flete, aranceles e impuestos se cotizan por separado. Cantidades y precios son orientativos hasta confirmarse por nuestra cotización escrita.' , fr: 'Prix de gros, ex-works. Fret, droits et taxes sont devisés séparément. Quantités et prix restent indicatifs jusqu’à confirmation par notre devis écrit.' },
    inquiry_err_fix: { en: 'Please check the highlighted fields', es: 'Revisa los campos marcados' , fr: 'Veuillez vérifier les champs signalés' },
    inquiry_err_name_short: { en: 'Name is too short', es: 'El nombre es demasiado corto' , fr: 'Nom trop court' },
    inquiry_err_name_chars: { en: 'Name can only contain letters, spaces, hyphen or apostrophe',
                               es: 'El nombre solo puede tener letras, espacios, guion o apóstrofo' , fr: 'Le nom ne peut contenir que des lettres, espaces, tirets ou apostrophes' },
    inquiry_err_junk: { en: 'Looks like random characters', es: 'Parece texto al azar' , fr: 'Semble être une suite de caractères aléatoires' },
    inquiry_err_city_short: { en: 'Too short', es: 'Demasiado corto' , fr: 'Trop court' },
    inquiry_err_city_chars: { en: 'Only letters, spaces and hyphens', es: 'Solo letras, espacios y guiones' , fr: 'Lettres, espaces et tirets uniquement' },
    inquiry_err_addr_short: { en: 'Address is too short — include street and number',
                               es: 'La dirección es muy corta — incluye calle y número' , fr: 'Adresse trop courte — indiquez la rue et le numéro' },
    inquiry_err_addr_long: { en: 'Address is too long', es: 'La dirección es demasiado larga' , fr: 'Adresse trop longue' },
    inquiry_err_phone_chars: { en: 'Digits only — no letters allowed', es: 'Solo números — sin letras' , fr: 'Chiffres uniquement — pas de lettres' },
    inquiry_err_phone_dial: { en: 'This number does not start with {dial} ({country})',
                               es: 'El número no empieza con {dial} ({country})' , fr: 'Ce numéro ne commence pas par {dial} ({country})' },
    inquiry_err_phone_len: { en: '{country} numbers need {min}–{max} digits',
                               es: 'Los números de {country} tienen {min}–{max} dígitos' , fr: 'Les numéros {country} comportent {min} à {max} chiffres' },
    inquiry_err_phone_len_generic: { en: 'Phone must be 6–15 digits', es: 'El teléfono debe tener 6–15 dígitos' , fr: 'Le téléphone doit comporter 6 à 15 chiffres' },
    inquiry_err_phone_fake: { en: 'This phone number looks invalid', es: 'Este teléfono no parece válido' , fr: 'Ce numéro de téléphone semble invalide' },
    inquiry_err_zip_req: { en: 'Postal code is required for {country} (e.g. {ex})',
                               es: 'El código postal es obligatorio para {country} (ej. {ex})' , fr: 'Code postal obligatoire pour {country} (ex. {ex})' },
    inquiry_err_zip_fmt: { en: 'Invalid postal code for {country} — format like {ex}',
                               es: 'Código postal inválido para {country} — formato tipo {ex}' , fr: 'Code postal invalide pour {country} — format attendu : {ex}' },
    inquiry_err_zip_chars: { en: 'Postal code has invalid characters', es: 'El código postal tiene caracteres inválidos' , fr: 'Le code postal contient des caractères invalides' },
    inquiry_err_country: { en: 'Please select your country', es: 'Selecciona tu país' , fr: 'Veuillez sélectionner votre pays' },
    inquiry_err_email: { en: 'Enter a valid email address', es: 'Escribe un correo válido' , fr: 'Saisissez une adresse e-mail valide' },
    drawer_empty: { en: 'Your list is empty.<br>Add products and send them in one message.',
                           es: 'Tu lista todavía está vacía.<br>Agrega productos y mándalos en un mensaje.' , fr: 'Votre liste est vide.<br>Ajoutez des produits et envoyez-les en un seul message.' },
    drawer_phone_lead: { en: 'Get the payment code + quote on WhatsApp',
                           es: 'Recibe el código de pago + la cotización por WhatsApp' , fr: 'Recevoir le code de paiement + le devis sur WhatsApp' },
    optional: { en: '(optional)', es: '(opcional)' , fr: '(facultatif)' },
    footer_tagline: { en: 'Wholesale catalog of Axeltrading — electronics, perfumes, watches and accessories sourced for overseas retailers, Amazon sellers and dropshippers.',
                           es: 'Catálogo de mayoreo de Axeltrading — electrónica, perfumes, relojes y accesorios para minoristas, vendedores de Amazon y dropshippers.' , fr: 'Catalogue de gros d’Axeltrading — électronique, parfums, montres et accessoires sélectionnés pour les revendeurs, vendeurs Amazon et dropshippers étrangers.' },
    footer_shop: { en: 'Shop', es: 'Tienda' , fr: 'Boutique' },
    footer_all: { en: 'All collections', es: 'Todas las colecciones' , fr: 'Toutes les collections' },
    footer_company: { en: 'Company', es: 'Empresa' , fr: 'Entreprise' },
    footer_faq: { en: 'FAQ', es: 'Preguntas' , fr: 'FAQ' },
    footer_popular: { en: 'Popular products', es: 'Productos populares' , fr: 'Produits populaires' },
    footer_how: { en: 'How it works', es: 'Cómo funciona' , fr: 'Comment ça marche' },
    footer_contact: { en: 'Contact', es: 'Contacto' , fr: 'Contact' },
    footer_reply: { en: 'Reply within 24 hours', es: 'Respondemos en 24 h' , fr: 'Réponse sous 24 heures' },
    footer_payment: { en: 'Payment', es: 'Pago' , fr: 'Paiement' },
    footer_shipping: { en: 'Shipping', es: 'Envío' , fr: 'Livraison' },
    footer_moq: { en: 'MOQ', es: 'MOQ' , fr: 'MOQ' },
    footer_wholesale_only: { en: 'Wholesale only · no retail orders', es: 'Solo mayoreo · sin ventas minoristas' , fr: 'Grossiste uniquement · pas de commandes au détail' },
    add_to_inquiry: { en: 'Add to Inquiry', es: 'Añadir a cotización' , fr: 'Ajouter au devis' },
    in_inquiry_list: { en: 'In inquiry list', es: 'En la lista' , fr: 'Dans la liste de devis' },
    review_list: { en: 'Review inquiry list', es: 'Ver lista' , fr: 'Voir la liste de devis' },
    product_not_found: { en: 'Product not found', es: 'Producto no encontrado' , fr: 'Produit introuvable' },
    product_not_found_desc: { en: "The product you're looking for doesn't exist or has been removed.",
                              es: 'El producto que buscas no existe o ha sido retirado.' , fr: 'Le produit que vous cherchez n’existe pas ou a été retiré.' },
    back_home: { en: 'Back home', es: 'Volver al inicio' , fr: 'Retour à l’accueil' },
    watch_video: { en: '▶ Watch video', es: '▶ Ver vídeo' , fr: '▶ Voir la vidéo' },
    show_photo: { en: '🖼 Show photo', es: '🖼 Ver foto' , fr: '🖼 Voir la photo' },
    wholesale_vol: { en: 'Wholesale · Ask for volume pricing', es: 'Mayoreo · Pide precio por volumen' , fr: 'Grossiste · demandez les tarifs par volume' },
    model_option: { en: 'Model / Option', es: 'Modelo / Opción' , fr: 'Modèle / Option' },
    back_to: { en: 'Back to ', es: 'Volver a ' , fr: 'Retour à ' },
    spec_brand: { en: 'Brand', es: 'Marca' , fr: 'Marque' },
    spec_collection: { en: 'Collection', es: 'Colección' , fr: 'Collection' },
    spec_shipping: { en: 'Shipping', es: 'Envío' , fr: 'Livraison' },
    spec_shipping_val: { en: 'Worldwide · Quoted on request', es: 'Mundial · te cotizamos al pedir' , fr: 'Monde entier · devis sur demande' },
    spec_moq: { en: 'MOQ', es: 'MOQ' , fr: 'MOQ' },
    spec_flexible: { en: 'Flexible', es: 'Flexible' , fr: 'Flexible' },
    you_may_like: { en: 'You may also like', es: 'También te puede gustar' , fr: 'Vous aimerez aussi' },
    more_in: { en: 'More in ', es: 'Más en ' , fr: 'Plus dans ' },
    collection_not_found: { en: 'Collection not found', es: 'Colección no encontrada' , fr: 'Collection introuvable' },
    collection_not_found_desc: { en: "The collection you're looking for doesn't exist.",
                                 es: 'La colección que buscas no existe.' , fr: 'La collection que vous cherchez n’existe pas.' },
    cat_sub: { en: '{n} products in this collection. Wholesale pricing — ask for a volume quote on WhatsApp. Add anything you like to your inquiry list.',
                          es: '{n} productos en esta colección. Precios de mayoreo — escríbenos por WhatsApp y te cotizamos por volumen. Agrega lo que quieras a tu lista.' , fr: '{n} produits dans cette collection. Prix de gros — demandez un devis par volume sur WhatsApp. Ajoutez ce que vous voulez à votre liste de devis.' },
    sub_all: { en: 'All', es: 'Todos' , fr: 'Tous' },
    nothing_here: { en: 'Nothing here yet', es: 'Todavía nada aquí' , fr: 'Rien ici pour l’instant' },
    no_products_sub: { en: 'No products in this sub-collection at the moment.',
                          es: 'No hay productos en esta subcolección por ahora.' , fr: 'Aucun produit dans cette sous-collection pour le moment.' },
    search_hint: { en: 'Type to search across all 1000+ products — brand, product name or category.',
                          es: 'Escribe para buscar entre más de 1000 productos — marca, nombre o categoría.' , fr: 'Saisissez pour rechercher parmi plus de 1000 produits — marque, nom ou catégorie.' },
    search_no_match: { en: 'No products match that search.', es: 'Ningún producto coincide con esa búsqueda.' , fr: 'Aucun produit ne correspond à cette recherche.' },
    browse_all: { en: 'Browse all collections →', es: 'Ver todas las colecciones →' , fr: 'Voir toutes les collections →' },
    hero_strip_what: { en: 'What we ship', es: 'Lo que enviamos' , fr: 'Ce que nous expédions' },
    hero_strip_collections: { en: '{n} collections · 1000+ products', es: '{n} colecciones · 1000+ productos' , fr: '{n} collections · plus de 1000 produits' },
    home_most_asked: { en: 'Most asked', es: 'Lo más pedido' , fr: 'Les plus demandés' },
    home_popular_sub: { en: 'The ones customers ask about the most on WhatsApp.',
                          es: 'Los que más nos piden por WhatsApp.' , fr: 'Ce que nos clients nous demandent le plus sur WhatsApp.' },
    home_explore: { en: 'Explore', es: 'Explora' , fr: 'Explorer' },
    home_browse_title: { en: 'Browse products', es: 'Explora productos' , fr: 'Explorer les produits' },
    home_browse_sub: { en: 'Everything Eddy supplies, organised so you find it in seconds.',
                          es: 'Todo lo que Eddy suministra, organizado para que lo encuentres en segundos.' , fr: 'Tout ce qu’Eddy fournit, organisé pour que vous trouviez en quelques secondes.' },
    home_who: { en: 'Who we are', es: 'Quiénes somos' , fr: 'Qui nous sommes' },
    about_home_sub: { en: 'The wholesale partner behind your next bestseller.',
                          es: 'El socio de mayoreo detrás de tu próximo bestseller.' , fr: 'Le partenaire grossiste derrière votre prochain best-seller.' },
    home_cap_packed: { en: 'Packed and signed by Eddy', es: 'Empacado y firmado por Eddy' , fr: 'Emballé et signé par Eddy' },
    home_cap_stock: { en: 'Orders ready', es: 'Pedidos listos' , fr: 'Commandes prêtes' },
    home_see_faq: { en: 'See all FAQs & how we work', es: 'Ver todas las preguntas y cómo trabajamos' , fr: 'Toutes les FAQ et notre façon de travailler' },
    footer_chat: { en: 'Chat with us on WhatsApp', es: 'Chatea con nosotros por WhatsApp' , fr: 'Discutez avec nous sur WhatsApp' },
    footer_pay: { en: 'Payment & how to order', es: 'Pago y cómo pedir' , fr: 'Paiement et commande' },
    footer_backup: { en: '· calls & backup', es: '· llamadas y respaldo' , fr: '· appels et secours' },
    about_stat: { en: '{n} of 9 collections', es: '{n} de 9 colecciones' , fr: '{n} sur 9 collections' },
    contact_wa_k: { en: 'WhatsApp · fastest', es: 'WhatsApp · más rápido' , fr: 'WhatsApp · le plus rapide' },
    contact_wa_sub: { en: 'Send your inquiry list — quote within 24 hours',
                           es: 'Envía tu lista — cotización en 24 h' , fr: 'Envoyez votre liste — devis sous 24 heures' },
    contact_mail_k: { en: 'Email · catalogs & docs', es: 'Email · catálogos y docs' , fr: 'E-mail · catalogues et documents' },
    contact_mail_sub: { en: 'Price lists, shipping documents and invoices',
                           es: 'Listas de precios, documentos de envío y facturas' , fr: 'Listes de prix, documents d’expédition et factures' },
    shared_quote_list: { en: 'Quote list · ', es: 'Lista de cotización · ' , fr: 'Liste de devis · ' },
    shared_out_of_date: { en: 'This quote list is out of date', es: 'Esta lista de cotización está desactualizada' , fr: 'Cette liste de devis est obsolète' },
    shared_note_expired: { en: 'The items in this link are no longer in the catalog — our stock and prices change often. Message us and we’ll send you a fresh quotation.',
                            es: 'Los productos de este enlace ya no están en el catálogo — nuestro stock y precios cambian a menudo. Escríbenos y te enviaremos una cotización nueva.' , fr: 'Les articles de ce lien ne sont plus au catalogue — notre stock et nos prix changent souvent. Écrivez-nous et nous vous enverrons un nouveau devis.' },
    shared_review: { en: 'Review your {n}-line quote', es: 'Revisa tu cotización ({n} art.)' , fr: 'Vérifiez votre devis de {n} lignes' },
    shared_note: { en: 'Quantities are adjustable. Contact us for an official quotation.',
                          es: 'Las cantidades se pueden ajustar. Escríbenos y te damos una cotización oficial.' , fr: 'Les quantités sont modifiables. Contactez-nous pour un devis officiel.' },
    toast_added: { en: '{name} added to inquiry', es: '{name} añadido a la cotización' , fr: '{name} ajouté au devis' },
    toast_cleared: { en: 'Inquiry list cleared', es: 'Lista vaciada' , fr: 'Liste vidée' },
    toast_share: { en: 'Share link copied — send it to your customer', es: 'Enlace copiado — envíalo a tu cliente' , fr: 'Lien copié — envoyez-le à votre client' },
    toast_moq_min: { en: 'Minimum order for this item is {n} pcs', es: 'El pedido mínimo de este artículo es {n} pzs' , fr: 'Le minimum pour cet article est de {n} pièces' },
    moq_min_label: { en: 'Min. {n}', es: 'Mín. {n}' , fr: 'Min. {n}' },
    copy_failed: { en: 'Copy failed — please copy from the address bar', es: 'Copia fallida — cópialo de la barra de direcciones' , fr: 'Copie impossible — copiez depuis la barre d’adresse' },
    copy_list: { en: 'Copy list', es: 'Copiar lista' , fr: 'Copier la liste' },
    copied: { en: 'Copied!', es: '¡Copiado!' , fr: 'Copié !' },

    /* ---------------- 付款引导页 pay.html（L0） ---------------- */
    pay_eyebrow: { en: 'Payment', es: 'Pago' , fr: 'Paiement' },
    pay_title: { en: 'Complete your payment', es: 'Completa tu pago' , fr: 'Finalisez votre paiement' },
    pay_title_generic: { en: 'How to pay', es: 'Cómo pagar' , fr: 'Comment payer' },
    pay_sub: { en: 'Quote {q} · issued by EddySupply', es: 'Cotización {q} · emitida por EddySupply' , fr: 'Devis {q} · émis par EddySupply' },
    pay_sub_for: { en: 'Quote {q} · prepared for {name}', es: 'Cotización {q} · preparada para {name}' , fr: 'Devis {q} · préparé pour {name}' },
    pay_sub_generic: { en: 'Pay by bank transfer, Alipay or cash pickup — then send us the receipt.', es: 'Paga por transferencia, Alipay o efectivo — luego envíanos el comprobante.' , fr: 'Payez par virement, Alipay ou espèces — puis envoyez-nous le reçu.' },
    pay_amount: { en: 'Amount due', es: 'Importe a pagar' , fr: 'Montant à payer' },
    pay_ref: { en: 'Reference', es: 'Referencia' , fr: 'Référence' },
    pay_copy: { en: 'Copy', es: 'Copiar' , fr: 'Copier' },
    pay_expires: { en: 'Valid until {d}', es: 'Válida hasta {d}' , fr: 'Valable jusqu’au {d}' },
    pay_sub_generic_alipay: { en: 'Pay with Alipay in four steps — then send us the screenshot and we start the same day.', es: 'Paga con Alipay en cuatro pasos — luego envíanos la captura y empezamos el mismo día.' , fr: 'Payez avec Alipay en quatre étapes — puis envoyez-nous la capture et nous démarrons le jour même.' },
    pay_alipay_head: { en: 'Pay with Alipay', es: 'Pagar con Alipay' , fr: 'Payer avec Alipay' },
    pay_alipay_lede: { en: 'Simple and secure. Scan the code to install the app, then message us for your payment QR.', es: 'Simple y seguro. Escanea el código para instalar la app y luego escríbenos para recibir tu QR de pago.' , fr: 'Simple et sécurisé. Scannez le code pour installer l’application, puis écrivez-nous pour recevoir votre QR code de paiement.' },
    pay_step_dl: { en: 'Install the Alipay app', es: 'Instala la app de Alipay' , fr: 'Installer l’application Alipay' },
    pay_step_dl_sub: { en: 'Scan the code on the left with your camera, or use the App Store / Google Play links below.', es: 'Escanea el código de la izquierda con la cámara, o usa los enlaces a App Store / Google Play de abajo.' , fr: 'Scannez le code à gauche avec votre appareil photo, ou utilisez les liens App Store / Google Play ci-dessous.' },
    pay_step_card: { en: 'Link your bank card', es: 'Vincula tu tarjeta bancaria' , fr: 'Associer votre carte bancaire' },
    pay_step_card_sub: { en: 'Add a Visa, Mastercard or UnionPay card inside the app — one time only.', es: 'Añade una tarjeta Visa, Mastercard o UnionPay en la app — solo una vez.' , fr: 'Ajoutez une carte Visa, Mastercard ou UnionPay dans l’application — une seule fois.' },
    pay_step_scan: { en: 'Get the payment QR from us', es: 'Recibe el QR de pago' , fr: 'Recevoir le QR code de paiement' },
    pay_step_scan_sub: { en: 'Tap DM Eddy — we reply with a personal code tied to this quote.', es: 'Pulsa DM a Eddy — te respondemos con un código personal de esta cotización.' , fr: 'Touchez « DM Eddy » — nous vous répondons avec un code personnel lié à ce devis.' },
    pay_step_done: { en: 'Scan it and confirm', es: 'Escanea y confirma' , fr: 'Scannez et confirmez' },
    pay_step_done_sub: { en: 'Open Alipay → Scan, check the amount and reference match, then confirm.', es: 'Abre Alipay → Escanear, comprueba el importe y la referencia, y confirma.' , fr: 'Ouvrez Alipay → Scanner, vérifiez le montant et la référence, puis confirmez.' },
    pay_qr_alt: { en: 'Alipay app download QR code', es: 'Código QR para descargar Alipay' , fr: 'QR code de téléchargement de l’application Alipay' },
    pay_qr_tip: { en: 'Scan to install Alipay', es: 'Escanea para instalar Alipay' , fr: 'Scanner pour installer Alipay' },
    pay_qr_tip_none: { en: 'App download', es: 'Descarga de la app' , fr: 'Téléchargement de l’application' },
    pay_qr_none: { en: 'Download Alipay', es: 'Descarga Alipay' , fr: 'Télécharger Alipay' },
    pay_qr_none_sub: { en: 'Use the App Store or Google Play links below, or ask us on WhatsApp.', es: 'Usa los enlaces a App Store o Google Play de abajo, o escríbenos por WhatsApp.' , fr: 'Utilisez les liens App Store ou Google Play ci-dessous, ou écrivez-nous sur WhatsApp.' },
    pay_qr_get: { en: 'Get the QR on WhatsApp', es: 'Pedir el QR por WhatsApp' , fr: 'Recevoir le QR sur WhatsApp' },
    pay_get_app: { en: 'Get the app', es: 'Descargar la app' , fr: 'Télécharger l’application' },
    pay_other: { en: 'Other ways to pay', es: 'Otras formas de pago' , fr: 'Autres moyens de paiement' },
    pay_other_sub: { en: 'Bank transfer (T/T) for bulk orders, or USDT / Western Union / Remitly for samples.', es: 'Transferencia bancaria (T/T) para pedidos grandes, o USDT / Western Union / Remitly para muestras.' , fr: 'Virement bancaire (T/T) pour les grosses commandes, ou USDT / Western Union / Remitly pour les échantillons.' },
    pay_other_ask: { en: 'Ask us on WhatsApp', es: 'Pregúntanos por WhatsApp' , fr: 'Nous demander sur WhatsApp' },
    pay_methods: { en: 'Payment methods', es: 'Métodos de pago' , fr: 'Moyens de paiement' },
    pay_tt: { en: 'Bank transfer (T/T)', es: 'Transferencia bancaria (T/T)' , fr: 'Virement bancaire (T/T)' },
    pay_tt_sub: { en: 'Best for bulk orders — bank details are on your formal invoice.', es: 'Ideal para pedidos grandes — los datos bancarios están en tu factura.' , fr: 'Idéal pour les grosses commandes — les coordonnées bancaires figurent sur votre facture.' },
    pay_alipay: { en: 'Alipay', es: 'Alipay' , fr: 'Alipay' },
    pay_alipay_sub: { en: 'For small orders and repeat buyers — we send the QR on WhatsApp.', es: 'Para pedidos pequeños y clientes recurrentes — enviamos el QR por WhatsApp.' , fr: 'Pour les petites commandes et les clients réguliers — nous envoyons le QR sur WhatsApp.' },
    pay_alt: { en: 'USDT · Western Union · Remitly', es: 'USDT · Western Union · Remitly' , fr: 'USDT · Western Union · Remitly' },
    pay_alt_sub: { en: 'Fast for samples and small amounts.', es: 'Rápido para muestras e importes pequeños.' , fr: 'Rapide pour les échantillons et les petits montants.' },
    pay_after: { en: 'Get the payment QR', es: 'Recibe el QR de pago' , fr: 'Recevoir le QR code de paiement' },
    pay_step1: { en: 'DM Eddy on WhatsApp', es: 'Manda un DM a Eddy por WhatsApp' , fr: 'Écrire à Eddy sur WhatsApp' },
    pay_step2: { en: 'We send your personal Alipay QR code', es: 'Te enviamos tu código QR de Alipay' , fr: 'Nous vous envoyons votre QR code Alipay' },
    pay_step3: { en: 'Scan it in Alipay and pay', es: 'Escanéalo en Alipay y paga' , fr: 'Scannez-le dans Alipay et payez' },
    pay_cta: { en: 'DM Eddy', es: 'DM a Eddy' , fr: 'DM Eddy' },
    pay_phone_lead: { en: "Leave your number — we'll send the payment code + official quote sheet straight to your WhatsApp.", es: 'Deja tu número — te enviamos el código de pago y la cotización oficial directo a tu WhatsApp.' , fr: 'Laissez votre numéro — nous vous envoyons le code de paiement et le devis officiel directement sur WhatsApp.' },
    pay_phone_ph: { en: '+34 612 345 678', es: '+34 612 345 678' , fr: '+33 6 12 34 56 78' },
    pay_phone_btn: { en: 'Leave number', es: 'Dejar mi número' , fr: 'Laisser mon numéro' },
    pay_phone_done: { en: '✓ Number saved', es: '✓ Número guardado' , fr: '✓ Numéro enregistré' },
    pay_phone_privacy: { en: 'We only use this to send your documents. No spam.', es: 'Solo lo usamos para enviarte tus documentos. Sin spam.' , fr: 'Nous ne l’utilisons que pour vous envoyer vos documents. Aucun spam.' },
    pay_phone_ok: { en: 'Number saved — check your WhatsApp shortly.', es: 'Número guardado — revisa tu WhatsApp en breve.' , fr: 'Numéro enregistré — consultez votre WhatsApp dans un instant.' },
    pay_phone_invalid: { en: 'Enter a valid number with country code, e.g. +34 612 345 678', es: 'Introduce un número válido con código de país, p. ej. +34 612 345 678' , fr: 'Saisissez un numéro valide avec l’indicatif du pays, ex. +33 6 12 34 56 78' },
    pay_or: { en: 'or', es: 'o' , fr: 'ou' },
    pay_afterpay_note: { en: 'Paid already? Send the screenshot in the same chat — we confirm within 2 working hours and start the same day.', es: '¿Ya pagaste? Envía la captura en el mismo chat — confirmamos en 2 horas laborables y empezamos el mismo día.' , fr: 'Déjà payé ? Envoyez la capture dans le même chat — nous confirmons sous 2 heures ouvrées et démarrons le jour même.' },
    pay_safe: { en: 'Pay only to the account shown on our invoice or confirmed on WhatsApp. We never change bank details by email.', es: 'Paga solo a la cuenta de nuestra factura o confirmada por WhatsApp. Nunca cambiamos datos bancarios por email.' , fr: 'Payez uniquement au compte indiqué sur notre facture ou confirmé sur WhatsApp. Nous ne modifions jamais les coordonnées bancaires par e-mail.' },
    pay_help: { en: 'Need the Alipay QR or a formal invoice? Ask us — we reply within 24 hours.', es: '¿Necesitas el QR de Alipay o una factura? Escríbenos — respondemos en 24 horas.' , fr: 'Besoin du QR Alipay ou d’une facture ? Écrivez-nous — réponse sous 24 heures.' },
    pay_back: { en: 'Back to cart', es: 'Volver al carrito' , fr: 'Retour au panier' },
    pay_back_catalog: { en: 'Back to catalog', es: 'Volver al catálogo' , fr: 'Retour au catalogue' },
    pay_wa_prefill: { en: 'Hi Eddy, please send me the Alipay payment QR for quote {q} ({amt}).', es: 'Hola Eddy, envíame el QR de pago de Alipay de la cotización {q} ({amt}).' , fr: 'Bonjour Eddy, merci de m’envoyer le QR code de paiement Alipay pour le devis {q} ({amt}).' },
    pay_wa_generic: { en: 'Hi Eddy, I would like to pay for my order.', es: 'Hola Eddy, quiero pagar mi pedido.' , fr: 'Bonjour Eddy, je voudrais payer ma commande.' },
    pay_wa_qr: { en: 'Hi Eddy, please send me the Alipay QR code for quote {q} ({amt}).', es: 'Hola Eddy, envíame el código QR de Alipay de la cotización {q} ({amt}).' , fr: 'Bonjour Eddy, merci de m’envoyer le QR code Alipay pour le devis {q} ({amt}).' },
    pay_wa_qr_generic: { en: 'Hi Eddy, please send me your Alipay QR code.', es: 'Hola Eddy, envíame tu código QR de Alipay.' , fr: 'Bonjour Eddy, merci de m’envoyer votre QR code Alipay.' },
    pay_wa_other: { en: 'Hi Eddy, I would like to pay by bank transfer or USDT instead of Alipay. My quote is {q}.', es: 'Hola Eddy, prefiero pagar por transferencia o USDT en vez de Alipay. Mi cotización es {q}.' , fr: 'Bonjour Eddy, je préfère payer par virement ou USDT plutôt qu’Alipay. Mon devis est {q}.' },
    pay_wa_other_generic: { en: 'Hi Eddy, I would like to pay by bank transfer or USDT.', es: 'Hola Eddy, quiero pagar por transferencia o USDT.' , fr: 'Bonjour Eddy, je voudrais payer par virement bancaire ou USDT.' },

    /* ---------------- About 页（静态文案） ---------------- */
    about_hero: { en: 'Premium quality, factory pricing', es: 'Calidad premium, precio de fábrica' , fr: 'Qualité premium, prix d’usine' },
    about_lede: { en: 'EddySupply is the wholesale catalog of <strong>Axeltrading</strong>, run by Eddy. We help overseas retailers, Amazon sellers and dropshippers source trending products — electronics, perfumes, watches and accessories — with clear photos, honest specs and fast, direct communication on WhatsApp. No middlemen, no marketplace fees, no guesswork.',
                           es: 'EddySupply es el catálogo de mayoreo de <strong>Axeltrading</strong>, dirigido por Eddy. Ayudamos a minoristas, vendedores de Amazon y dropshippers a abastecerse de productos de tendencia — electrónica, perfumes, relojes y accesorios — con fotos claras, especificaciones honestas y comunicación rápida y directa por WhatsApp. Sin intermediarios, sin comisiones de marketplace, sin sorpresas.' , fr: 'EddySupply est le catalogue de gros d’<strong>Axeltrading</strong>, géré par Eddy. Nous aidons les revendeurs étrangers, vendeurs Amazon et dropshippers à s’approvisionner en produits tendance — électronique, parfums, montres et accessoires — avec des photos claires, des caractéristiques honnêtes et une communication rapide et directe sur WhatsApp. Pas d’intermédiaires, pas de frais de marketplace, pas de suppositions.' },
    about_mosaic_what: { en: 'What we ship', es: 'Lo que enviamos' , fr: 'Ce que nous expédions' },
    fact_products: { en: 'products curated', es: 'productos seleccionados' , fr: 'produits sélectionnés' },
    fact_countries: { en: 'countries served', es: 'países atendidos' , fr: 'pays servis' },
    fact_moq: { en: 'flexible quantity', es: 'cantidad flexible' , fr: 'quantité flexible' },
    fact_custom: { en: 'OEM / ODM welcome', es: 'OEM / ODM bienvenido' , fr: 'OEM / ODM bienvenus' },
    fact_reply: { en: 'quote reply time', es: 'tiempo de cotización' , fr: 'délai de réponse' },
    real_head1: { en: 'Inside the operation', es: 'Dentro de la operación' , fr: 'Dans les coulisses' },
    real_sub1: { en: 'Shot in Guangdong', es: 'Fotografiado en Guangdong' , fr: 'Pris au Guangdong' },
    real_h2: { en: 'Real photos, real packing room', es: 'Fotos reales, sala de empaque real' , fr: 'Vraies photos, vrai atelier d’emballage' },
    real_lede: { en: 'No stock renders and no borrowed pictures — these were taken in our own warehouse and packing room. It is the same place your order leaves from.',
                           es: 'Sin renders de stock ni fotos prestadas — estas se tomaron en nuestro propio almacén y sala de empaque. Es el mismo lugar de donde sale tu pedido.' , fr: 'Pas de rendus stock ni de photos empruntées — celles-ci ont été prises dans notre propre entrepôt et atelier d’emballage. C’est le même endroit d’où part votre commande.' },
    real_head2: { en: 'Earbuds & headphones', es: 'Auriculares y earbuds' , fr: 'Écouteurs et casques' },
    real_sub2: { en: 'Line & sample wall', es: 'Línea y muro de muestras' , fr: 'Ligne et mur d’échantillons' },
    real_h2_2: { en: 'Where the audio range comes from', es: 'De dónde viene la línea de audio' , fr: 'D’où vient la gamme audio' },
    real_lede_2: { en: 'The line that builds our earbuds and headphones, the burn-in racks every batch goes through, and the sample wall those models are photographed on.',
                           es: 'La línea que fabrica nuestros earbuds y auriculares, los racks de burn-in por los que pasa cada lote, y el muro de muestras donde se fotografían esos modelos.' , fr: 'La ligne qui fabrique nos écouteurs et casques, les racks de rodage par lesquels passe chaque lot, et le mur d’échantillons sur lequel ces modèles sont photographiés.' },
    /* 2026-10-22：About 页实拍图说明从「下方文字块」改为图片左下角胶囊标签
       （与首页 about-strip 同款效果，Eddy 指定）。原两行说明文案见 git 历史。 */
    about_cap1: { en: 'Orders ready', es: 'Pedidos listos' , fr: 'Commandes prêtes' },
    about_cap2: { en: 'Export-ready packing', es: 'Empaque listo para exportar' , fr: 'Emballage prêt pour l’export' },
    about_cap3: { en: 'Signed off by Eddy', es: 'Revisado y firmado por Eddy' , fr: 'Vérifié et signé par Eddy' },
    about_cap4: { en: '1,000+ SKUs on hand', es: 'Más de 1.000 SKU en stock' , fr: 'Plus de 1 000 références en stock' },
    about_cap5: { en: 'Shock-proof protection', es: 'Protección antigolpes' , fr: 'Protection anti-choc' },
    about_cap6: { en: 'Every model, on the wall', es: 'Cada modelo, en el muro' , fr: 'Chaque modèle, sur le mur' },
    about_cap7: { en: 'Assembled and checked by hand', es: 'Ensamblados y revisados a mano' , fr: 'Assemblés et contrôlés à la main' },
    about_cap8: { en: 'Burn-in tested before packing', es: 'Test de burn-in antes de empacar' , fr: 'Test de rodage avant emballage' },
    /* ---- 客户案例：真实订单（about.html #proof，视频与静帧在 img/proof/） ---- */
    proof_head: { en: 'One order, start to finish', es: 'Un pedido, de principio a fin' , fr: 'Une commande, du début à la fin' },
    proof_sub: { en: 'Spain · Nov 2025', es: 'España · nov 2025' , fr: 'Espagne · nov. 2025' },
    proof_h2: { en: 'A real customer, not a stock photo', es: 'Un cliente real, no una foto de catálogo' , fr: 'Un vrai client, pas une photo de catalogue' },
    proof_lede: { en: 'He wrote to us on 11 September 2025. His first carton sold out in eighteen days, so he ordered again — paid on 4 November, packed on 19 November. Everything below is his own screenshots and his own footage: names, catalogue prices and order totals removed.',
                          es: 'Nos escribió el 11 de septiembre de 2025. Su primera caja se agotó en dieciocho días, así que volvió a pedir: pagó el 4 de noviembre y lo empaquetamos el 19. Todo lo que sigue son sus propias capturas y su propio vídeo: sin nombres, precios de catálogo ni importes.' , fr: 'Il nous a écrit le 11 septembre 2025. Son premier carton s’est vendu en dix-huit jours, il a donc recommandé — payé le 4 novembre, emballé le 19. Tout ce qui suit provient de ses propres captures et vidéos : noms, prix catalogue et montants supprimés.' },
    proof_s1t: { en: '11 Sept — first hello', es: '11 sept — primer saludo' , fr: '11 sept. — premier contact' },
    proof_s1d: { en: '“Do you have a catalog, or should we send you pictures of what we want?”', es: '«¿Tienes catálogo o te enviamos fotos de lo que queremos?»' , fr: '« Avez-vous un catalogue, ou devons-nous vous envoyer des photos de ce que nous voulons ? »' },
    proof_s2t: { en: 'Wrapped and packed', es: 'Envuelto y embalado' , fr: 'Enveloppé et emballé' },
    proof_s2d: { en: 'Bubble wrap on every bottle, air columns down both sides, tape last — and a photo inside the carton before it closes.', es: 'Plástico de burbujas en cada botella, columnas de aire a ambos lados y cinta al final. Y una foto dentro de la caja antes de cerrarla.' , fr: 'Film à bulles sur chaque flacon, colonnes d’air des deux côtés, scotch en dernier — et une photo dans le carton avant fermeture.' },
    proof_s3t: { en: 'Box 23349 · 1.1 kg', es: 'Caja 23349 · 1,1 kg' , fr: 'Carton 23349 · 1,1 kg' },
    proof_s3d: { en: 'Marked by hand before the tape goes on: number, size, weight — then the DHL label goes on top.', es: 'Marcado a mano antes de precintar: número, medidas y peso. Después se pega la etiqueta de DHL.' , fr: 'Marqué à la main avant le scotch : numéro, dimensions, poids — puis l’étiquette DHL par-dessus.' },
    proof_s4t: { en: 'Sold out — 18 days later', es: 'Agotado — 18 días después' , fr: 'Épuisé — 18 jours plus tard' },
    proof_s4d: { en: '“We already sold the perfumes we bought. We’ll make the video with the next package.”', es: '«Ya vendimos los perfumes que compramos. Haremos el vídeo con el próximo paquete.»' , fr: '« Nous avons déjà vendu les parfums achetés. Nous ferons la vidéo avec le prochain colis. »' },
    /* 首页时间轴新增两格：订单清点 / 付款确认 */
    proof_l1t: { en: 'Pulled and checked, bottle by bottle', es: 'Sacado y revisado, botella a botella' , fr: 'Prélevés et vérifiés, flacon par flacon' },
    proof_l1d: { en: 'Two Sauvage, one Erba Pura, and the rest of his list behind them — counted before anything gets wrapped.', es: 'Dos Sauvage, un Erba Pura y el resto de su lista detrás: contados antes de envolver nada.' , fr: 'Deux Sauvage, un Erba Pura, et le reste de sa liste derrière — comptés avant tout emballage.' },
    proof_p1t: { en: 'Paid 4 November', es: 'Pagado el 4 de noviembre' , fr: 'Payé le 4 novembre' },
    proof_p1d: { en: 'He forwards the platform receipt straight into the chat — “Your payment is successful.” The amount stays out of the picture; this date is what starts the 20-day clock.', es: 'Reenvía el recibo de la plataforma directo al chat: «Your payment is successful». El importe no aparece; esa fecha es la que arranca los 20 días.' , fr: 'Il transmet le reçu de la plateforme directement dans le chat : « Your payment is successful ». Le montant n’apparaît pas ; c’est cette date qui lance le délai de 20 jours.' },
    /* 2026-10-21 删除 bench_*（「箱内实录」第二条视频，与开箱片同源、文案与打包格重复） */
    proof_v_eyebrow: { en: 'The video he sent back', es: 'El vídeo que nos envió' , fr: 'La vidéo qu’il nous a renvoyée' },
    proof_v_h3: { en: '“All in perfect conditions.”', es: '«Todo en perfectas condiciones.»' , fr: '« Tout en parfait état. »' },
    proof_v_p: { en: 'His own phone, his own hands, his own voice — nothing added. You hear the tape go, he lifts the air columns out, then he unwraps every bottle and gives a thumbs-up before closing the carton again.',
                          es: 'Su móvil, sus manos y su voz, sin añadir nada. Se oye la cinta al abrirse, saca las columnas de aire, desempaña cada botella y levanta el pulgar antes de cerrar la caja.' , fr: 'Son téléphone, ses mains, sa voix — rien d’ajouté. On entend le scotch, il retire les colonnes d’air, puis déballe chaque flacon et fait un pouce levé avant de refermer le carton.' },
    proof_v_note: { en: '18 seconds, sound on. Used with his permission; his name, address and order total are not shown.', es: '18 segundos, con sonido. Publicado con su permiso: no mostramos su nombre, dirección ni el importe del pedido.' , fr: '18 secondes, son activé. Publié avec son accord ; son nom, son adresse et le montant de la commande ne sont pas affichés.' },
    /* About 页「封箱墙」（2026-10-21 从首页搬到关于页）：前 8 格是箱子里装了什么，
       后 7 格是封好、称重、手写编号的样子。画面里可以看到箱内的品牌包装（Eddy 已确认
       不介意），但文字只写箱号/重量/品类，不写品牌名。 */
    pack_h3: { en: 'Twelve parcels, one ordinary week', es: 'Doce paquetes, una semana normal' , fr: 'Douze colis, une semaine ordinaire' },
    pack_p: { en: 'Open them first: earphones, phone cases, speakers, gift sets, a foam-lined carton of odds and ends. Then the same cartons sealed — box number, weight and size written by hand before the tape went on. Eight opened on the same rug, four taped shut and sent. Not one special box: this is an ordinary week here.',
                          es: 'Primero ábrelas: auriculares, fundas de móvil, altavoces, estuches de regalo, una caja con espuma llena de surtido. Después las mismas cajas ya cerradas: número, peso y medidas escritos a mano antes de precintar. Ocho abiertas en la misma alfombra, cuatro precintadas y enviadas. No es una caja especial: es una semana normal aquí.' , fr: 'Ouvrez-les d’abord : écouteurs, coques de téléphone, enceintes, coffrets cadeaux, un carton rembourré de camelote. Puis les mêmes cartons scellés — numéro, poids et dimensions écrits à la main avant le scotch. Huit ouverts sur le même tapis, quatre scotchés et expédiés. Aucun carton spécial : c’est une semaine ordinaire ici.' },
    pack_w1: { en: 'Earphones · three cartons', es: 'Auriculares · tres cajas' , fr: 'Écouteurs · trois cartons' },
    pack_w2: { en: 'Earphones · one carton, opened', es: 'Auriculares · una caja, abierta' , fr: 'Écouteurs · un carton, ouvert' },
    pack_w3: { en: 'Phone cases · two cartons', es: 'Fundas de móvil · dos cajas' , fr: 'Coques de téléphone · deux cartons' },
    pack_w4: { en: 'Speakers + earphones · one carton', es: 'Altavoces + auriculares · una caja' , fr: 'Enceintes + écouteurs · un carton' },
    pack_w5: { en: 'Mixed · one carton', es: 'Surtido · una caja' , fr: 'Assortiment · un carton' },
    pack_w6: { en: 'Mixed · foam-lined carton', es: 'Surtido · caja con espuma' , fr: 'Assortiment · carton rembourré' },
    pack_w7: { en: 'Gift boxes · one carton', es: 'Estuches de regalo · una caja' , fr: 'Coffrets cadeaux · un carton' },
    pack_w8: { en: 'Two cartons, not yet taped', es: 'Dos cajas, aún sin precintar' , fr: 'Deux cartons, pas encore scotchés' },
    proof_more: { en: 'Read the whole order', es: 'Ver el pedido completo' , fr: 'Voir la commande complète' },
    hiw_eyebrow: { en: 'How it works', es: 'Cómo funciona' , fr: 'Comment ça marche' },
    hiw_title: { en: 'How to order, pay & ship', es: 'Cómo pedir, pagar y enviar' , fr: 'Commander, payer, expédier' },
    hiw_sub: { en: 'Three steps from catalog to your door.', es: 'Tres pasos del catálogo a tu puerta.' , fr: 'Trois étapes du catalogue à votre porte.' },
    hiw_order_title: { en: 'How to order?', es: '¿Cómo pedir?' , fr: 'Comment commander ?' },
    hiw_order_1t: { en: 'Browse the catalog', es: 'Explora el catálogo' , fr: 'Parcourir le catalogue' },
    hiw_order_1d: { en: 'eddytrading.com — 1000+ products', es: 'eddytrading.com — más de 1000 productos' , fr: 'eddytrading.com — plus de 1000 produits' },
    hiw_order_2t: { en: 'Add items to your inquiry list', es: 'Añade artículos a tu lista de cotización' , fr: 'Ajoutez des articles à votre liste de devis' },
    hiw_order_2d: { en: 'One tap per item, kept in your browser', es: 'Un toque por artículo, guardado en tu navegador' , fr: 'Un appui par article, conservé dans votre navigateur' },
    hiw_order_3t: { en: 'Send the list on WhatsApp', es: 'Envía la lista por WhatsApp' , fr: 'Envoyez la liste sur WhatsApp' },
    hiw_order_3d: { en: 'The site writes the message for you', es: 'nosotros armamos el mensaje por ti' , fr: 'Le site rédige le message pour vous' },
    hiw_order_4t: { en: 'Get your quote within 24 hours', es: 'Recibe tu cotización en 24 h' , fr: 'Recevez votre devis sous 24 h' },
    hiw_order_4d: { en: 'Unit price, MOQ and shipping cost', es: 'Precio unitario, MOQ y costo de envío' , fr: 'Prix unitaire, MOQ et frais de port' },
    hiw_order_foot: { en: 'No account needed — send your list as it is.', es: 'Sin cuenta — envía tu lista tal cual.' , fr: 'Aucun compte requis — envoyez votre liste telle quelle.' },
    hiw_pay_title: { en: 'How to pay?', es: '¿Cómo pagar?' , fr: 'Comment payer ?' },
    hiw_pay_1t: { en: 'T/T bank transfer', es: 'Transferencia bancaria (T/T)' , fr: 'Virement bancaire (T/T)' },
    hiw_pay_1d: { en: 'Best for bulk orders', es: 'Ideal para pedidos grandes' , fr: 'Idéal pour les grosses commandes' },
    hiw_pay_2t: { en: 'Alipay', es: 'Alipay' , fr: 'Alipay' },
    hiw_pay_2d: { en: 'Small orders and repeat buyers', es: 'Pedidos pequeños y compradores frecuentes' , fr: 'Petites commandes et clients réguliers' },
    hiw_pay_3t: { en: 'USDT · Western Union · Remitly', es: 'USDT · Western Union · Remitly' , fr: 'USDT · Western Union · Remitly' },
    hiw_pay_3d: { en: 'Samples and fast payments', es: 'Muestras y pagos rápidos' , fr: 'Échantillons et paiements rapides' },
    hiw_pay_4t: { en: 'Formal invoice for every order', es: 'Factura formal en cada pedido' , fr: 'Facture formelle pour chaque commande' },
    hiw_pay_4d: { en: 'Pay only to the account shown on it', es: 'Paga solo a la cuenta que aparece en ella' , fr: 'Payez uniquement au compte qui y figure' },
    hiw_pay_foot: { en: 'Payment confirmed, then we start packing.', es: 'Pago confirmado, luego armamos y empacamos tu pedido.' , fr: 'Paiement confirmé, puis nous préparons le colis.' },
    hiw_ship_title: { en: 'How about shipping?', es: '¿Cómo va el envío?' , fr: 'Et la livraison ?' },
    hiw_ship_1t: { en: 'Express air', es: 'Aéreo exprés' , fr: 'Express aérien' },
    hiw_ship_1d: { en: 'DHL · UPS · FedEx — typically 8–10 working days', es: 'DHL · UPS · FedEx — típicamente 8–10 días hábiles' , fr: 'DHL · UPS · FedEx — généralement 8 à 10 jours ouvrés' },
    hiw_ship_2t: { en: 'Perfumes & batteries', es: 'Perfumes y baterías' , fr: 'Parfums et batteries' },
    hiw_ship_2d: { en: '18–22 days on the sensitive-goods line', es: '18–22 días en la línea de mercancías sensibles' , fr: '18 à 22 jours sur la ligne marchandises sensibles' },
    hiw_ship_3t: { en: 'Sea freight', es: 'Flete marítimo' , fr: 'Fret maritime' },
    hiw_ship_3d: { en: '20 kg minimum — about 50 days, lowest cost per kg', es: 'Mínimo 20 kg — unos 50 días, menor costo por kg' , fr: '20 kg minimum — environ 50 jours, coût le plus bas au kg' },
    hiw_ship_4t: { en: 'Duties', es: 'Aranceles' , fr: 'Droits de douane' },
    hiw_ship_4d: { en: 'DDP in the US & Europe, DAP elsewhere', es: 'DDP en EE. UU. y Europa, DAP en el resto' , fr: 'DDP aux États-Unis et en Europe, DAP ailleurs' },
    hiw_ship_foot: { en: 'Shipping is quoted per order, before you pay.', es: 'El envío se cotiza por pedido, antes de pagar.' , fr: 'Le port est devisé par commande, avant paiement.' },
    hiw_note: { en: '<b>Transit times are carrier estimates, not guaranteed delivery dates.</b> In-stock items are dispatched within 24–48 hours after payment clears. If something arrives damaged, send photos within 7 days and we replace or refund the affected units.',
                           es: '<b>Los tiempos de tránsito son estimaciones de la transportista, no fechas garantizadas de entrega.</b> Los artículos en stock se despachan en 24–48 horas tras confirmar el pago. Si algo llega dañado, mándanos fotos por WhatsApp en 7 días y lo resolvemos: reemplazamos o reembolsamos las piezas afectadas.' , fr: '<b>Les délais sont des estimations des transportistes, pas des dates de livraison garanties.</b> Les articles en stock partent sous 24 à 48 h après confirmation du paiement. Si un article arrive endommagé, envoyez des photos sous 7 jours : nous remplaçons ou remboursons les pièces concernées.' },
    faq_title: { en: 'Frequently asked questions', es: 'Preguntas frecuentes' , fr: 'Questions fréquentes' },
    faq1_q: { en: 'How do I place an order?', es: '¿Cómo hago un pedido?' , fr: 'Comment passer commande ?' },
    faq1_a: { en: '<p>Browse the catalog and add each item to your inquiry list — one tap per item and no account needed. Then send the list to Eddy on WhatsApp or by email: the site writes the message for you.</p><p>You get a quote within 24 hours with the unit price, MOQ and shipping cost. We start picking and packing once payment is confirmed, and we send you the tracking number as soon as your parcel leaves.</p>',
                           es: '<p>Entra al catálogo y agrega cada producto a tu lista de cotización — un clic por producto y sin necesidad de crear cuenta. Luego mándale la lista a Eddy por WhatsApp o por email: nosotros armamos el mensaje por ti.</p><p>Te enviamos la cotización en 24 h con el precio unitario, el MOQ y el envío. En cuanto confirmas el pago armamos y empacamos tu pedido, y te pasamos el número de seguimiento en cuanto sale.</p>' , fr: '<p>Parcourez le catalogue et ajoutez chaque article à votre liste de devis — un appui par article, sans compte. Envoyez ensuite la liste à Eddy sur WhatsApp ou par e-mail : le site rédige le message pour vous.</p><p>Vous recevez un devis sous 24 h avec le prix unitaire, le MOQ et les frais de port. Nous commençons la préparation dès confirmation du paiement, et vous envoyons le numéro de suivi dès le départ du colis.</p>' },
    faq2_q: { en: 'What is the MOQ (minimum order quantity)?', es: '¿Qué es el MOQ (cantidad mínima de pedido)?' , fr: 'Qu’est-ce que le MOQ (quantité minimale de commande) ?' },
    faq2_a: { en: '<p>MOQ is flexible and varies by product. Some items ship as single units for testing; better prices kick in at volume. Just ask on WhatsApp for the exact MOQ of anything you’re interested in.</p>',
                           es: '<p>El MOQ es flexible y cambia según el producto. Algunos los mandamos sueltos para que pruebes; el precio baja conforme compras más. Escríbenos por WhatsApp y te decimos el MOQ exacto de lo que te interese.</p>' , fr: '<p>Le MOQ est flexible et varie selon le produit. Certains articles partent à l’unité pour essai ; les meilleurs prix s’appliquent dès le volume. Demandez simplement le MOQ exact sur WhatsApp.</p>' },
    faq3_q: { en: 'Can I get samples before a bulk order?', es: '¿Puedo pedir muestras antes de un pedido grande?' , fr: 'Puis-je recevoir des échantillons avant une commande en volume ?' },
    faq3_a: { en: '<p>Yes. Samples are recommended for first-time buyers — you only pay the sample price plus shipping. The sample cost can often be deducted from your first bulk order.</p>',
                           es: '<p>Sí. Si compras por primera vez, mejor pide muestras — solo pagas el precio de la muestra y el envío. Casi siempre podemos restar ese costo de tu primer pedido grande.</p>' , fr: '<p>Oui. Les échantillons sont recommandés pour un premier achat — vous payez seulement le prix de l’échantillon et le port. Ce coût peut souvent être déduit de votre première commande en volume.</p>' },
    faq4_q: { en: 'How is shipping handled and what does it cost?', es: '¿Cómo se maneja el envío y cuánto cuesta?' , fr: 'Comment fonctionne l’expédition et combien coûte-t-elle ?' },
    faq4_a: { en: '<p>We ship worldwide. Freight is a first-kilo rate plus a per-kilo rate on the billed weight (the heavier of actual and volumetric weight, rounded up to the next kg):</p><ul><li><b>Europe (EU · UK · Norway · Sweden · Denmark)</b> — €30 for the first kg, + €10 per extra kg</li><li><b>North America (US · CA · MX)</b> — $40 for the first kg, + $15 per extra kg</li><li><b>Australia &amp; New Zealand</b> — $30 for the first kg, + $10 per extra kg (USD)</li></ul><p>Other destinations, including Switzerland, are quoted case by case. Send your inquiry list with your country and we confirm the exact freight before you pay anything.</p>',
                           es: '<p>Enviamos a todo el mundo. El flete se calcula con una tarifa por el primer kilo más una tarifa por kilo adicional sobre el peso facturable (el mayor entre peso real y volumétrico, redondeado al siguiente kg):</p><ul><li><b>Europa (UE · Reino Unido · Noruega · Suecia · Dinamarca)</b> — 30 € el primer kg, + 10 € por kg adicional</li><li><b>Norteamérica (EE. UU. · CA · MX)</b> — 40 $ el primer kg, + 15 $ por kg adicional</li><li><b>Australia y Nueva Zelanda</b> — 30 $ el primer kg, + 10 $ por kg adicional (USD)</li></ul><p>El resto de destinos, incluida Suiza, se cotizan caso por caso. Envía tu lista con tu país y confirmamos el flete exacto antes de que pagues nada.</p>' , fr: '<p>Nous expédions dans le monde entier. Le fret = tarif du premier kilo + tarif par kilo supplémentaire sur le poids taxable (le plus élevé entre poids réel et volumétrique, arrondi au kg supérieur) :</p><ul><li><b>Europe (UE · Royaume-Uni · Norvège · Suède · Danemark)</b> — 30 € le premier kg, + 10 € par kg supplémentaire</li><li><b>Amérique du Nord (É.-U. · CA · MX)</b> — 40 $ le premier kg, + 15 $ par kg supplémentaire</li><li><b>Australie et Nouvelle-Zélande</b> — 30 $ le premier kg, + 10 $ par kg supplémentaire (USD)</li></ul><p>Les autres destinations, dont la Suisse, sont devisées au cas par cas. Envoyez votre liste avec votre pays et nous confirmons le fret exact avant tout paiement.</p>' },
    faq5_q: { en: 'What payment methods do you accept?', es: '¿Qué métodos de pago aceptan?' , fr: 'Quels moyens de paiement acceptez-vous ?' },
    faq5_a: { en: '<p>We accept bank transfer (T/T), Alipay, USDT, Western Union and Remitly:</p><ul><li><b>T/T bank transfer</b> — the usual route for bulk orders.</li><li><b>Alipay</b> — suits smaller orders and repeat buyers.</li><li><b>USDT · Western Union · Remitly</b> — fast, good for samples.</li></ul><p>Every order comes with a <b>formal invoice</b> showing the exact account to pay into. Pay only to the account on that invoice — if anyone asks you to pay somewhere else, it is not us. Production starts once payment is confirmed.</p>',
                           es: '<p>Aceptamos transferencia bancaria (T/T), Alipay, USDT, Western Union y Remitly:</p><ul><li><b>Transferencia bancaria (T/T)</b> — la vía usual para pedidos grandes.</li><li><b>Alipay</b> — para pedidos pequeños y compradores frecuentes.</li><li><b>USDT · Western Union · Remitly</b> — rápido, ideal para muestras.</li></ul><p>Cada pedido incluye una <b>factura formal</b> con la cuenta exacta donde pagar. Paga solo a la cuenta de esa factura — si alguien te pide pagar en otro lado, no somos nosotros. La producción empieza al confirmar el pago.</p>' , fr: '<p>Nous acceptons le virement bancaire (T/T), Alipay, USDT, Western Union et Remitly :</p><ul><li><b>Virement (T/T)</b> — la voie habituelle pour les grosses commandes.</li><li><b>Alipay</b> — adapté aux petites commandes et aux clients réguliers.</li><li><b>USDT · Western Union · Remitly</b> — rapide, idéal pour les échantillons.</li></ul><p>Chaque commande s’accompagne d’une <b>facture formelle</b> indiquant le compte exact où payer. Payez uniquement ce compte — si quelqu’un vous demande de payer ailleurs, ce n’est pas nous. La production démarre après confirmation du paiement.</p>' },
    faq6_q: { en: 'How long does delivery take?', es: '¿Cuánto tarda la entrega?' , fr: 'Quel est le délai de livraison ?' },
    faq6_a: { en: '<p>In-stock items are dispatched within 24–48 hours after payment is confirmed.</p><ul><li>Express air by <b>DHL / UPS / FedEx</b> — typically <b>8–10 working days</b>.</li><li><b>Perfumes and battery products</b> — about <b>18–22 days</b>. Alcohol-based liquids and lithium batteries can’t travel on standard express, so they fly on a dedicated sensitive-goods line instead. It isn’t slower handling, it’s a different channel.</li><li><b>Sea freight</b> — minimum <b>20 kg</b>, about <b>50 days</b>. Lowest cost per kg for large, non-urgent orders.</li></ul><p>These are carrier estimates, not guaranteed delivery dates — we confirm the exact timeline with every quote.</p>',
                           es: '<p>Los artículos en stock se despachan en 24–48 horas tras confirmar el pago.</p><ul><li>Aéreo exprés por <b>DHL / UPS / FedEx</b> — típicamente <b>8–10 días hábiles</b>.</li><li><b>Perfumes y productos con batería</b> — unos <b>18–22 días</b>. Los líquidos a base de alcohol y las baterías de litio no viajan en exprés estándar, así que van por una línea dedicada de mercancías sensibles. No es manejo más lento, es otro canal.</li><li><b>Flete marítimo</b> — mínimo <b>20 kg</b>, unos <b>50 días</b>. Menor costo por kg para pedidos grandes y no urgentes.</li></ul><p>Son estimaciones de la transportista, no fechas garantizadas — confirmamos la línea de tiempo exacta con cada cotización.</p>' , fr: '<p>Les articles en stock partent sous 24 à 48 h après confirmation du paiement.</p><ul><li>Express aérien <b>DHL / UPS / FedEx</b> — généralement <b>8 à 10 jours ouvrés</b>.</li><li><b>Parfums et produits avec batterie</b> — environ <b>18 à 22 jours</b>. Les liquides alcoolisés et les batteries lithium ne voyagent pas en express standard : ils empruntent une ligne dédiée aux marchandises sensibles. Ce n’est pas un traitement plus lent, c’est un autre circuit.</li><li><b>Fret maritime</b> — minimum <b>20 kg</b>, environ <b>50 jours</b>. Le coût le plus bas au kg pour les commandes volumineuses et non urgentes.</li></ul><p>Ce sont des estimations des transportistes, pas des dates garanties — nous confirmons le délai exact avec chaque devis.</p>' },
    faq7_q: { en: 'Are import duties and taxes included?', es: '¿Los aranceles e impuestos de importación están incluidos?' , fr: 'Les droits et taxes d’importation sont-ils inclus ?' },
    faq7_a: { en: '<p>It depends on where you are:</p><ul><li><b>United States and Europe — DDP.</b> We clear customs and pay the duties, so the price on your invoice is the final price. Nothing extra to settle on delivery.</li><li><b>All other regions — DAP.</b> We deliver to your address; duties and taxes are paid by you on arrival.</li></ul><p>We declare your goods at their real value — no under-declaring, which keeps your customs records clean. Tell Eddy your destination and we quote DDP or DAP up front.</p>',
                           es: '<p>Depende de dónde estés:</p><ul><li><b>Estados Unidos y Europa — DDP.</b> Nosotros hacemos la aduana y pagamos los aranceles, así el precio de tu factura es el precio final. Nada extra que pagar al recibir.</li><li><b>Resto de regiones — DAP.</b> Entregamos en tu dirección; aranceles e impuestos los pagas al llegar.</li></ul><p>Declaramos tus mercancías por su valor real — sin subdeclarar, lo que mantiene limpios tus registros aduaneros. Dile a Eddy tu destino y cotizamos DDP o DAP por adelantado.</p>' , fr: '<p>Cela dépend de votre lieu :</p><ul><li><b>États-Unis et Europe — DDP.</b> Nous dédouanons et payons les droits : le prix de votre facture est le prix final. Rien à régler à la livraison.</li><li><b>Toutes les autres régions — DAP.</b> Nous livrons à votre adresse ; droits et taxes sont à votre charge à l’arrivée.</li></ul><p>Nous déclarons votre marchandise à sa juste valeur — pas de sous-évaluation, ce qui garde vos dossiers douaniers propres. Indiquez votre destination à Eddy et nous devisons DDP ou DAP d’emblée.</p>' },
    faq8_q: { en: 'Do you offer custom branding / OEM?', es: '¿Ofrecen marca propia / OEM?' , fr: 'Proposez-vous une marque propre / OEM ?' },
    faq8_a: { en: '<p>For many products, yes — custom logo, packaging and inserts are possible at higher quantities. Message Eddy with your idea and target quantity to check feasibility.</p>',
                           es: '<p>En muchos productos sí — logotipo, empaque e insertos personalizados se pueden hacer a partir de cierta cantidad. Escríbele a Eddy tu idea y la cantidad que tienes en mente para ver si se puede.</p>' , fr: '<p>Pour de nombreux produits, oui — logo, emballage et inserts personnalisés sont possibles à partir d’une certaine quantité. Écrivez à Eddy avec votre idée et le volume visé pour vérifier la faisabilité.</p>' },
    faq9_q: { en: 'What if something arrives damaged or defective?', es: '¿Qué pasa si algo llega dañado o defectuoso?' , fr: 'Que se passe-t-il si un article arrive endommagé ou défectueux ?' },
    faq9_a: { en: '<p>Send photos on WhatsApp within 7 days of delivery. We’ll arrange a replacement or refund on the affected units — we keep buyers coming back by keeping this simple.</p>',
                           es: '<p>Manda fotos por WhatsApp dentro de los 7 días tras recibirlo. Hacemos el reemplazo o reembolso de las piezas afectadas — lo resolvemos rápido para que sigas comprando con confianza.</p>' , fr: '<p>Envoyez des photos sur WhatsApp dans les 7 jours suivant la livraison. Nous organisons le remplacement ou le remboursement des pièces concernées — nous simplifions les choses pour que vous reveniez.</p>' },
    cta_title: { en: 'Ready to start?', es: '¿Listo para empezar?' , fr: 'Prêt à commencer ?' },
    cta_sub: { en: 'Tell Eddy what you’re looking for — or send your inquiry list straight from the catalog.', es: 'Cuéntale a Eddy lo que buscas — o envía tu lista de cotización directo desde el catálogo.' , fr: 'Dites à Eddy ce que vous cherchez — ou envoyez votre liste de devis directement depuis le catalogue.' },
    cta_browse: { en: 'Browse the catalog', es: 'Explora el catálogo' , fr: 'Parcourir le catalogue' },

    /* ---- 需求收集 / 客服悬浮窗（js/lead-form.js） ---- */
    req_eyebrow: { en: 'Custom sourcing', es: 'Búsqueda personalizada' , fr: 'Approvisionnement sur mesure' },
    req_title: { en: 'Tell us more. We’ll go further.', es: 'Cuéntanos más. Llegamos más lejos.' , fr: 'Dites-nous en plus. Nous irons plus loin.' },
    req_sub: { en: 'The more you share — quantity, target price, packaging, deadline — the further we can go on sourcing, options and pricing. Eddy reads every request himself and usually replies the same day.',
                          es: 'Cuanto más nos cuentes — cantidad, precio objetivo, empaque, fecha — más lejos podemos llegar en búsqueda, opciones y precios. Eddy lee cada solicitud personalmente y suele responder el mismo día.' , fr: 'Plus vous partagez — quantité, prix cible, emballage, échéance — plus nous pouvons aller loin en approvisionnement, options et prix. Eddy lit chaque demande lui-même et répond généralement le jour même.' },
    ask_tab: { en: 'Chat with Eddy', es: 'Habla con Eddy' , fr: 'Discuter avec Eddy' },
    ask_tab_sub: { en: 'Free advice', es: 'Asesoría gratis' , fr: 'Conseil gratuit' },
    ask_tab_aria: { en: 'Tell us what you are looking for', es: 'Cuéntanos qué estás buscando' , fr: 'Dites-nous ce que vous cherchez' },
    ask_close: { en: 'Close', es: 'Cerrar' , fr: 'Fermer' },
    req_f_product: { en: 'What are you looking for?', es: '¿Qué estás buscando?' , fr: 'Que recherchez-vous ?' },
    req_ph_product: { en: 'e.g. 200 pcs Dior Sauvage EDT 100ml, or paste a product link',
                          es: 'ej. 200 uds de Dior Sauvage EDT 100ml, o pega un enlace del producto' , fr: 'ex. : 200 pièces Dior Sauvage EDT 100 ml, ou collez un lien produit' },
    req_f_contact: { en: 'Your WhatsApp or email', es: 'Tu WhatsApp o email' , fr: 'Votre WhatsApp ou e-mail' },
    req_ph_contact: { en: '+1 555 000 1234 or you@company.com', es: '+34 600 000 000 o tu@empresa.com' , fr: '+1 555 000 1234 ou vous@entreprise.com' },
    req_f_category: { en: 'Category', es: 'Categoría' , fr: 'Catégorie' },
    req_cat_any: { en: 'Not sure / other', es: 'No estoy seguro / otro' , fr: 'Pas sûr / autre' },
    req_f_country: { en: 'Your country', es: 'Tu país' , fr: 'Votre pays' },
    req_ph_country: { en: 'United States', es: 'España' , fr: 'France' },
    req_f_qty: { en: 'Quantity (pcs)', es: 'Cantidad (uds)' , fr: 'Quantité (pièces)' },
    req_ph_qty: { en: 'e.g. 100', es: 'ej. 100' , fr: 'ex. 100' },
    req_f_price: { en: 'Target price (per unit)', es: 'Precio objetivo (por unidad)' , fr: 'Prix cible (unitaire)' },
    req_ph_price: { en: 'e.g. $12', es: 'ej. 12 $' , fr: 'ex. 12 $' },
    req_f_msg: { en: 'Tell us more (optional)', es: 'Cuéntanos más (opcional)' , fr: 'Dites-nous en plus (facultatif)' },
    req_more_details: { en: 'More details (optional)', es: 'Más detalles (opcional)' , fr: 'Détails supplémentaires (facultatif)' },
    req_ph_msg: { en: 'Packaging, label, certification, deadline — the more detail, the better we can quote.',
                          es: 'Empaque, etiqueta, certificación, fecha — cuantos más detalles, mejor podemos cotizar.' , fr: 'Emballage, étiquette, certification, échéance — plus il y a de détails, meilleur est le devis.' },
    req_f_files: { en: 'Reference photos or files (optional)', es: 'Fotos o archivos de referencia (opcional)' , fr: 'Photos ou fichiers de référence (facultatif)' },
    req_files_cta: { en: 'Click to upload, or drag files here', es: 'Haz clic para subir o arrastra los archivos aquí' , fr: 'Cliquez pour importer, ou glissez vos fichiers ici' },
    req_files_hint: { en: 'Photos, PDF, Word or Excel · up to 5 files, 6MB each',
                          es: 'Fotos, PDF, Word o Excel · hasta 5 archivos, 6 MB cada uno' , fr: 'Photos, PDF, Word ou Excel · jusqu’à 5 fichiers, 6 Mo chacun' },
    req_file_remove: { en: 'Remove', es: 'Quitar' , fr: 'Retirer' },
    req_file_failed: { en: 'failed', es: 'error' , fr: 'échec' },
    req_files_uploading: { en: 'Uploading your files, please wait…', es: 'Subiendo tus archivos, espera…' , fr: 'Import de vos fichiers en cours, veuillez patienter…' },
    req_files_retry: { en: 'Some files could not be uploaded. Remove them and try again.',
                          es: 'Algunos archivos no se pudieron subir. Quítalos e inténtalo de nuevo.' , fr: 'Certains fichiers n’ont pas pu être importés. Retirez-les et réessayez.' },
    req_files_unavailable: { en: 'File upload is not available right now — you can still send your request, and share photos on WhatsApp afterwards.',
                          es: 'La subida de archivos no está disponible ahora — puedes enviar tu solicitud y compartir fotos por WhatsApp después.' , fr: 'L’import de fichiers est momentanément indisponible — vous pouvez tout de même envoyer votre demande et partager vos photos sur WhatsApp ensuite.' },
    req_err_file_size: { en: 'Each file must be under 6MB.', es: 'Cada archivo debe pesar menos de 6 MB.' , fr: 'Chaque fichier doit faire moins de 6 Mo.' },
    req_ok_files: { en: 'Your {n} attachment(s) came through too.', es: 'También recibimos tus {n} archivo(s).' , fr: 'Vos {n} pièce(s) jointe(s) sont également bien arrivées.' },
    req_submit: { en: 'Send request', es: 'Enviar solicitud' , fr: 'Envoyer la demande' },
    req_note: { en: 'Eddy reads every request himself. No spam, ever.', es: 'Eddy lee cada solicitud personalmente. Nunca enviamos spam.' , fr: 'Eddy lit chaque demande lui-même. Jamais de spam.' },
    req_sending: { en: 'Sending…', es: 'Enviando…' , fr: 'Envoi en cours…' },
    req_ok_title: { en: 'Thank you — we’re on it.', es: 'Gracias — nos ponemos en ello.' , fr: 'Merci — nous nous en occupons.' },
    req_ok_body: { en: 'Your request is in. Every detail you shared helps us grow: it tells us what buyers actually want, and that shapes what we source, how we pack it and how we price it.',
                          es: 'Tu solicitud está registrada. Cada detalle que compartiste nos ayuda a crecer: nos dice qué buscan realmente los compradores, y eso define qué buscamos, cómo lo empacamos y cómo lo cotizamos.' , fr: 'Votre demande est enregistrée. Chaque détail partagé nous aide à progresser : il nous dit ce que les acheteurs veulent vraiment, et cela guide nos choix d’approvisionnement, notre emballage et nos prix.' },
    req_ok_sign: { en: '— Eddy, EddyTrading', es: '— Eddy, EddyTrading' , fr: '— Eddy, EddyTrading' },
    req_ok_why: { en: 'Quote, then a photo of your parcel and its tracking number.',
                          es: 'Cotización, luego una foto de tu paquete y su número de seguimiento.' , fr: 'Un devis, puis une photo de votre colis et son numéro de suivi.' },
    req_ok_watch: { en: 'See what happens next · 7s', es: 'Mira qué pasa después · 7 s' , fr: 'Voyez la suite · 7 s' },
    req_ok_wa: { en: 'Chat on WhatsApp now', es: 'Hablar por WhatsApp ahora' , fr: 'Discuter sur WhatsApp maintenant' },
    req_ok_again: { en: 'Send another request', es: 'Enviar otra solicitud' , fr: 'Envoyer une autre demande' },
    req_ok_again_hint: { en: 'Sourcing more than one item? Send them separately — we quote each one properly.',
                          es: '¿Buscas más de un artículo? Envíalos por separado — cotizamos cada uno como corresponde.' , fr: 'Vous cherchez plusieurs articles ? Envoyez-les séparément — nous devisons chaque article correctement.' },
    req_err_product: { en: 'Please tell us what you are looking for.', es: 'Cuéntanos qué estás buscando.' , fr: 'Dites-nous ce que vous cherchez.' },
    req_err_contact: { en: 'Please add a valid WhatsApp number or email.', es: 'Añade un WhatsApp o email válido.' , fr: 'Ajoutez un numéro WhatsApp ou une adresse e-mail valide.' },
    req_err_rate: { en: 'Too many requests from your network. Please try again later, or message us on WhatsApp.',
                          es: 'Demasiadas solicitudes desde tu red. Inténtalo más tarde o escríbenos por WhatsApp.' , fr: 'Trop de demandes depuis votre réseau. Réessayez plus tard ou écrivez-nous sur WhatsApp.' },
    req_err_validate: { en: 'Please check the fields and try again.', es: 'Revisa los campos e inténtalo de nuevo.' , fr: 'Vérifiez les champs et réessayez.' },
    req_err_generic: { en: 'Something went wrong. Please try again, or message us on WhatsApp.',
                          es: 'Algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.' , fr: 'Une erreur est survenue. Réessayez ou écrivez-nous sur WhatsApp.' },
    req_fb_title: { en: 'The online form is unavailable right now.', es: 'El formulario no está disponible ahora mismo.' , fr: 'Le formulaire en ligne est momentanément indisponible.' },
    req_fb_body: { en: 'Send the same details straight to Eddy on WhatsApp — one tap, and the message is already written.',
                          es: 'Envía los mismos datos directamente a Eddy por WhatsApp — un toque y el mensaje ya está escrito.' , fr: 'Envoyez les mêmes informations directement à Eddy sur WhatsApp — un seul appui, le message est déjà prêt.' },
    req_fb_btn: { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp' , fr: 'Envoyer sur WhatsApp' },
    req_wa_intro: { en: 'Hi Eddy! I am looking for:', es: '¡Hola Eddy! Estoy buscando:' , fr: 'Bonjour Eddy ! Je cherche :' },
    footer_request: { en: 'Send a product request', es: 'Enviar una solicitud' , fr: 'Envoyer une demande produit' },
  };

  /* ---------------- 语言状态 ---------------- */
  function detectLang() {
    try {
      var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      if (nav.indexOf('fr') === 0) return 'fr';
      if (nav.indexOf('es') === 0) return 'es';
      return 'en';
    } catch (e) { return 'en'; }
  }
  function getLang() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved === 'en' || saved === 'es' || saved === 'fr') return saved;
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
        // 复数（英文 item / 西语 artículo / 法语 article）
        if (k === 'n' && (key === 'drawer_count' || key === 'shared_review')) {
          var forms = { en: ['item', 'items'], es: ['artículo', 'artículos'], fr: ['article', 'articles'] };
          var f = forms[lang] || forms.en;
          s = s.replace('{n}', v).replace(f[0], v === 1 ? f[0] : f[1]);
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
      '<button type="button" class="lang-opt' + (lang === 'es' ? ' is-on' : '') + '" data-lang="es" aria-pressed="' + (lang === 'es') + '">ES</button>' +
      '<button type="button" class="lang-opt' + (lang === 'fr' ? ' is-on' : '') + '" data-lang="fr" aria-pressed="' + (lang === 'fr') + '">FR</button>';
    Array.prototype.slice.call(host.querySelectorAll('[data-lang]')).forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
  }

  function applyLang() {
    applyStatic();
    renderToggle();
    if (typeof window.__translateDynamic === 'function') window.__translateDynamic();
    /* 带变量的动态文案（如阶梯价收起时的摘要）不在 data-i18n 覆盖范围内，
       由 app.js 监听这个事件自己重算 */
    try { window.dispatchEvent(new CustomEvent('i18n:change')); } catch (e) {}
  }

  /* ---------------- 暴露接口 ---------------- */
  window.I18N = I18N;
  window.T = T;
  window.getLang = getLang;
  window.setLang = setLang;
  window.applyLang = applyLang;
  /* 给 app.js 用：动态区块重渲染（产品页/分类页整块重画）后，
     硬编码的英文默认值会盖掉翻译，需要在重画之后再跑一遍静态回填 */
  window.__applyStatic = applyStatic;
})();
