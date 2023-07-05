if(typeof Spurit === 'undefined') var Spurit = {};
if(typeof Spurit['Discountmanager'] === 'undefined') Spurit['Discountmanager'] = {};
Spurit['Discountmanager'].settings = {
    enabled: true,
    badge: {"type":"svg","svg":"<svg width=\"60px\" height=\"60px\" version=\"1.1\" xmlns=\"http:\/\/www.w3.org\/2000\/svg\" xmlns:xlink=\"http:\/\/www.w3.org\/1999\/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 47 47\" style=\"enable-background:new 0 0 47 47;\" xml:space=\"preserve\">\n    <path data-color2=\"\" d=\"M45.4,25.8L21.2,1.6c-1.1-1.1-2.5-1.6-4-1.6L4.4,0.3C2.2,0.4,0.3,2.2,0.3,4.5L0,17.2c0,1.5,0.6,3,1.6,4 l24.2,24.2c2.2,2.2,5.6,2.2,7.8,0l11.8-11.8C47.6,31.5,47.6,28,45.4,25.8z M8.6,14.8c-1.7-1.7-1.7-4.4,0-6.1s4.4-1.7,6.1,0 s1.7,4.4,0,6.1C13.1,16.5,10.3,16.5,8.6,14.8z\"\/>\n    <path data-color1=\"\" d=\"M32.8,33.8l-1.6-1.6l-1.1,1.1l1.9,1.9L31.2,36l-2.9-3l4.6-4.5l2.9,3L35,32.3l-2-1.8l-1,1l1.6,1.6L32.8,33.8z\"\/>\n    <path data-color1=\"\" d=\"M26.3,29.4l1.9,2l-0.8,0.8l-2.9-3l4.6-4.5l1,1.1L26.3,29.4z\"\/>\n    <path data-color1=\"\" d=\"M23.3,26.2L22,24.8l-1.1,0.6l-1.1-1.1l6-3l0.6,0.6l0,0l0,0l0.6,0.6l-3.1,6l-1.1-1.1L23.3,26.2z M23.1,24.3 l0.8,0.9l1-1.8l0,0L23.1,24.3z\"\/>\n    <path data-color1=\"\" d=\"M19.4,21.5c0.2-0.2,0.2-0.3,0.2-0.5s-0.1-0.5-0.3-0.9c-0.4-0.7-0.6-1.4-0.6-1.8c-0.1-0.5,0.1-0.9,0.5-1.3 s0.9-0.5,1.4-0.4s1.1,0.4,1.5,0.9c0.5,0.5,0.8,1.1,0.9,1.6c0.1,0.6-0.1,1-0.6,1.5l0,0l-1-1c0.2-0.2,0.3-0.4,0.3-0.6 s-0.1-0.4-0.4-0.7c-0.2-0.2-0.4-0.3-0.6-0.3s-0.4,0-0.5,0.2c-0.1,0.1-0.2,0.3-0.2,0.5s0.1,0.5,0.3,0.9c0.4,0.7,0.6,1.3,0.6,1.8 s-0.1,0.9-0.5,1.3C20,23,19.6,23.1,19,23c-0.5-0.1-1.1-0.4-1.6-0.9s-0.8-1.1-0.9-1.7s0.1-1.1,0.6-1.6l0,0l1,1 c-0.3,0.3-0.4,0.5-0.4,0.7s0.2,0.5,0.4,0.8c0.2,0.2,0.4,0.3,0.6,0.4C19.1,21.7,19.3,21.7,19.4,21.5z\"\/>\n<\/svg>","color1":"#ffffff","color2":"#f26e22","right":0,"top":-12.85},
    enabledCollection: true,
    collectionPageSelector: "div[class=\"l-product-list__list\"] > div > div[class=\"l-product-list__item-thumb\"] > div[class=\"c-item-thumb--product\"] > div[class=\"c-item-thumb__featured-image\"] > a[class=\"c-item-thumb__image-link\"] > div[class=\"c-featured-image--collection\"] > div[class=\"c-featured-image__wrapper \"] > img[class=\"c-featured-image__img lazyautosizes lazyloaded\"]",
    productPageSelector: "h1[class=\"c-header__heading--product\"] > span[class=\"c-header__title\"]",
    productIds: [1339814412371,2343350796371],
    variantIds: [12445741514835,12445864230995,12445864263763,12445864296531,12445864329299,21160956100691,21160956133459,21160956166227,21160956198995,21160956231763]
};
Spurit['Discountmanager'].labelConfig = {
    checkout_label: {
        style: {"color":"#C74230"},
        enabled: false,
        selector: [],
        ajax_cart_enabled: false,
        ajax_cart_selector: [],
    },
    discount_value: {
        enabled: false,
        selector: []    }
};