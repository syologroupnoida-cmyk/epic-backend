# Service Listing Metadata Guide

This guide defines the frontend fields for every service-listing subcategory.

## Important rules

- The common service-listing API body is the same for every `SERVICE` subcategory.
- Put package-level information in `metadata`.
- Put information for one selected subcategory in `services[].metadata`.
- A listing can include one or many `SERVICE` subcategories, including subcategories from different service categories.
- `Venue Services` is **not** a service listing. It uses the separate `VENUE_PROPERTY` form and venue-property API.
- `metadata` is currently flexible JSON. Use the exact stable camelCase keys in this guide; do not invent random frontend keys.

## Common service-listing body

```json
{
  "title": "Complete Wedding Planning and Bridal Makeup Package",
  "description": "Wedding planning, coordination and bridal makeup package.",
  "startingPrice": 220000,
  "priceType": "STARTING_FROM",
  "cityId": "{{primaryCityId}}",
  "serviceAreaCityIds": [
    "{{primaryCityId}}",
    "{{secondServiceAreaCityId}}"
  ],
  "metadata": {
    "packageDays": 2,
    "guestCapacity": 500,
    "teamSize": 8,
    "inclusions": ["Planning", "Coordination", "Bridal makeup"],
    "exclusions": [],
    "travelIncluded": false,
    "customizationAvailable": true
  },
  "services": [
    {
      "serviceSubcategoryId": "{{weddingPlanningSubcategoryId}}",
      "price": 150000,
      "metadata": {
        "eventDays": 2,
        "planningTimelineMonths": 6,
        "guestCountSupported": 500
      }
    }
  ],
  "media": [],
  "submitForReview": false
}
```

### Common body field meanings

| Field | Meaning |
| --- | --- |
| `title` | Public package/listing name. |
| `description` | Full explanation of services, inclusions and experience. |
| `startingPrice` | Lowest package price in rupees. |
| `priceType` | `FIXED`, `STARTING_FROM`, `PER_PERSON`, `PER_PLATE`, `PER_DAY` or `CUSTOM`. |
| `cityId` | Primary city of the service listing. |
| `serviceAreaCityIds` | Every active city where this vendor provides this service. It must include `cityId`. |
| `metadata` | Package-level details shared by the complete listing. |
| `services` | One or more selected, approved `SERVICE` subcategories. |
| `services[].price` | Optional price of one included service. |
| `services[].metadata` | Details specific to that selected service. |
| `media` | Uploaded listing images/videos. |
| `submitForReview` | `false` saves a draft; `true` directly sends it to admin review. |

## Package-level metadata fields

Use only fields that apply to the package.

| Key | Type | Meaning |
| --- | --- | --- |
| `packageDays` | number | Number of event/service days in the package. |
| `eventFunctions` | string array | Functions included, for example Haldi, Mehendi, Wedding, Reception. |
| `guestCapacity` | number | Maximum guests covered by the package. |
| `teamSize` | number | Total vendor team members supplied. |
| `durationHours` | number | Package duration in hours, when relevant. |
| `inclusions` | string array | What customer receives. |
| `exclusions` | string array | What is not included. |
| `travelIncluded` | boolean | Whether travel is covered in listed price. |
| `advanceBookingDays` | number | Minimum booking notice required. |
| `customizationAvailable` | boolean | Whether vendor can customize the package. |

## 1. Wedding Planning Services

### Planning package fields

Use the same fields for:

```text
Wedding Planning
Destination Wedding Planning
Luxury Wedding Planning
Intimate Wedding Planning
Theme Wedding Planning
Traditional Wedding Planning
Court Marriage Planning
Temple Wedding Planning
Beach Wedding Planning
Palace Wedding Planning
Resort Wedding Planning
Celebrity Wedding Planning
```

```json
{
  "eventDays": 2,
  "planningTimelineMonths": 6,
  "guestCountSupported": 500,
  "functionsIncluded": ["Wedding", "Reception"],
  "venueShortlistingIncluded": true,
  "vendorCoordinationIncluded": true,
  "budgetPlanningIncluded": true,
  "theme": "Royal",
  "destination": "Udaipur",
  "travelManagementIncluded": false
}
```

| Key | Meaning |
| --- | --- |
| `eventDays` | Number of event days managed. |
| `planningTimelineMonths` | Months of planning support before wedding. |
| `guestCountSupported` | Maximum guests planning team can handle. |
| `functionsIncluded` | Functions managed by this planning service. |
| `venueShortlistingIncluded` | Vendor helps select a venue. |
| `vendorCoordinationIncluded` | Vendor manages other service providers. |
| `budgetPlanningIncluded` | Budget planning is included. |
| `theme` | Theme/style, when relevant. |
| `destination` | Destination location, for destination packages. |
| `travelManagementIncluded` | Travel support for guests/vendors is included. |

