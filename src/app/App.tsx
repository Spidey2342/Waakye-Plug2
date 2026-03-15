import { useState, useEffect } from 'react';
import { checkOrderingStatus } from '@/app/utils/timeUtils';
import { OrderItem } from '@/app/types/orderTypes';
import { LandingScreen } from '@/app/components/screens/LandingScreen';
import { ClosedScreen } from '@/app/components/screens/ClosedScreen';
import { BuildWaakyeScreen } from '@/app/components/screens/BuildWaakyeScreen';
import { OrderSummaryScreen } from '@/app/components/screens/OrderSummaryScreen';
import { ConfirmationScreen } from '@/app/components/screens/ConfirmationScreen';
import { saveOrder } from '@/app/utils/orderHistory';
import { OrderHistoryScreen } from '@/app/components/screens/OrderHistoryScreen';


/**
 * Waakye Plug - Morning-only Waakye Ordering Experience
 * 
 * Ordering Hours: 5:30 AM - 8:00 AM
 * 
 * Flow:
 * 1. Landing Screen (with countdown) → Build Screen → Summary → Confirmation
 * 2. Closed Screen (outside ordering hours)
 * 
 * To test different times, modify TEST_TIME in /src/app/utils/timeUtils.ts
 * Example: export const TEST_TIME = new Date('2026-01-15T07:00:00');
 */

type Screen = 'landing' | 'closed' | 'build' | 'summary' | 'confirm' | 'history';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [orderingStatus, setOrderingStatus] = useState(checkOrderingStatus());
  const [order, setOrder] = useState<OrderItem>({
    size: 'medium',
    proteins: {},
    extras: [],
    deliveryMode: 'pickup',
  });
useEffect(() => {
  const status = checkOrderingStatus();
  setOrderingStatus(status);

  if (!status.isOpen && currentScreen === 'landing') {
    setCurrentScreen('closed');
  }

  const interval = setInterval(() => {
    const newStatus = checkOrderingStatus();
    setOrderingStatus(newStatus);

    if (!newStatus.isOpen && (currentScreen === 'landing' || currentScreen === 'build' || currentScreen === 'summary')) {
      setCurrentScreen('closed');
    }

    if (newStatus.isOpen && currentScreen === 'closed') {
      setCurrentScreen('landing');
    }

  }, 1000);

  return () => clearInterval(interval);

}, []);

  const handleTimerComplete = () => {
    setCurrentScreen('closed');
  };

  const renderScreen = () => {
    // Force closed screen if ordering is not open
    if (!orderingStatus.isOpen && currentScreen !== 'closed' && currentScreen !== 'confirm') {
      return (
        <ClosedScreen 
          timeUntilOpen={orderingStatus.timeUntilOpen}
        />
      );
    }

    switch (currentScreen) {
  case 'landing':
    return (
      <LandingScreen
        timeUntilClose={orderingStatus.timeUntilClose}
        onStart={() => setCurrentScreen('build')}
        onTimerComplete={handleTimerComplete}
      />
    );

  case 'closed':
    return (
      <ClosedScreen timeUntilOpen={orderingStatus.timeUntilOpen} />
    );

  case 'build':
    return (
      <BuildWaakyeScreen
        order={order}
        onUpdateOrder={setOrder}
        onBack={() => setCurrentScreen('landing')}
        onContinue={() => setCurrentScreen('summary')}
      />
    );

  case 'summary':
    return (
      <OrderSummaryScreen
        order={order}
        onUpdateOrder={setOrder}
        onBack={() => setCurrentScreen('build')}
        onConfirm={() => setCurrentScreen('confirm')}
      />
    );

  case 'confirm':
    return (
      <ConfirmationScreen
        order={order}
        onSaveOrder={saveOrder}
        onDone={() => setCurrentScreen('history')}
      />
    );

  case 'history':
    return (
      <OrderHistoryScreen
        onOrderAgain={(storedOrder) => {
          setOrder({
            size: storedOrder.size,
            proteins: storedOrder.proteins,
            extras: storedOrder.extras,
            deliveryMode: storedOrder.deliveryMode,
          });
          setCurrentScreen('build');
        }}
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
      {renderScreen()}
    </div>
  );
}