import { Product } from "./models/Product.ts";
import { Coupon } from "./models/Coupon.ts";
import { User } from "./models/User.ts";
import { hashPassword } from "./utils/passwordHelper.ts";

const vegSizes = [
  { weight: "250 g", price: 200 },
  { weight: "500 g", price: 380 },
  { weight: "1 kg", price: 680 },
];

const powderSizes = [
  { weight: "250 g", price: 170 },
  { weight: "500 g", price: 290 },
];

const seedProductsData = [
  {
    slug: "avakaya",
    name: "Avakaya",
    tagline: "The queen of Andhra pickles",
    description: "Authentic Andhra mango pickle, sun-soaked in cold-pressed sesame oil with mustard, fenugreek and Guntur chilies.",
    image: "/product-avakaya.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: true,
    isHotOffer: true,
  },
  {
    slug: "maagaya",
    name: "Maagaya (Dry Mango)",
    tagline: "Sun-cured raw mango pickle",
    description: "Dry-style mango pickle made with sun-cured raw mango, salt and chili — long-keeping and intensely tangy.",
    image: "/product-maagaya.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "pottu-pachadi",
    name: "Pottu Pachadi (Mango Thokku)",
    tagline: "Rich, spicy and tangy",
    description: "A robust Andhra thokku built on grated raw mango, fiery red chili and pure sesame oil.",
    image: "/product-pachadi.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "tomato",
    name: "Tomato Pickle",
    tagline: "Tangy, spicy & full of flavour",
    description: "Vine-ripened tomatoes slow-cooked with tamarind, jaggery and a smoky tempering.",
    image: "/product-tomato.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: true,
  },
  {
    slug: "ginger",
    name: "Allam (Ginger Pickle)",
    tagline: "Strong, warm, deeply aromatic",
    description: "Fresh ginger pickled with tamarind and chili — a punchy companion for dosas and curd rice.",
    image: "/product-ginger.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "gongura",
    name: "Gongura Pickle",
    tagline: "A traditional Andhra favourite",
    description: "Tart sorrel leaves slow-cooked with garlic and chili — the soul of every Telugu home.",
    image: "/product-gongura.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: true,
    isHotOffer: true,
  },
  {
    slug: "green-chilli",
    name: "Pachimirchi (Green Chilli)",
    tagline: "Bright, fresh, fiery",
    description: "Tender green chilies pickled with mustard and lemon — crisp and bright on the tongue.",
    image: "/product-green-chilli.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "pandu-mirchi",
    name: "Pandu Mirchi (Red Chilli)",
    tagline: "Whole red chili pickle",
    description: "Ripe red chilies preserved whole in spiced sesame oil — bold heat with deep flavour.",
    image: "/product-pandu-mirchi.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "lemon",
    name: "Nimmakaya (Lemon)",
    tagline: "Hand-picked lemons, slow-matured",
    description: "Bright, citrusy lemon pickle made the way our grandmothers did — aged for depth.",
    image: "/product-lemon.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: true,
  },
  {
    slug: "dhabbakaya",
    name: "Dhabbakaya",
    tagline: "An Andhra heirloom",
    description: "Wood-apple pickle with a deep, smoky sweetness balanced by salt and chili.",
    image: "/product-dhabbakaya.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "amla",
    name: "Oosirikaya (Amla)",
    tagline: "Nutrient-rich gooseberry",
    description: "Indian gooseberry pickled with mustard and fenugreek — sour, salty and full of vitamin C.",
    image: "/product-amla.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "mix-vegetable",
    name: "Mix Vegetable Pickle",
    tagline: "A medley of garden vegetables",
    description: "Carrot, lemon, ginger, chili and more — pickled together for a colourful, flavour-packed jar.",
    image: "/product-mix-veg.jpg",
    category: "Veg" as const,
    sizes: vegSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "chicken-bone",
    name: "Chicken Pickle (Bone)",
    tagline: "Country chicken, slow-cooked",
    description: "Bone-in country chicken preserved in sesame oil with whole spices — a meal in itself.",
    image: "/product-chicken.jpg",
    category: "Non-Veg" as const,
    sizes: [
      { weight: "250 g", price: 350 },
      { weight: "500 g", price: 550 },
      { weight: "1 kg", price: 895 },
    ],
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "chicken-boneless",
    name: "Chicken Boneless Pickle",
    tagline: "Premium boneless chicken",
    description: "Tender boneless chicken cubes folded into red chili and aromatic spices.",
    image: "/product-chicken-boneless.jpg",
    category: "Non-Veg" as const,
    sizes: [
      { weight: "250 g", price: 490 },
      { weight: "500 g", price: 850 },
      { weight: "1 kg", price: 1390 },
    ],
    featured: true,
    isHotOffer: false,
  },
  {
    slug: "gongura-chicken",
    name: "Gongura Chicken (Bone)",
    tagline: "Chicken in tart sorrel",
    description: "Bone-in chicken slow-cooked with gongura and hand-pounded masalas — a regional classic.",
    image: "/product-chicken.jpg",
    category: "Non-Veg" as const,
    sizes: [
      { weight: "250 g", price: 390 },
      { weight: "500 g", price: 690 },
      { weight: "1 kg", price: 1250 },
    ],
    featured: true,
    isHotOffer: true,
  },
  {
    slug: "prawns",
    name: "Prawns Pickle",
    tagline: "Coastal Andhra, bottled",
    description: "Plump prawns layered with garlic, fiery red chili and pure sesame oil.",
    image: "/product-prawns.jpg",
    category: "Non-Veg" as const,
    sizes: [
      { weight: "250 g", price: 430 },
      { weight: "500 g", price: 750 },
      { weight: "1 kg", price: 1390 },
    ],
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "gongura-prawns",
    name: "Gongura Prawns Pickle",
    tagline: "Prawns meet sorrel",
    description: "Prawns folded into tart gongura with garlic and chili — coastal Andhra at its finest.",
    image: "/product-prawns.jpg",
    category: "Non-Veg" as const,
    sizes: [
      { weight: "250 g", price: 460 },
      { weight: "500 g", price: 830 },
      { weight: "1 kg", price: 1460 },
    ],
    featured: true,
    isHotOffer: true,
  },
  {
    slug: "dried-mango",
    name: "Dried Mango Pieces",
    tagline: "Sun-dried, ready for cooking",
    description: "Salt-cured raw mango pieces, sun-dried slowly — perfect for dals and rasams.",
    image: "/product-dried-mango.jpg",
    category: "Sun Dries" as const,
    sizes: [
      { weight: "250 g", price: 190 },
      { weight: "500 g", price: 290 },
    ],
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "pindi-vadiyalu",
    name: "Pindi Vadiyalu",
    tagline: "Crisp lentil dumplings",
    description: "Hand-shaped lentil dumplings, sun-dried for that signature crunch when fried.",
    image: "/product-vadiyalu.jpg",
    category: "Sun Dries" as const,
    sizes: [
      { weight: "250 g", price: 190 },
      { weight: "500 g", price: 320 },
    ],
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "challa-mirapakayalu",
    name: "Challa Mirapakayalu",
    tagline: "Buttermilk-soaked chilies",
    description: "Green chilies soaked in spiced buttermilk and sun-dried — crisp, salty, smoky.",
    image: "/product-challa-mirchi.jpg",
    category: "Sun Dries" as const,
    sizes: [
      { weight: "100 g", price: 250 },
      { weight: "250 g", price: 450 },
    ],
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "idly-karam-podi",
    name: "Idly Karam Podi",
    tagline: "The classic gunpowder",
    description: "Roasted lentils and chilies ground to a fragrant powder — pairs with sesame oil over hot idly.",
    image: "/product-idly-podi.jpg",
    category: "Powders" as const,
    sizes: powderSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "karvepaku-podi",
    name: "Karvepaku Podi",
    tagline: "Curry leaf powder",
    description: "Fresh curry leaves dry-roasted with dal and chili — earthy, aromatic, deeply South Indian.",
    image: "/product-karvepaku-podi.jpg",
    category: "Powders" as const,
    sizes: powderSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "kandhi-podi",
    name: "Kandhi Podi",
    tagline: "Toor dal spice mix",
    description: "Roasted toor dal blended with chili and garlic — sprinkle on rice with ghee.",
    image: "/product-kandhi-podi.jpg",
    category: "Powders" as const,
    sizes: powderSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "dhaniyala-karam-podi",
    name: "Dhaniyala Karam Podi",
    tagline: "Coriander chili powder",
    description: "Coriander seeds and dry chilies stone-ground into a warm, fragrant everyday powder.",
    image: "/product-dhaniyala-podi.jpg",
    category: "Powders" as const,
    sizes: powderSizes,
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "chilli-powder-curry",
    name: "Chilli Powder — Curry",
    tagline: "Stone-ground for daily cooking",
    description: "Sun-dried Guntur chilies stone-ground for a balanced, everyday curry powder.",
    image: "/product-chilli-powder.jpg",
    category: "Spices" as const,
    sizes: [
      { weight: "250 g", price: 180 },
      { weight: "500 g", price: 290 },
      { weight: "1 kg", price: 490 },
    ],
    featured: false,
    isHotOffer: false,
  },
  {
    slug: "chilli-powder-pickle",
    name: "Chilli Powder — Pickle",
    tagline: "Coarse pickle-grade chili",
    description: "Coarse-ground premium chili, made for pickling — vivid red, deep heat.",
    image: "/product-chilli-powder.jpg",
    category: "Spices" as const,
    sizes: [
      { weight: "250 g", price: 260 },
      { weight: "500 g", price: 450 },
      { weight: "1 kg", price: 750 },
    ],
    featured: false,
    isHotOffer: false,
  },
];

