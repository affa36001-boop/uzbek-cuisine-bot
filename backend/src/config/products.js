// Products for Uzbek National Cuisine
export const products = [
  // ═══ ПЛОВ (Plov) ═══
  {
    id: 1,
    name: 'Плов Ташкентский',
    category: 'plov',
    description: 'Классический плов из девзиры с бараниной, морковью и нутом по-ташкентски',
    basePrice: 45000,
    image: '/uzbek-pilaf.jpg',
    sizes: {
      S: { multiplier: 1, label: '1 порция (400г)' },
      M: { multiplier: 1.8, label: '2 порции (800г)' },
      L: { multiplier: 4, label: 'Казан (2кг)' }
    },
    toppings: ['extra_meat', 'quail_eggs', 'garlic_head']
  },
  {
    id: 2,
    name: 'Плов Самаркандский',
    category: 'plov',
    description: 'Ароматный плов по-самаркандски с курдюком, жёлтой морковью и зирой',
    basePrice: 50000,
    image: '/samarkandskiy-plov-3.jpg',
    sizes: {
      S: { multiplier: 1, label: '1 порция (400г)' },
      M: { multiplier: 1.8, label: '2 порции (800г)' },
      L: { multiplier: 4, label: 'Казан (2кг)' }
    },
    toppings: ['extra_meat', 'quail_eggs', 'raisins']
  },
  {
    id: 3,
    name: 'Плов Праздничный',
    category: 'plov',
    description: 'Особый плов с бараниной, изюмом, барбарисом и перепелиными яйцами',
    basePrice: 65000,
    image: '/download.jpg',
    sizes: {
      S: { multiplier: 1, label: '1 порция (400г)' },
      M: { multiplier: 1.8, label: '2 порции (800г)' },
      L: { multiplier: 4, label: 'Казан (2кг)' }
    },
    toppings: ['extra_meat', 'quail_eggs', 'garlic_head', 'raisins']
  },

  // ═══ ШАШЛЫК (Shashlik) ═══
  {
    id: 4,
    name: 'Шашлык из баранины',
    category: 'shashlik',
    description: 'Сочный шашлык из отборной баранины на углях, маринованный в луке и специях',
    basePrice: 55000,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: ['extra_onion', 'adjika']
  },
  {
    id: 5,
    name: 'Шашлык из курицы',
    category: 'shashlik',
    description: 'Нежный куриный шашлык с ароматными травами, подаётся с лавашом',
    basePrice: 38000,
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: ['extra_onion', 'adjika']
  },
  {
    id: 6,
    name: 'Люля-кебаб',
    category: 'shashlik',
    description: 'Рубленый кебаб из баранины со специями, приготовленный на мангале',
    basePrice: 42000,
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: ['extra_onion', 'adjika']
  },
  {
    id: 7,
    name: 'Казан-кабоб',
    category: 'shashlik',
    description: 'Мясо с овощами и картофелем, томлённое в чугунном казане',
    basePrice: 48000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: ['extra_meat']
  },

  // ═══ ВЫПЕЧКА (Bakery) ═══
  {
    id: 8,
    name: 'Самса с мясом',
    category: 'bakery',
    description: 'Хрустящие слоёные треугольники с сочной начинкой из баранины и лука',
    basePrice: 18000,
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: null
  },
  {
    id: 9,
    name: 'Самса с тыквой',
    category: 'bakery',
    description: 'Вегетарианская самса с нежной тыквенной начинкой и специями',
    basePrice: 15000,
    image: 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: null
  },
  {
    id: 10,
    name: 'Тандир нон',
    category: 'bakery',
    description: 'Традиционная узбекская лепёшка из тандыра, хрустящая и ароматная',
    basePrice: 8000,
    image: '/Non.jpg',
    sizes: null,
    toppings: null
  },
  {
    id: 11,
    name: 'Чебурек',
    category: 'bakery',
    description: 'Жареный пирожок с хрустящим тестом и мясной начинкой',
    basePrice: 20000,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: null
  },

  // ═══ СУПЫ (Soups) ═══
  {
    id: 12,
    name: 'Шурпа',
    category: 'soups',
    description: 'Наваристый суп из баранины с крупными кусками овощей и зеленью',
    basePrice: 35000,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: null
  },
  {
    id: 13,
    name: 'Лагман',
    category: 'soups',
    description: 'Густой суп с домашней лапшой, мясом и обжаренными овощами',
    basePrice: 38000,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800&auto=format&fit=crop',
    sizes: null,
    toppings: null
  },
  {
    id: 14,
    name: 'Мастава',
    category: 'soups',
    description: 'Сытный рисовый суп с бараниной, овощами и зеленью, подаётся с катыком',
    basePrice: 32000,
    image: '/mastava.jpg',
    sizes: null,
    toppings: null
  }
];

// Available toppings
export const toppings = {
  extra_meat: { name: 'Доп. мясо', price: 15000 },
  quail_eggs: { name: 'Перепелиные яйца (3 шт)', price: 8000 },
  garlic_head: { name: 'Головка чеснока', price: 3000 },
  raisins: { name: 'Изюм', price: 5000 },
  extra_onion: { name: 'Доп. маринованный лук', price: 5000 },
  adjika: { name: 'Аджика домашняя', price: 5000 }
};

// Get product by ID
export function getProductById(id) {
  return products.find(p => p.id === parseInt(id));
}

// Get products by category
export function getProductsByCategory(category) {
  return products.filter(p => p.category === category);
}

// Calculate product price
export function calculatePrice(productId, size = null, selectedToppings = []) {
  const product = getProductById(productId);
  if (!product) return 0;

  let price = product.basePrice;

  if (size && product.sizes && product.sizes[size]) {
    price *= product.sizes[size].multiplier;
  }

  if (selectedToppings && selectedToppings.length > 0) {
    selectedToppings.forEach(toppingKey => {
      if (toppings[toppingKey]) {
        price += toppings[toppingKey].price;
      }
    });
  }

  return Math.round(price);
}

export default { products, toppings, getProductById, getProductsByCategory, calculatePrice };
