// DashpoolContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';

type AppInfo = {
  id: string,
  url: string,
  icon: string
}

// Define the type for the shared data
type SharedData = {
  dragElement?: any,
  apps?: AppInfo[]
};

// Define the context type
interface DashpoolContextType {
  sharedData: SharedData;
  updateSharedData: (newData: SharedData) => void;
}

const DashpoolContext = createContext<DashpoolContextType | undefined>(undefined);

type DashpoolProviderProps = {
  /**
  * Array of children
  */
  children: ReactNode[];

  /**
   * The last drag element
   */
  dragElement?: any;

  /**
   * Update props to trigger callbacks.
   */
  setProps?: (props: Record<string, any>) => void;
}

/**
 * Context provider for easy interaction between Dashpool components
 */
const DashpoolProvider = (props: DashpoolProviderProps) => {
  const { children } = props;
  const [sharedData, setSharedData] = useState<SharedData>({});
  const toast = useRef<Toast>(null);

  const updateSharedData = (newData: SharedData) => {
    setSharedData({ ...sharedData, ...newData });
  };

  useEffect(() => {
    // Add event listener for the message event
    const messageEventListener = (event: MessageEvent) => {
      const messageData = event.data;

      // Check if the message has the type "fetchError"
      if (messageData.type === 'fetchError') {
        // Show PrimeReact Toast with the message

        toast.current?.show({ severity: "warn", summary: messageData.message, detail: JSON.stringify(messageData), life: 3000 });
      }
    };

    navigator.serviceWorker.addEventListener('message', messageEventListener);
    window.addEventListener('message', messageEventListener);

    // Clean up the event listener when the component unmounts
    return () => {
      navigator.serviceWorker.removeEventListener('message', messageEventListener);
      window.removeEventListener('message', messageEventListener);
    };
  }, []); // Empty dependency array means this effect runs once on component mount

  return (
    <div>
      {/* Your other content here */}
      <DashpoolContext.Provider value={{ sharedData, updateSharedData }}>
        {children}
      </DashpoolContext.Provider>

      {/* PrimeReact Toast */}
      <Toast ref={toast} position="bottom-right" />
    </div>
  );
};

const useDashpoolData = (): DashpoolContextType => {
  const context = useContext(DashpoolContext);
  if (context === undefined) {
    throw new Error('useDashpoolData must be used within a DashpoolProvider');
  }
  return context;
};


DashpoolProvider.defaultProps = {};

export { useDashpoolData };
export default DashpoolProvider;