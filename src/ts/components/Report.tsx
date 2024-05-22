import React from 'react';



type ReportProps = {
  /**
   * Unique ID to identify this component in Dash callbacks.
   */
  id: string;

  /**
   * Update props to trigger callbacks.
   */
  setProps: (props: Record<string, any>) => void;
}


/**
 * Component to show a  Report
 */
const Report = (props: ReportProps) => {
  const { id,  setProps } = props;


  return (
    <div id={id} style={{ width: '100%', height: '100%', position: 'relative' }}>
    </div>
  );
};

Report.defaultProps = {

};

export default Report;