### Coordination and management fields

Use the same fields for:

```text
Wedding Coordination
Wedding Day Management
```

```json
{
  "eventDays": 1,
  "durationHours": 12,
  "coordinatorCount": 4,
  "onGroundTeamCount": 10,
  "vendorCoordinationIncluded": true,
  "timelineManagementIncluded": true,
  "emergencySupportIncluded": true
}
```

### Guest and RSVP fields

Use the same fields for:

```text
Guest Management
RSVP Management
```

```json
{
  "guestCountSupported": 500,
  "rsvpMode": "WhatsApp and call",
  "languageSupport": ["Hindi", "English"],
  "guestWelcomeIncluded": true,
  "checkInSupportIncluded": true,
  "transportCoordinationIncluded": true,
  "accommodationCoordinationIncluded": true
}
```

## 2. Venue Services — use venue-property listing only

These subcategories must use `POST /api/v1/vendor/venue-properties`, not the service-listing API:

```text
Banquet Hall, Wedding Hotel, Luxury Hotel, Resort, Farmhouse, Palace,
Fort Wedding Venue, Beach Venue, Lawn, Garden, Club, Convention Centre,
Rooftop Venue, Heritage Venue, Destination Wedding Venue
```

Venue-property `metadata` fields:

```json
{
  "alcoholAllowed": false,
  "outsideCateringAllowed": false,
  "outsideDecorationAllowed": true,
  "musicAllowedUntil": "22:00",
  "powerBackupAvailable": true,
  "airConditioned": true,
  "bridalRoomAvailable": true
}
```

The standard venue form fields are `address`, `capacityMin`, `capacityMax`, `rooms`, `parkingCapacity`, `amenities` and `venueTypes`.

## 3. Decoration Services

Use the same base fields for:

```text
Wedding Decoration, Floral Decoration, Mandap Decoration, Stage Decoration,
Reception Decoration, Haldi Decoration, Mehendi Decoration, Sangeet Decoration,
Balloon Decoration, LED Decoration, Theme Decoration, Entry Decoration,
Ceiling Decoration, Luxury Decoration, Traditional Decoration
```

```json
{
  "eventFunction": "Wedding",
  "decorationStyle": "Floral",
  "theme": "Royal",
  "venueAreaCovered": "Stage and entry",
  "flowerTypes": ["Rose", "Orchid"],
  "materialIncluded": ["Flowers", "Fabric", "Lights"],
  "setupHours": 8,
  "dismantlingIncluded": true,
  "customizationAvailable": true,
  "lightingIncluded": true
}
```

Extra fields for `Mandap Decoration`:

```json
{ "mandapType": "Four pillar", "mandapSize": "16x16 feet", "seatingCapacity": 20 }
```

Extra fields for `LED Decoration`:

```json
{ "ledWallSize": "12x8 feet", "screenCount": 2, "contentSupportIncluded": true }
```

## 4. Photography Services

Use the same base fields for:

```text
Wedding Photography, Candid Photography, Traditional Photography,
Cinematic Photography, Pre Wedding Shoot, Post Wedding Shoot,
Drone Photography, Wedding Film, Teaser Video, Couple Shoot,
Family Photography, Live Streaming
```

```json
{
  "eventDays": 2,
  "durationHoursPerDay": 10,
  "photographerCount": 2,
  "videographerCount": 2,
  "droneIncluded": false,
  "albumIncluded": true,
  "albumPages": 40,
  "editedPhotosCount": 300,
  "rawFilesIncluded": false,
  "deliveryDays": 30,
  "reelsIncluded": 3
}
```

Extra fields for `Live Streaming`:

```json
{ "streamingPlatform": ["YouTube", "Zoom"], "cameraCount": 3, "internetRequired": true, "recordingIncluded": true }
```

Extra fields for `Pre Wedding Shoot` and `Couple Shoot`:

```json
{ "shootDurationHours": 8, "locationsIncluded": 2, "outfitChangesAllowed": 3, "travelIncluded": false }
```

## 5. Makeup & Beauty

Use the same fields for:

```text
Bridal Makeup, Groom Makeup, Airbrush Makeup, HD Makeup, Engagement Makeup,
Reception Makeup, Party Makeup, Hair Styling, Saree Draping, Nail Art, Groom Styling
```

