'use client';

import { useState, useEffect } from 'react';
import { checkOrderingStatus } from '@/app/utils/timeUtils';
import { Breakfast } from '@/app/types/orderTypes';
import { LandingScreen } from '@/app/components/screens/LandingScreen';
import { ClosedScreen } from '@/app/components/screens/ClosedScreen';
import { BuildWaakyeScreen } from '@/app/components/screens/BuildWaakyeScreen';
import { SBlinkspage } from '@/app/components/screens/SBlinkspage';
import { OrderSummaryScreen } from '@/app/components/screens/OrderSummaryScreen';
import { ConfirmationScreen } from '@/app/components/screens/ConfirmationScreen';
import { OrderHistoryScreen } from '@/app/components/screens/OrderHistoryScreen';
import { RewardsScreen } from '@/app/components/screens/RewardsScreen';
import { UsernameScreen } from '@/app/components/screens/UsernameScreen';
import { VendorSelectScreen } from '@/app/components/screens/VendorSelectScreen';
import { useUser } from '@/app/context/UserContext';
import { CartProvider, useCart } from '@/app/context/CartContext';
import { VendorProvider, useVendor } from '@/app/context/VendorContext';
import { FloatingCartButton } from '@/app/components/FloatingCartButton';
import { saveOrder } from '@/app/utils/orderHistory';
import { recordOrder } from '@/app/lib/game-service';
import { Toaster, toast } from 'sonner';

type Screen = 'landing' | 'closed' | 'build' | 'build2' | 'summary' | 'confirm' | 'history' | 'rewards';
type OrderType = 'waakye' | 'breakfast';

// CartProvider has to sit above everything that calls useCart(), so App itself
// is now just a thin wrapper and the real logic lives in AppContent.
export default function App() {
  return (
    <CartProvider>
      <VendorProvider>
        <AppContent />
      </VendorProvider>
    </CartProvider>
  );
}

