/**
 * Mascot Image Preloader
 * Eagerly downloads and decodes all baby mascot images into browser & GPU cache
 * so Catie & Milo popups, toasts, and cart icons render instantaneously with 0ms delay.
 */

export const ALL_MASCOT_IMAGES: string[] = [
  // ── Girl (Catie) ──
  '/baby/iteam_added_toast.jpg',
  '/baby/iteam_added.jpg',
  '/baby/more_item_added.jpg',
  '/baby/saved_favoraoite_toast.jpg',
  '/baby/cart_empty.jpg',
  '/baby/cart_with_item.jpg',
  '/baby/empty_wating.jpg',
  '/baby/ready_to_checkout.jpg',
  '/baby/order_on_the_toast.jpg',

  // ── Boy (Milo) ──
  '/baby/boy_item_added.jpg',
  '/baby/boy_pizza_added.jpg',
  '/baby/boy_burger_added.jpg',
  '/baby/boy_biriyani_aroma.jpg',
  '/baby/boy_biriyani_aroma_small.jpg',
  '/baby/boy_cart_empty_food.jpg',
  '/baby/boy_cart_with_item.jpg',
  '/baby/boy_ready_to_checkout.jpg',
  '/baby/boy_waiting_for_food.jpg',
];

// In-memory HTMLImageElement cache prevents browser GC from clearing images
const imageMemoryCache: HTMLImageElement[] = [];

export function preloadAllMascotImages(): void {
  if (typeof window === 'undefined') return;

  ALL_MASCOT_IMAGES.forEach((src) => {
    try {
      const img = new Image();
      img.decoding = 'sync';
      img.loading = 'eager';
      img.src = src;

      // Force bitmap decoding into GPU memory if decode API is supported
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().catch(() => {
          // Ignore decoding errors on non-essential frames
        });
      }

      imageMemoryCache.push(img);
    } catch {
      // Graceful fallback
    }
  });
}

// Auto-run immediately when this module is evaluated
if (typeof window !== 'undefined') {
  preloadAllMascotImages();
}