```json
{
  "makeupType": "HD",
  "makeupLooks": 2,
  "artistCount": 1,
  "assistantCount": 1,
  "hairStylingIncluded": true,
  "drapingIncluded": false,
  "nailArtIncluded": false,
  "trialIncluded": true,
  "productsUsed": ["MAC", "Huda Beauty"],
  "travelIncluded": false,
  "touchUpSupportHours": 2
}
```

## 6. Mehendi Services

Use the same fields for:

```text
Bridal Mehendi, Family Mehendi, Arabic Mehendi, Rajasthani Mehendi,
Indo Arabic Mehendi, Contemporary Mehendi, Glitter Mehendi
```

```json
{
  "mehendiStyle": "Rajasthani",
  "brideHandsIncluded": true,
  "brideFeetIncluded": true,
  "artistCount": 2,
  "guestCountSupported": 30,
  "estimatedDurationHours": 5,
  "glitterIncluded": false,
  "customDesignAvailable": true,
  "travelIncluded": false
}
```

## 7. Catering Services

Use the same base fields for:

```text
North Indian Catering, South Indian Catering, Mughlai Catering, Chinese Catering,
Continental Catering, Italian Catering, Jain Food, Vegan Catering, Live Counters,
BBQ, Dessert Counter, Mocktail Counter, Sweet Counter
```

```json
{
  "cuisine": "North Indian",
  "minimumPlates": 100,
  "maximumPlates": 1000,
  "menuItemsCount": 20,
  "vegAvailable": true,
  "nonVegAvailable": false,
  "jainFoodAvailable": true,
  "veganFoodAvailable": true,
  "serviceStyle": "Buffet",
  "waiterCount": 10,
  "cutleryIncluded": true,
  "liveCounterIncluded": false
}
```

Extra fields for `Live Counters`, `BBQ`, `Dessert Counter`, `Mocktail Counter`, `Sweet Counter`:

```json
{ "counterType": "Mocktail", "counterCount": 1, "servingHours": 4 }
```

## 8. Entertainment

Use the same base fields for:

```text
DJ, Live Band, Singer, Celebrity Artist, Choreographer, Dance Group, Anchor,
MC, Puppet Show, Magic Show, Fireworks, Live Orchestra
```

```json
{
  "performanceDurationMinutes": 120,
  "artistCount": 4,
  "setCount": 2,
  "soundSystemIncluded": true,
  "lightingIncluded": false,
  "travelIncluded": false,
  "accommodationRequired": false,
  "customPlaylistAvailable": true
}
```

Extra fields for `DJ`:

```json
{ "djDurationHours": 5, "soundSystemWattage": 5000, "danceFloorSupport": true }
```

Extra fields for `Fireworks`:

```json
{ "fireworkDurationMinutes": 10, "licenseIncluded": true, "safetyTeamIncluded": true }
```

## 9. Wedding Invitation

Use the same fields for:

```text
Printed Invitation, Luxury Invitation, Digital Invitation, Video Invitation,
Acrylic Invitation, Wooden Invitation, Eco Friendly Invitation
```

```json
{
  "invitationType": "Printed",
  "minimumQuantity": 100,
  "paperMaterial": "Ivory",
  "printingType": "Foil print",
  "envelopeIncluded": true,
  "designCustomizationAvailable": true,
  "designRevisionsIncluded": 3,
  "deliveryDays": 10,
  "digitalFormat": "PDF"
}
```

## 10. Bridal Wear

Use the same fields for:

```text
Bridal Lehenga, Bridal Saree, Designer Wear, Indo Western,
Reception Gown, Engagement Dress
```

```json
{
  "wearType": "Bridal Lehenga",
  "fabric": "Silk",
  "workType": "Zardozi",
  "sizeAvailable": ["S", "M", "L", "Custom"],
  "customStitchingAvailable": true,
  "rentalAvailable": false,
  "trialAvailable": true,
  "deliveryDays": 20
}
```

## 11. Groom Wear

Use the same fields for:

```text
Sherwani, Suit, Tuxedo, Kurta, Indo Western, Accessories
```

```json
{
  "wearType": "Sherwani",
  "fabric": "Silk",
  "sizeAvailable": ["S", "M", "L", "Custom"],
  "customStitchingAvailable": true,
  "rentalAvailable": true,
  "accessoriesIncluded": ["Safaa", "Mojari"],
  "deliveryDays": 15
}
```

## 12. Jewellery

Use the same fields for:

```text
Bridal Jewellery, Artificial Jewellery, Gold Jewellery, Diamond Jewellery,
Rental Jewellery, Groom Accessories
```