function AppContent() {
  const { hasUser, phone, username, ready } = useUser();
  const { addToCart, clearCart, itemsSubtotal } = useCart();
  const { selectedVendor, clearVendor } = useVendor();

  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [orderingStatus, setOrderingStatus] = useState(checkOrderingStatus());
  const [orderType, setOrderType] = useState<OrderType>('waakye');
  const [canSpin, setCanSpin] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [spinsRemaining, setSpinsRemaining] = useState(3);
  const [breakfastOrder, setBreakfastOrder] = useState<Breakfast>({
    drink: 'tea',
    extras: [],
    deliveryMode: 'pickup',
  });

  // ── Time-based open/close polling ──────────────────────────────────────────
  useEffect(() => {
    const status = checkOrderingStatus();
    setOrderingStatus(status);
    if (!status.isOpen && currentScreen === 'landing') {
      setCurrentScreen('closed');
    }

    const interval = setInterval(() => {
      const newStatus = checkOrderingStatus();
      setOrderingStatus(newStatus);
      if (!newStatus.isOpen && ['landing', 'build', 'build2', 'summary'].includes(currentScreen)) {
        setCurrentScreen('closed');
      }
      if (newStatus.isOpen && currentScreen === 'closed') {
        setCurrentScreen('landing');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // ── Wait for the anonymous session + profile lookup to resolve ─────────────
  if (!ready) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <div className="min-h-[100dvh] bg-[#fefaf4] flex items-center justify-center">
          <div className="text-4xl animate-pulse">🍚</div>
        </div>
      </>
    );
  }

  // ── Username gate — show before anything else ──────────────────────────────
  if (!hasUser) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <UsernameScreen />
      </>
    );
  }

  // ── Vendor gate — pick who you're ordering from before browsing a menu ─────
  if (!selectedVendor) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <VendorSelectScreen onSelect={() => setCurrentScreen('landing')} />
      </>
    );
  }

  // ── Waakye builder → cart. Breakfast temporarily disabled (see LandingScreen
  // wiring below) since SBlinkspage hasn't been converted to this model yet.
  function handleWaakyeAddToCart(items: import('@/app/context/CartContext').OrderLineItem[]) {
    if (!selectedVendor) return;
    addToCart(selectedVendor.id, items);
    setCurrentScreen('summary');
  }

  // ── Order confirmed: save + record points across the whole cart ────────────
 async function handleOrderConfirmed() {
  try {
    const result = await recordOrder(phone, username, itemsSubtotal);
    setPointsEarned(result.pointsEarned);
  } catch (e) {
    console.error('Could not record points for this order', e);
  }
  setCurrentScreen('confirm');
}

  function handleOrderDone() {
    clearCart();
    setCurrentScreen('history');
  }

  const handleTimerComplete = () => setCurrentScreen('closed');

  const renderScreen = () => {
    if (!orderingStatus.isOpen && !['closed', 'confirm', 'history', 'rewards'].includes(currentScreen)) {
      return <ClosedScreen timeUntilOpen={orderingStatus.timeUntilOpen} />;
    }

    switch (currentScreen) {
      case 'landing':
        return (
          <LandingScreen
            timeUntilClose={orderingStatus.timeUntilClose}
            onStart={() => { setOrderType('waakye'); setCurrentScreen('build'); }}
            onBuild={() => toast('Breakfast ordering is coming soon!')}
            onTimerComplete={handleTimerComplete}
            onRewards={() => setCurrentScreen('rewards')}
            onSwitchVendor={clearVendor}
          />
        );

      case 'closed':
        return <ClosedScreen timeUntilOpen={orderingStatus.timeUntilOpen} />;

      case 'build':
        return (
          <BuildWaakyeScreen
            onBack={() => setCurrentScreen('landing')}
            onAddToCart={handleWaakyeAddToCart}
          />
        );

      case 'build2':
        // Dormant for now — breakfast hasn't been converted to the DB-driven
        // cart model yet, and this screen is unreachable from LandingScreen
        // until it is. Left in place rather than deleted so SBlinkspage isn't
        // silently broken if it's reached some other way.
        return (
          <SBlinkspage
            order={breakfastOrder}
            onUpdateOrder={setBreakfastOrder}
            onBack={() => setCurrentScreen('landing')}
            onContinue={() => setCurrentScreen('landing')}
          />
        );

      case 'summary':
        // No more order/orderType/onUpdateOrder props — OrderSummaryScreen
        // reads everything straight from useCart().
        return (
          <OrderSummaryScreen
            onBack={() => setCurrentScreen('landing')}
            onConfirm={handleOrderConfirmed}
          />
        );

      case 'confirm':
        return (
         <ConfirmationScreen
      onDone={handleOrderDone}
      pointsEarned={pointsEarned}
    />
        );

      case 'history':
        return (
          <OrderHistoryScreen
            onOrderAgain={(storedOrder) => {
              if (storedOrder.type === 'breakfast') {
                setBreakfastOrder(storedOrder);
                setOrderType('breakfast');
                setCurrentScreen('build2');
              } else {
                // NOTE: BuildWaakyeScreen no longer accepts a prefilled order
                // (it's self-contained now, fetching from vendor_menu_items),
                // so "order again" just opens a fresh builder instead of
                // restoring the previous selection. Known gap, not fixed yet.
                setOrderType('waakye');
                setCurrentScreen('build');
              }
            }}
          />
        );

      case 'rewards':
        return (
          <RewardsScreen
            onBack={() => setCurrentScreen(canSpin ? 'confirm' : 'landing')}
            canSpin={canSpin}
          />
        );

      default:
        return (
          <LandingScreen
            timeUntilClose={orderingStatus.timeUntilClose}
            onStart={() => setCurrentScreen('build')}
            onTimerComplete={handleTimerComplete}
          />
        );
    }
  };

  return (
    <div className="size-full">
      <Toaster position="top-center" richColors />
      {renderScreen()}
      {['landing', 'build', 'build2'].includes(currentScreen) && (
        <FloatingCartButton onClick={() => setCurrentScreen('summary')} />
      )}
    </div>
  );
}