const seedCouponsData = [
  { code: "WELCOME50", discountType: "fixed" as const, discountValue: 50, minCartValue: 200, isActive: true },
  { code: "AMRUTH10", discountType: "percentage" as const, discountValue: 10, minCartValue: 500, isActive: true },
  { code: "FREE100", discountType: "fixed" as const, discountValue: 100, minCartValue: 1000, isActive: true },
];

export async function seedDatabase() {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(seedProductsData);
      console.log(`Seeded ${seedProductsData.length} default products.`);
    }

    // Update any products that still reference the old /src/assets/ paths
    const productsToUpdate = await Product.find({ image: /^\/src\/assets\// });
    if (productsToUpdate.length > 0) {
      for (const p of productsToUpdate) {
        p.image = p.image.replace("/src/assets/", "/");
        await p.save();
      }
      console.log(`Updated ${productsToUpdate.length} product image paths from /src/assets/ to root.`);
    }

    // Update any uploaded products that reference localhost:3000
    const localhostUploads = await Product.find({ image: /^http:\/\/localhost:3000\/uploads\// });
    if (localhostUploads.length > 0) {
      const backendUrl = process.env.BACKEND_URL || "https://api.andhramruth.com";
      for (const p of localhostUploads) {
        p.image = p.image.replace("http://localhost:3000", backendUrl);
        await p.save();
      }
      console.log(`Updated ${localhostUploads.length} localhost product image URLs to ${backendUrl}.`);
    }


    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      await Coupon.insertMany(seedCouponsData);
      console.log(`Seeded ${seedCouponsData.length} default coupons.`);
    }

    // Seed Super Admin
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@andraamruth.com").toLowerCase();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";

    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = new User({
        email: superAdminEmail,
        name: "Super Admin",
        role: "super-admin",
        password: hashPassword(superAdminPassword),
        cart: [],
        wishlist: [],
      });
      await superAdmin.save();
      console.log(`Seeded Super Admin user: ${superAdminEmail}`);
    } else {
      if (superAdmin.role !== "super-admin") {
        superAdmin.role = "super-admin";
        await superAdmin.save();
        console.log(`Updated existing user ${superAdminEmail} to super-admin role`);
      }
    }
  } catch (error) {
    console.error("Database seeding failed:", error);
  }
}