```json
{
  "jewelleryType": "Bridal Jewellery",
  "material": "Artificial",
  "piecesIncluded": ["Necklace", "Earrings", "Maang Tikka"],
  "rentalAvailable": true,
  "securityDepositRequired": true,
  "customizationAvailable": false,
  "trialAvailable": true
}
```

## 13. Wedding Cakes

Use the same fields for:

```text
Designer Cakes, Multi Tier Cakes, Theme Cakes, Customized Cakes
```

```json
{
  "cakeType": "Designer",
  "weightKg": 5,
  "tierCount": 3,
  "flavourOptions": ["Chocolate", "Butterscotch"],
  "egglessAvailable": true,
  "customDesignAvailable": true,
  "deliveryIncluded": true,
  "deliveryRadiusKm": 20
}
```

## 14. Gifts

Use the same fields for:

```text
Wedding Return Gifts, Corporate Gifts, Customized Gifts, Hampers, Guest Welcome Kits
```

```json
{
  "giftType": "Wedding Return Gift",
  "minimumQuantity": 50,
  "packagingIncluded": true,
  "customBrandingAvailable": true,
  "nameTagIncluded": true,
  "deliveryDays": 10,
  "sampleAvailable": true
}
```

## 15. Transportation

Use the same base fields for:

```text
Luxury Cars, Vintage Cars, Limousine, Horse, Buggy, Wedding Bike, Helicopter Entry
```

```json
{
  "vehicleType": "Luxury Car",
  "vehicleCount": 1,
  "rentalDurationHours": 8,
  "decoratedVehicleIncluded": true,
  "chauffeurIncluded": true,
  "fuelIncluded": true,
  "distanceLimitKm": 100,
  "extraKmPrice": 50
}
```

Extra fields for `Horse`, `Buggy`, `Helicopter Entry`:

```json
{ "entryDurationMinutes": 30, "handlerIncluded": true, "permissionsIncluded": false, "safetySupportIncluded": true }
```

## 16. Hospitality

Use the same fields for:

```text
Guest Welcome, Airport Pickup, Hotel Booking, Guest Coordination, Travel Desk
```

```json
{
  "guestCountSupported": 300,
  "teamCount": 5,
  "serviceDurationDays": 2,
  "airportPickupIncluded": true,
  "hotelBookingIncluded": true,
  "helpDeskIncluded": true,
  "languageSupport": ["Hindi", "English"]
}
```

## 17. Honeymoon Services

Use the same fields for:

```text
Domestic Honeymoon, International Honeymoon, Visa Assistance,
Travel Insurance, Luxury Holidays
```

```json
{
  "destination": "Maldives",
  "nights": 5,
  "travellerCount": 2,
  "hotelCategory": "5 Star",
  "flightsIncluded": true,
  "visaIncluded": true,
  "insuranceIncluded": true,
  "airportTransferIncluded": true,
  "mealPlan": "Breakfast"
}
```

## 18. Wedding Rentals

Use the same fields for:

```text
Furniture, Sofa, Stage, Lighting, LED Wall, Generator, Dance Floor, Sound System
```

```json
{
  "rentalItemType": "Furniture",
  "quantity": 100,
  "rentalDurationDays": 2,
  "setupIncluded": true,
  "dismantlingIncluded": true,
  "transportIncluded": true,
  "operatorIncluded": false,
  "powerRequirement": "10 KW"
}
```

## 19. Wedding Ritual Services

Use the same fields for:

```text
Pandit, Priest, Qazi, Granthi, Church Priest, Astrology, Muhurat Consultation
```

```json
{
  "ritualType": "Hindu Wedding",
  "language": ["Hindi", "Sanskrit"],
  "ceremonyDurationHours": 4,
  "ritualItemsIncluded": false,
  "travelIncluded": false,
  "muhuratConsultationIncluded": true,
  "customRitualAvailable": true
}
```

## 20. Wedding Favors & Accessories

Use the same fields for:

```text
Wedding Hampers, Welcome Boards, Signages, Customized Name Plates,
Guest Books, Photo Booth, Wedding Props
```

```json
{
  "itemType": "Photo Booth",
  "quantity": 1,
  "customizationAvailable": true,
  "printingIncluded": true,
  "setupIncluded": true,
  "rentalDurationHours": 8,
  "deliveryIncluded": true,
  "designRevisionsIncluded": 2
}
```

## Future backend improvement

This guide is the source for frontend form fields today. The next improvement can store these field definitions in the database per subcategory. Then frontend can call an API and render the correct fields automatically instead of maintaining this mapping in frontend code.
