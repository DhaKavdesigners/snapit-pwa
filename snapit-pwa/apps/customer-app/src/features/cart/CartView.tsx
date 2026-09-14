import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useContextStore } from '../../store/contextStore';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBabyToastStore } from '../../store/babyToastStore';
import { mockShoppingProducts, mockFoodProducts } from '../../api/mockData';
import { useAllProducts } from '../../api/queries';
import { formatCurrency } from '../../utils/currency';
import { Plus, Minus, ArrowRight, ShoppingBag, Sparkles, Clock, Zap, Store, UtensilsCrossed, Lock, MapPin, History, Flame, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDeliveryFee } from '../../../../../common_logic/deliveryLogic';

// ── Curated Top Fast-Selling Combos in KGF for Guests & New Customers ─────────
const DEFAULT_FEATURED_COMBOS = [
  {
    id: 'combo-3',
    storeName: 'Mhetha Stores',
    store_id: 'g1',
    isFood: false,
    title: 'Midnight Cravings & Quick Bites',
    badge: '⚡ Most Ordered',
    items: [
      {
        productId: 'ms01',
        name: 'Maggi 2-Minute Masala Noodles',
        quantity: 2,
        price_paise: 2800,
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
      },
      {
        productId: 'ms16',
        name: 'Lays Magic Masala Chips',
        quantity: 1,
        price_paise: 2000,
        imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80',
      },
      {
        productId: 'ms11',
        name: 'Coca-Cola 750 ml',
        quantity: 1,
        price_paise: 4500,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
      },
    ],
    estimated_total: 12100,
    current_total: 12100,
    hasPriceDrop: true,
    savingsPaise: 1600,
  },
  {
    id: 'combo-4',
    storeName: 'Cool Shop',
    store_id: 'f4',
    isFood: true,
    title: 'Special Moore & Kool Combo',
    badge: '🧊 Summer Refreshment',
    items: [
      {
        productId: 'cs_02',
        name: 'Special Moore',
        quantity: 1,
        price_paise: 3000,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
      },
      {
        productId: 'cs_01',
        name: 'Special Kool',
        quantity: 1,
        price_paise: 4000,
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
      },
    ],
    estimated_total: 7000,
    current_total: 7000,
    hasPriceDrop: true,
    savingsPaise: 1000,
  },
  {
    id: 'combo-5',
    storeName: 'Nandhini KGF',
    store_id: 'd1',
    isFood: false,
    title: 'Daily Fresh Milk & Dairy Staples',
    badge: '🥛 Fresh Morning Staple',
    items: [
      {
        productId: 'nd01',
        name: 'Nandini Pasteurised Milk',
        quantity: 2,
        price_paise: 2400,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
      },
      {
        productId: 'nd05',
        name: 'Nandini Table Butter',
        quantity: 1,
        price_paise: 5600,
        imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80',
      },
    ],
    estimated_total: 10400,
    current_total: 10400,
    hasPriceDrop: true,
    savingsPaise: 1200,
  },
  {
    id: 'combo-1',
    storeName: 'Ambur Biriyani KGF',
    store_id: 'f1',
    isFood: true,
    title: 'Ambur Royal Biriyani Feast',
    badge: '🔥 Fast Selling #1',
    items: [
      {
        productId: 'ab01',
        name: 'Special Chicken Dum Biryani',
        quantity: 1,
        price_paise: 18000,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
      },
      {
        productId: 'ab03',
        name: 'Chicken 65 (Boneless)',
        quantity: 1,
        price_paise: 15000,
        imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400',
      },
    ],
    estimated_total: 33000,
    current_total: 33000,
    hasPriceDrop: true,
    savingsPaise: 4000,
  },
  {
    id: 'combo-2',
    storeName: 'MR & MRS KITCHEN',
    store_id: 'f2',
    isFood: true,
    title: 'Hot Chicken Rolls & Peri Peri Fries',
    badge: '🌯 Street Food Hit',
    items: [
      {
        productId: 'mmk_rl_01',
        name: 'Chicken Keema Roll',
        quantity: 1,
        price_paise: 7900,
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=80',
      },
      {
        productId: 'mmk_st_02',
        name: 'Peri Peri French Fries',
        quantity: 1,
        price_paise: 6900,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
      },
    ],
    estimated_total: 14800,
    current_total: 14800,
    hasPriceDrop: true,
    savingsPaise: 2000,
  },
];

