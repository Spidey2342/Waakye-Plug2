import { useState, useEffect } from 'react';
import { checkOrderingStatus } from '@/app/utils/timeUtils';
import { OrderItem, Breakfast } from '@/app/types/orderTypes';
import { LandingScreen } from '@/app/components/screens/LandingScreen';
import { ClosedScreen } from '@/app/components/screens/ClosedScreen';
import { BuildWaakyeScreen } from '@/app/components/screens/BuildWaakyeScreen';
import { SBlinkspage } from '@/app/components/screens/SBlinkspage';
import { OrderSummaryScreen } from '@/app/components/screens/OrderSummaryScreen';
import { ConfirmationScreen } from '@/app/components/screens/ConfirmationScreen';
import { OrderHistoryScreen } from '@/app/components/screens/OrderHistoryScreen';
import { RewardsScreen } from '@/app/components/screens/RewardsScreen';
import { UsernameScreen } from '@/app/components/screens/UsernameScreen';
import { useUser } from '@/app/context/UserContext';
import { saveOrder } from '@/app/utils/orderHistory';
import { recordOrder } from '@/app/lib/gameService';
import { Toaster } from 'sonner';

type Screen = 'landing' | 'closed' | 'build' | 'build2' | 'summary' | 'confirm' | 'history' | 'rewards';
type OrderType = 'waakye' | 'breakfast';


export default function App() {
  const { hasUser, userId, username } = useUser();

  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [orderingStatus, setOrderingStatus] = useState(checkOrderingStatus());
  const [orderType, setOrderType] = useState<OrderType>('waakye');
  const [canSpin, setCanSpin] = useState(false);

  const [waakyeOrder, setWaakyeOrder] = useState<OrderItem>({
    size: 'medium',
    proteins: {},
    extras: [],
    deliveryMode: 'pickup',
  });
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

  // ── Username gate — show before anything else ──────────────────────────────
  if (!hasUser) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <UsernameScreen />
      </>
    );
  }

  // ── Order confirmed: save + record points ──────────────────────────────────
  async function handleOrderConfirmed() {
    saveOrder(orderType === 'waakye' ? waakyeOrder : breakfastOrder);
    try {
      // orderTotal=1 means 10 pts base; pass real GHS total here if available
      await recordOrder(userId, username, 1);
    } catch (e) {
      console.error('Could not record order for gamification', e);
    }
    setCanSpin(true);
    setCurrentScreen('confirm');
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
            onBuild={() => { setOrderType('breakfast'); setCurrentScreen('build2'); }}
            onTimerComplete={handleTimerComplete}
            // Add this button to your LandingScreen if it doesn't have it yet:
            onRewards={() => setCurrentScreen('rewards')}
          />
        );

      case 'closed':
        return <ClosedScreen timeUntilOpen={orderingStatus.timeUntilOpen} />;

      case 'build':
        return (
          <BuildWaakyeScreen
            order={waakyeOrder}
            onUpdateOrder={setWaakyeOrder}
            onBack={() => setCurrentScreen('landing')}
            onContinue={() => setCurrentScreen('summary')}
          />
        );

      case 'build2':
        return (
          <SBlinkspage
            order={breakfastOrder}
            onUpdateOrder={setBreakfastOrder}
            onBack={() => setCurrentScreen('landing')}
            onContinue={() => setCurrentScreen('summary')}
          />
        );

      case 'summary':
        return (
          <OrderSummaryScreen
            order={orderType === 'waakye' ? waakyeOrder : breakfastOrder}
            orderType={orderType}
            onBack={() => setCurrentScreen(orderType === 'waakye' ? 'build' : 'build2')}
            onConfirm={handleOrderConfirmed}
            onUpdateOrder={orderType === 'waakye' ? setWaakyeOrder : setBreakfastOrder}
          />
        );

      case 'confirm':
        return (
          <ConfirmationScreen
            order={orderType === 'waakye' ? waakyeOrder : breakfastOrder}
            orderType={orderType}
            onSaveOrder={saveOrder}
            onDone={() => setCurrentScreen('history')}
            // Wire this button in ConfirmationScreen:
            onViewRewards={() => { setCurrentScreen('rewards'); }}
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
                setWaakyeOrder(storedOrder);
                setOrderType('waakye');
                setCurrentScreen('build');
              }
            }}
          />
        );

      case 'rewards':
        // return <div>Rewards coming soon</div>;
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
    </div>
  );
}