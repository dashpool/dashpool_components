// DashpoolContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';


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

  const updateSharedData = (newData: SharedData) => {
    setSharedData({ ...sharedData, ...newData });
  };


  return (
    <DashpoolContext.Provider value={{ sharedData, updateSharedData }}>
      {children}
    </DashpoolContext.Provider>
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