export const CartView: React.FC = () => {
  const { items, updateQuantity, reorderItems } = useCartStore();
  const { activeContext, setContext } = useContextStore();
  const { isLoggedIn, userProfile } = useAuthStore();
  const { orders, fetchOrders, storesMap } = useOrderStore();
  const { showToast } = useBabyToastStore();
  const { data: allProducts = [...mockShoppingProducts, ...mockFoodProducts] } = useAllProducts();
  const navigate = useNavigate();

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (userProfile?.phone) {
      fetchOrders(userProfile.phone);
    }
  }, [userProfile?.phone, fetchOrders]);

  const isRegistered = isLoggedIn && !!userProfile;

  const cartItemsWithDetails = items.map(item => ({
    ...item,
    product: allProducts.find(p => p.id === item.productId)
  })).filter(item => item.product !== undefined);

  const itemTotal   = cartItemsWithDetails.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
  const deliveryFee = calculateDeliveryFee({ subtotalRupees: itemTotal / 100 }).feePaise;
  const total       = itemTotal + deliveryFee;

  // Detect food mode: context is food OR any item in cart belongs to a food store (storeId starts with 'f')
  const isFoodMode = activeContext === 'food' ||
    cartItemsWithDetails.some(item => (item.product?.storeId || '').startsWith('f'));

  // Filter and deduplicate user's verified past orders
  const userActualPastOrders = React.useMemo(() => {
    if (!userProfile?.phone) return [];
    const cleanUserPhone = userProfile.phone.replace(/\D/g, '').slice(-10);

    const userOrders = orders.filter((o: any) => {
      const custClean = (o.customer_id || '').replace(/\D/g, '').slice(-10);
      const recClean = (o.recipient_phone || '').replace(/\D/g, '').slice(-10);
      const isMatch = custClean === cleanUserPhone || recClean === cleanUserPhone;
      return (
        isMatch &&
        o.items &&
        o.items.length > 0 &&
        (o.status === 'DELIVERED' ||
          o.status === 'COMPLETED' ||
          !['PLACED', 'PENDING', 'ACCEPTED', 'PREPARING', 'PACKING', 'OUT_FOR_DELIVERY', 'RIDER_AT_LOC', 'ARRIVED'].includes(
            (o.status || '').toUpperCase()
          ))
      );
    });

    // Deduplicate by items signature so duplicate repeated orders (e.g. 2 Maggi orders) show once
    const seen = new Set<string>();
    const uniqueOrders: any[] = [];
    for (const ord of userOrders) {
      const key = (ord.items || [])
        .map((it: any) => it.productId || it.product_id || it.name)
        .sort()
        .join('|');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueOrders.push(ord);
      }
    }
    return uniqueOrders;
  }, [orders, userProfile?.phone]);

  const hasUserPastOrders = isLoggedIn && userActualPastOrders.length > 0;

  // Build the display cards list with both Food & Grocery representation
  const displayCards = React.useMemo(() => {
    if (hasUserPastOrders) {
      const list = [...userActualPastOrders];
      const hasFood = list.some((o: any) => 
        (o.store_id || '').startsWith('f') || 
        !!o.isFood ||
        (o.items || []).some((i: any) => (i.productId || '').startsWith('ab') || (i.productId || '').startsWith('cs') || (i.productId || '').startsWith('bjs') || (i.productId || '').startsWith('mmk') || /biryani|chicken|pizza|burger|roll|juice|kool|moore|fries/i.test(i.name || ''))
      );

      // If user has only grocery past orders, ALWAYS inject top food combos so food is never omitted!
      if (!hasFood) {
        const topFood = DEFAULT_FEATURED_COMBOS.filter(c => c.isFood);
        list.push(...topFood.slice(0, 2));
      } else if (list.length < 3) {
        const extraCombos = DEFAULT_FEATURED_COMBOS.filter(c => !list.some(l => l.storeName === c.storeName));
        list.push(...extraCombos.slice(0, 4 - list.length));
      }
      return list.slice(0, 6);
    }
    return DEFAULT_FEATURED_COMBOS;
  }, [hasUserPastOrders, userActualPastOrders]);

  // ── Auto-Moving Looping Carousel Effect ─────────────────────────────────────
  useEffect(() => {
    if (items.length > 0) return;
    const el = carouselRef.current;
    if (!el) return;

    // Center card index 1 (Cool Shop) initially, matching reference layout
    const cardWidth = 240;
    const gap = 12;
    const targetCenter = (cardWidth + gap) - Math.max(0, (el.clientWidth - cardWidth) / 2);
    if (scrollPosRef.current === 0 && targetCenter > 0) {
      scrollPosRef.current = targetCenter;
      el.scrollLeft = targetCenter;
    }

    let frameId: number;
    const speed = 0.65; // steady, continuous smooth right-to-left crawl

    const loopScroll = () => {
      if (!isInteracting && el) {
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 50) {
          scrollPosRef.current += speed;
          if (scrollPosRef.current >= halfWidth) {
            scrollPosRef.current -= halfWidth;
          }
          el.scrollLeft = scrollPosRef.current;
        }
      }
      frameId = requestAnimationFrame(loopScroll);
    };

    frameId = requestAnimationFrame(loopScroll);
    return () => cancelAnimationFrame(frameId);
  }, [isInteracting, items.length, displayCards]);

  const getOrderReorderSummary = (order: any) => {
    const orderItems = order.items || [];
    let currentTotalPaise = 0;
    let hasPriceDrop = order.hasPriceDrop || false;
    let savingsPaise = order.savingsPaise || 0;
    const resolvedItems: Array<{ productId: string; name: string; quantity: number; currentPrice: number; imageUrl: string }> = [];

    const isOrderFromFoodStore = (order.store_id || '').startsWith('f') || !!order.isFood;

    orderItems.forEach((it: any) => {
      const pid = it.productId || it.product_id;
      const matched = allProducts.find((p: any) => 
        (pid && p.id === pid) || 
        (p.name && it.name && p.name.toLowerCase().trim() === it.name.toLowerCase().trim())
      );
      const qty = it.quantity || 1;
      const paidPricePaise = it.price_paise || it.price || 0;

      let imgUrl = it.imageUrl || matched?.imageUrl || matched?.fallbackImageUrl;
      if (!imgUrl) {
        const lowerName = (it.name || '').toLowerCase();
        if (lowerName.includes('moore') || lowerName.includes('mor') || lowerName.includes('buttermilk')) {
          imgUrl = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80';
        } else if (lowerName.includes('kool') || lowerName.includes('cool') || lowerName.includes('juice') || lowerName.includes('shake')) {
          imgUrl = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80';
        } else if (lowerName.includes('biryani') || lowerName.includes('biriyani')) {
          imgUrl = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400';
        } else if (lowerName.includes('chicken') || lowerName.includes('65')) {
          imgUrl = 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400';
        } else if (lowerName.includes('burger') || lowerName.includes('sandwich')) {
          imgUrl = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400';
        } else if (lowerName.includes('fries') || lowerName.includes('roll')) {
          imgUrl = 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400';
        } else if (isOrderFromFoodStore) {
          imgUrl = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400';
        } else {
          imgUrl = '/images/cat_exp_head/Vegetables.jpg';
        }
      }

      if (matched) {
        resolvedItems.push({
          productId: matched.id,
          name: matched.name,
          quantity: qty,
          currentPrice: matched.price,
          imageUrl: imgUrl,
        });
        currentTotalPaise += matched.price * qty;

        if (paidPricePaise > 0 && matched.price < paidPricePaise) {
          hasPriceDrop = true;
          savingsPaise += (paidPricePaise - matched.price) * qty;
        } else if (matched.originalPrice && matched.originalPrice > matched.price) {
          hasPriceDrop = true;
          savingsPaise += (matched.originalPrice - matched.price) * qty;
        }
      } else if (pid) {
        resolvedItems.push({
          productId: pid,
          name: it.name || 'Item',
          quantity: qty,
          currentPrice: paidPricePaise,
          imageUrl: imgUrl,
        });
        currentTotalPaise += paidPricePaise * qty;
      }
    });

    const isFood = isOrderFromFoodStore || 
      resolvedItems.some(i => (i.productId || '').startsWith('ab') || (i.productId || '').startsWith('cs') || (i.productId || '').startsWith('bjs') || (i.productId || '').startsWith('mmk')) ||
      /biryani|chicken|pizza|burger|roll|juice|kool|moore|fries/i.test(order.title || '') ||
      resolvedItems.some(i => /biryani|chicken|pizza|burger|roll|juice|kool|moore|fries/i.test(i.name));

    const storeName = order.storeName || storesMap[order.store_id] || (isFood ? 'Restaurant Partner' : 'Mhetha Stores');

    return {
      storeName,
      isFood,
      title: order.title,
      badge: order.badge,
      items: resolvedItems,
      currentTotalPaise: currentTotalPaise || order.estimated_total || 25000,
      hasPriceDrop,
      savingsPaise,
    };
  };

  const handleReorder = (orderOrCombo: any) => {
    const summary = getOrderReorderSummary(orderOrCombo);
    if (summary.items.length === 0) {
      alert("No available items found to add.");
      return;
    }
    reorderItems(summary.items.map(i => ({ productId: i.productId, quantity: i.quantity })), true);
    showToast('more_item', `${summary.items.length} items added to your basket!`);
  };

  // ── Render Clustered Mosaic Grid of Product Images (1, 2, 3, or up to 4) ───
  const renderProductImageCollage = (itemsList: Array<{ name: string; imageUrl: string }>) => {
    const images = itemsList.slice(0, 4);

    if (images.length === 0) {
      return (
        <div className="w-full h-18 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-center mb-1">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
        </div>
      );
    }

    if (images.length === 1) {
      return (
        <div className="w-full h-18 rounded-xl overflow-hidden mb-1 bg-gray-100 relative shadow-xs border border-gray-100">
          <img
            src={images[0].imageUrl}
            alt={images[0].name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'; }}
          />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 w-full h-18 rounded-xl overflow-hidden mb-1 bg-gray-100 shadow-xs border border-gray-100">
          <img
            src={images[0].imageUrl}
            alt={images[0].name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'; }}
          />
          <img
            src={images[1].imageUrl}
            alt={images[1].name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80'; }}
          />
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-3 gap-1 w-full h-18 rounded-xl overflow-hidden mb-1 bg-gray-100 shadow-xs border border-gray-100">
          <img
            src={images[0].imageUrl}
            alt={images[0].name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'; }}
          />
          <img
            src={images[1].imageUrl}
            alt={images[1].name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80'; }}
          />
          <img
            src={images[2].imageUrl}
            alt={images[2].name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80'; }}
          />
        </div>
      );
    }

    // 4 Images clustered collage (2x2 grid)
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-18 rounded-xl overflow-hidden mb-1 bg-gray-100 shadow-xs border border-gray-100 relative">
        <img
          src={images[0].imageUrl}
          alt={images[0].name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'; }}
        />
        <img
          src={images[1].imageUrl}
          alt={images[1].name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80'; }}
        />
        <img
          src={images[2].imageUrl}
          alt={images[2].name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80'; }}
        />
        <div className="relative w-full h-full">
          <img
            src={images[3].imageUrl}
            alt={images[3].name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80'; }}
          />
          {itemsList.length > 4 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center text-white font-black text-[9px]">
              +{itemsList.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Empty Cart — Context-aware Mascot Hero + Looping Product Collage Carousel ─────────
  if (items.length === 0) {
    const duplicatedCards = [...displayCards, ...displayCards];

    return (
      <div className="flex-1 w-full flex flex-col justify-between items-center px-3.5 pt-1.5 pb-1 bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 overflow-hidden select-none">
        {/* Top Half: Catie / Momo waiting hero (Identical constrained size and alignment) */}
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md py-1 shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative h-[170px] max-h-[170px] aspect-[159/250] mb-1 shrink-0 flex items-center justify-center"
          >
            <img
              src={isFoodMode ? '/baby/boy_waiting_for_food.jpg' : '/baby/empty_wating.jpg'}
              alt={isFoodMode ? 'Momo waiting for food order' : 'Catie waiting with empty basket'}
              className="h-full w-auto object-contain drop-shadow-sm"
            />
            {/* Floating speech bubble */}
            <div className="absolute -top-1.5 -right-3 bg-white rounded-xl px-2.5 py-0.5 shadow-2xs border border-emerald-100 z-10">
              <p className="text-[9.5px] font-black text-emerald-700 whitespace-nowrap">
                {isFoodMode ? 'What shall we eat? 🍔' : "Let's go shopping! 🛒"}
              </p>
            </div>
          </motion.div>

          <div className="text-center shrink-0 mb-1">
            <h2 className="font-black text-base text-gray-900 tracking-tight leading-tight">
              {isFoodMode ? 'No food ordered yet' : 'Your basket is empty'}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[240px] mx-auto mt-0.5">
              {isFoodMode
                ? 'Momo is hungry and waiting for your order! 🍽️'
                : 'Catie is patiently waiting to fill the basket 💚'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isFoodMode) setContext('food');
              else setContext('shopping');
              navigate('/');
            }}
            className="mt-1 mb-1.5 flex items-center gap-1.5 bg-[#059669] hover:bg-emerald-700 text-white font-black text-[11px] px-5 py-2 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer shrink-0 active:scale-95 transition-all"
          >
            {isFoodMode ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {isFoodMode ? 'Browse Food' : 'Explore Stores'}
          </button>
        </div>

        {/* Bottom Half: "Most Ordered in KGF" Section & Carousel occupying the second half */}
        <div className="w-full max-w-md mx-auto shrink-0 pb-1">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <div className="flex items-center gap-1.5">
              {hasUserPastOrders ? (
                <History className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              )}
              <div>
                <h3 className="font-black text-xs text-gray-900 tracking-tight">
                  {hasUserPastOrders ? 'Order Again' : 'Most Ordered in KGF'}
                </h3>
                <p className="text-[9.5px] text-gray-400 font-medium">
                  {hasUserPastOrders ? 'Your previous orders & top combos' : '⚡ Fast Selling Favorites & Combos'}
                </p>
              </div>
            </div>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {hasUserPastOrders ? 'Recent' : 'Trending 🔥'}
            </span>
          </div>

          {/* Looping Carousel Container */}
          <div
            ref={carouselRef}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => {
              if (carouselRef.current) scrollPosRef.current = carouselRef.current.scrollLeft;
              setTimeout(() => setIsInteracting(false), 1500);
            }}
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => {
              if (carouselRef.current) scrollPosRef.current = carouselRef.current.scrollLeft;
              setIsInteracting(false);
            }}
            className="flex overflow-x-auto gap-3 pb-1 pt-0.5 px-1 hide-scrollbar no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {duplicatedCards.map((card: any, idx: number) => {
              const summary = getOrderReorderSummary(card);
              const orderDate = card.created_at ? new Date(card.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              }) : null;

              return (
                <div
                  key={`${card.id}-${idx}`}
                  className="w-[240px] min-w-[240px] max-w-[240px] shrink-0 bg-white rounded-2xl p-2.5 border border-emerald-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all select-none"
                >
                  {/* Price drop / fast selling badge */}
                  {(summary.hasPriceDrop || summary.badge) && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white font-black text-[8px] px-2 py-0.5 rounded-bl-lg shadow-2xs uppercase tracking-wider flex items-center gap-1 z-10">
                      <span>{summary.badge || '🔥 Price Drop!'}</span>
                      {summary.savingsPaise > 0 && <span>Save {formatCurrency(summary.savingsPaise)}</span>}
                    </div>
                  )}

                  <div>
                    {/* 1. Clustered Product Image Grid (Reduced height h-18) */}
                    {renderProductImageCollage(summary.items)}

                    {/* 2. Store & Title Header */}
                    <div className="flex items-center gap-1 mb-0.5 mt-0.5">
                      {summary.isFood ? (
                        <UtensilsCrossed className="w-3 h-3 text-orange-500 shrink-0" />
                      ) : (
                        <Store className="w-3 h-3 text-brand shrink-0" />
                      )}
                      <span className={`text-[10.5px] font-bold truncate ${summary.isFood ? 'text-orange-700' : 'text-emerald-700'}`}>
                        {summary.storeName}
                      </span>
                    </div>

                    <p className="font-black text-[11px] text-gray-900 line-clamp-1 mb-0.5 leading-snug">
                      {summary.title || summary.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>

                    <p className="text-[9px] font-mono text-gray-400 mb-1">
                      {orderDate ? `${orderDate} • ` : ''}{summary.items.length} {summary.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  {/* 3. Footer: Total Price & Prominent Big Green Button */}
                  <div className="pt-1.5 border-t border-gray-100 space-y-1 mt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] text-gray-400 font-bold block uppercase tracking-wider">Total Amount</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-black text-xs text-gray-950">
                          {formatCurrency(summary.currentTotalPaise)}
                        </span>
                        {summary.hasPriceDrop && summary.savingsPaise > 0 && (
                          <span className="line-through text-[9px] text-gray-400 font-mono">
                            {formatCurrency(summary.currentTotalPaise + summary.savingsPaise)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Green Button */}
                    <button
                      type="button"
                      onClick={() => handleReorder(card)}
                      className="w-full bg-[#059669] hover:bg-emerald-700 text-white font-black text-[11px] py-2 px-3 rounded-xl shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider hover:brightness-105"
                    >
                      <Zap className="w-3 h-3 fill-amber-300 text-amber-300 shrink-0" />
                      <span>{card.created_at ? 'BUY AGAIN' : 'ADD COMBO'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const hasOfflineItems = cartItemsWithDetails.some(item => item.product?.storeIsOpen === false);
  const isReadyForCheckout = cartItemsWithDetails.length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col relative pb-36">
      <div className="flex-1 p-4 pt-3">
        {/* ── Ready-to-checkout banner — Catie or Momo based on context */}
        <AnimatePresence>
          {isReadyForCheckout && (
            <motion.div
              key="ready-banner"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4 shadow-sm overflow-hidden relative"
            >
              <img
                src={isFoodMode ? '/baby/boy_ready_to_checkout.jpg' : '/baby/ready_to_checkout.jpg'}
                alt="Ready to checkout"
                className="w-14 h-14 object-contain object-bottom shrink-0 -mb-3"
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-emerald-900">
                  {isFoodMode ? 'All set! Momo says order up! 🎉' : 'All set! Basket is packed! 🎉'}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {isFoodMode ? 'Your feast is ready — checkout now!' : 'Ready to go — checkout when you are!'}
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-2xl text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-brand text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            Your Cart
          </h2>
          <span className="text-xs font-black bg-emerald-100/70 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
            {cartItemsWithDetails.length} {cartItemsWithDetails.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* ⚠️ Store Offline Alert if any item is from a closed store */}
        {hasOfflineItems && (
          <div className="bg-red-50 border border-red-200/90 text-red-900 rounded-2xl p-3.5 mb-4 text-xs font-bold flex items-center gap-2.5 shadow-xs">
            <span className="text-base shrink-0">⚠️</span>
            <span>Some items belong to a store that is currently closed. Please remove them to proceed.</span>
          </div>
        )}

        {/* 🛍️ Direct Local Store Delivery Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-3.5 shadow-md shadow-emerald-600/15 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Store className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide leading-tight">Direct Local Store Delivery</p>
              <p className="text-[10px] text-emerald-100 font-medium">Freshly picked & delivered from verified KGF stores</p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider">
            Local Drop
          </span>
        </div>

        {/* Item Cards */}
        <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-100/60 mb-6 flex flex-col gap-3.5">
          {cartItemsWithDetails.map((item) => {
            const isItemStoreClosed = item.product?.storeIsOpen === false;
            const stock = item.product!.stockCount !== undefined ? item.product!.stockCount : 99;
            const isLowStock = stock > 0 && stock <= 5;
            const isMaxReached = item.quantity >= stock;
            const isExceedingStock = item.quantity > stock;

            return (
              <motion.div 
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-3.5 items-center p-2.5 rounded-2xl border transition-all ${
                  isItemStoreClosed 
                    ? 'bg-red-50/50 border-red-200 opacity-80' 
                    : isExceedingStock
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-gray-50/50 border-gray-100/80'
                }`}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                  <img 
                    src={item.product!.imageUrl} 
                    alt={item.product!.name} 
                    className={`w-full h-full object-cover ${isItemStoreClosed ? 'grayscale-[80%]' : ''}`} 
                  />
                  {isItemStoreClosed && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-wider">
                      Closed
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isItemStoreClosed ? 'text-red-600' : 'text-emerald-700'}`}>
                      {item.product!.storeName || 'Minnit Store'}
                    </span>
                    {isItemStoreClosed ? (
                      <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">Offline</span>
                    ) : isLowStock ? (
                      <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">Only {stock} left!</span>
                    ) : null}
                  </div>
                  <h4 className="font-bold text-xs text-gray-900 truncate">{item.product!.name}</h4>
                  
                  {isExceedingStock && (
                    <p className="text-[9.5px] font-bold text-amber-700 mt-0.5">
                      ⚠️ Max stock is {stock} items
                    </p>
                  )}

                  <div className="font-mono font-black text-xs text-gray-900 mt-1">
                    {formatCurrency(item.product!.price * item.quantity)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-white border border-emerald-200/80 rounded-xl h-8 overflow-hidden shadow-xs">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, stock)}
                      className="w-7 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono font-black text-xs w-4 text-center text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        if (!isMaxReached && !isItemStoreClosed) {
                          updateQuantity(item.productId, item.quantity + 1, stock);
                        }
                      }}
                      disabled={isItemStoreClosed || isMaxReached}
                      className={`w-7 h-8 flex items-center justify-center transition-colors ${
                        isItemStoreClosed || isMaxReached 
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                          : 'text-brand hover:bg-emerald-50 active:bg-emerald-100'
                      }`}
                      title={isMaxReached ? `Only ${stock} available in stock` : undefined}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* ── Bill Summary (Fixed Footer) ── */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl px-4 py-3 border-t border-emerald-100/90 shadow-[0_-10px_30px_rgba(5,150,105,0.08)] z-40 rounded-t-3xl pb-4">
        <div className="bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 rounded-2xl px-4 py-2.5 border border-emerald-200/80 mb-3 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Item Subtotal</span>
            <span className="font-bold text-gray-900">{formatCurrency(itemTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Delivery Fee</span>
            <span className="font-bold text-gray-900">{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="border-t border-dashed border-emerald-200/80 pt-1.5 flex justify-between items-center">
            <span className="font-black text-sm text-gray-900">Total Due</span>
            <span className="font-black text-lg text-brand font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Where should we deliver prompt with direct Sign Up option */}
        {!isRegistered && (
          <div 
            onClick={() => navigate('/profile?redirect=/cart')}
            className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-white to-teal-50 border border-emerald-200/90 rounded-2xl px-4 py-2.5 mb-2.5 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-emerald-950 leading-tight">Where should we deliver?</p>
                <p className="text-[10px] text-emerald-700 font-medium leading-tight mt-0.5">Quick address setup to receive your order</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate('/profile?redirect=/cart'); }}
              className="bg-emerald-600 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider shrink-0 shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        )}

        <button
          disabled={hasOfflineItems}
          className={`w-full h-14 font-black text-sm rounded-2xl transition-all flex items-center justify-between px-6 uppercase tracking-wider ${
            hasOfflineItems 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-600 via-brand to-teal-600 text-white shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_30px_rgba(5,150,105,0.5)] active:scale-[0.98] cursor-pointer'
          }`}
          onClick={() => {
            if (hasOfflineItems) return;
            if (!isRegistered) {
              navigate('/profile?redirect=/cart');
            } else {
              navigate('/checkout');
            }
          }}
        >
          <span>
            {hasOfflineItems 
              ? 'Store is Offline' 
              : !isRegistered 
                ? 'Add Delivery Address & Order' 
                : 'Proceed to Checkout'}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{formatCurrency(total)}</span>
            {!hasOfflineItems && <ArrowRight className="h-5 w-5 animate-pulse" />}
          </div>
        </button>
      </div>
    </div>
  );
};
