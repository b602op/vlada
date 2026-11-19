// src/generator/jsonld.js
// Генерация JSON-LD разметки Schema.org

import { escapeHtml, formatPrice } from './utils.js';

/**
 * Генерация JSON-LD для Apartment
 */
export function generateApartmentJsonLd(property, complex, agent, ogImage) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    "name": property.title,
    "description": property.description || '',
    "url": '',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": "Краснодар",
      "addressRegion": "Краснодарский край",
      "postalCode": "350061",
      "addressCountry": "RU"
    },
  };

  if (property.rooms) {
    schema.numberOfRooms = property.rooms;
  }
  if (property.area) {
    schema.floorSize = {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "MTK"
    };
  }
  if (property.floor) {
    schema.floorNumber = String(property.floor);
  }
  if (property.price && property.currency) {
    const currencySymbols = { RUB: 'RUB', USD: 'USD', EUR: 'EUR' };
    schema.offers = {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": property.currency,
      "availability": "https://schema.org/InStock",
      "url": ''
    };
  }

  // SEO
  const seos = [
    { "@type": "ImageObject", "contentUrl": ogImage }
  ].filter(Boolean);
  if (seos.length > 0) schema.image = seos;

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n<\/script>`;
}

/**
 * Генерация JSON-LD для House
 */
export function generateHouseJsonLd(property, complex, agent, ogImage) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "House",
    "name": property.title,
    "description": property.description || '',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": "Краснодар",
      "addressRegion": "Краснодарский край",
      "addressCountry": "RU"
    }
  };

  if (property.rooms) schema.numberOfRooms = property.rooms;
  if (property.area) {
    schema.floorSize = {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "MTK"
    };
  }
  if (property.price && property.currency) {
    schema.offers = {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": property.currency,
      "availability": "https://schema.org/InStock"
    };
  }

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n<\/script>`;
}

/**
 * Генерация JSON-LD для Commercial
 */
export function generateCommercialJsonLd(property, complex, agent, ogImage) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CommercialProperty",
    "name": property.title,
    "description": property.description || '',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": "Краснодар",
      "addressRegion": "Краснодарский край",
      "addressCountry": "RU"
    }
  };

  if (property.area) {
    schema.floorSize = {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "MTK"
    };
  }
  if (property.price && property.currency) {
    schema.offers = {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": property.currency,
      "availability": "https://schema.org/InStock"
    };
  }

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n<\/script>`;
}

/**
 * Генерация JSON-LD для Land
 */
export function generateLandJsonLd(property, complex, agent, ogImage) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Landform",
    "name": property.title,
    "description": property.description || '',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": "Краснодар",
      "addressRegion": "Краснодарский край",
      "addressCountry": "RU"
    }
  };

  if (property.area) {
    schema.area = {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "MTK"
    };
  }

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n<\/script>`;
}

/**
 * Универсальный генератор JSON-LD на основе типа
 */
export function generateAllJsonLd(config) {
  const { property, complex, agent } = config;
  const ogImage = config.landing?.seo?.ogImage || '';
  const type = property.type;

  let jsonld = '';

  switch (type) {
    case 'apartment':
      jsonld = generateApartmentJsonLd(property, complex, agent, ogImage);
      break;
    case 'house':
      jsonld = generateHouseJsonLd(property, complex, agent, ogImage);
      break;
    case 'commercial':
      jsonld = generateCommercialJsonLd(property, complex, agent, ogImage);
      break;
    case 'land':
      jsonld = generateLandJsonLd(property, complex, agent, ogImage);
      break;
    default:
      jsonld = generateApartmentJsonLd(property, complex, agent, ogImage);
  }

  // Добавляем LocalBusiness риэлтора
  if (agent && agent.name) {
    const agentSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": agent.name,
      "telephone": agent.phone,
    };
    if (agent.description) {
      agentSchema.description = agent.description;
    }
    jsonld += `\n\n<script type="application/ld+json">\n${JSON.stringify(agentSchema, null, 2)}\n<\/script>`;
  }

  // Добавляем RealEstateAgent
  jsonld += `\n\n<script type="application/ld+json">\n${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": agent?.name || '',
    "telephone": agent?.phone || '',
    "areaServed": {
      "@type": "City",
      "name": "Краснодар"
    }
  }, null, 2)}\n<\/script>`;

  return jsonld;
}
