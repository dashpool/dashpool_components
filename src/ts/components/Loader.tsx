import React, { useEffect, useState } from 'react';



type LoaderProps = {
  /**
   * Unique ID to identify this component in Dash callbacks.
   */
  id: string;

  /**
  * url to load the data
  */
  url: string;

  /**
  * url to load the data
  */
  request: any;

  /**
  * element that should be extracted from the request result
  */
  output: string;

  /**
   * Update props to trigger callbacks.
   */
  setProps: (props: Record<string, any>) => void;
}


/**
 * Component to serve as Loader for Graphs
 */
const Loader = (props: LoaderProps) => {
  const { id, url, request, output } = props;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // Function to extract the desired data from the JSON response
    const extractData = (jsonData: any, outputKey: string) => {
      const keys = outputKey.split('.');
      let extractedData = jsonData;
      for (const key of keys) {
        if (extractedData.hasOwnProperty(key)) {
          extractedData = extractedData[key];
        } else {
          // Handle the case where the nested property doesn't exist
          extractedData = null;
          break;
        }
      }

      return extractedData;
    };

    // Function to instantiate the React component from the window
    const initComponent = (extractedData: any) => {

      if (output.endsWith("figure")) {
        const Component = window["dash_core_components"]["Graph"];
        return <Component figure={extractedData} style={{ width: '100%', height: '100%' }} setProps={(_) => { }} />;
      }


      if (output.endsWith("defParams")) {
        const Component = window["dash_express_components"]["Graph"];
        return <Component defParams={extractedData} plotApi={url.replace('_dash-update-component', 'plotApi')} style={{ width: '100%', height: '100%' }} setProps={(el) => {console.log(el) }} />;
      }

      return null;
    };

    // Fetch data from the provided URL using POST request
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
      .then((response) => response.json())
      .then((jsonData) => {
        // Extract the desired data from the JSON response
        const extractedData = ("multi" in jsonData && jsonData.multi) ? extractData(jsonData.response, output) : jsonData;

        // Instantiate the React component with the extracted data
        const renderedComponent = initComponent(extractedData);

        // Set dataLoading to false to indicate that the data component is fully rendered
        setLoading(false);

        // Update the state to display the rendered component
        setData(renderedComponent);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
        setError('Error fetching data. Please try again later.');
      });
  }, [url, request, output]);

  return (
    <div id={id} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading ? (
        <div className="spinner"></div>
      ) : error ? (
        <div className="alert alert-danger" role="alert" style={{ "top": "calc(50% - 28px)", "textAlign": "center" }}>{error}</div>
      ) : (
        data
      )}
    </div>
  );
};

Loader.defaultProps = {

};

export default Loader;
