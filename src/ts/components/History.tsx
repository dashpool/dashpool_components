import React from 'react';
import { useState } from "react";
import { useRef } from 'react';
import { useEffect } from 'react';
import { Tree, TreeDragDropEvent } from 'primereact/tree';
import { ContextMenu } from 'primereact/contextmenu';
import { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
import { useDashpoolData } from './DashpoolProvider';
import { ProgressBar } from 'primereact/progressbar';

import { setDashpoolEvent, DashpoolEvent, TreeViewNode, findTreeViewNode, buildHistoryTree, findTargetElement, generateUniqueId } from '../helper';
import { TreeNode } from 'primereact/treenode';



type HistoryProps = {
  /**
   * Unique ID to identify this component in Dash callbacks.
   */
  id: string;

  /**
  * Array of nodes shown in the Tree View
  */
  nodes: TreeViewNode[];

  /**
   * : An integer that represents the number of times that this element has been refreshed.
   */
  n_refreshed?: number;

  /**
   * : An integer that represents the number of times that this element has been cleared.
   */
  n_cleared?: number;

  /**
   * latest Dashpool Event
   */
  dashpoolEvent?: DashpoolEvent

  /**
   * Update props to trigger callbacks.
   */
  setProps: (props: Record<string, any>) => void;
}


/**
 * Component to serve as a history explorer
 */
const History = (props: HistoryProps) => {
  const { id, nodes, setProps } = props;
  const { sharedData, updateSharedData } = useDashpoolData();

  const [nRefreshed, setNRefreshed] = useState(props.n_refreshed || 0);
  const [nCleared, setNCleared] = useState(props.n_cleared || 0);

  const [internalNodes, setInternalNodes] = useState<TreeNode[]>([]);

  useEffect(() => {
    showProgress(false);
    setInternalNodes(buildHistoryTree(nodes, sharedData?.frames || [], sharedData?.apps || []));
  }, [sharedData, props.nodes])


  const cm = useRef<ContextMenu>(null);
  const hist = useRef<Tree>(null);

  const progress = useRef<ProgressBar>(null);


  const [contextMenuItems, _setContextMenuItems] = useState<MenuItem[]>([]);

  const showProgress = (show: boolean) => {
    const visibility = show ? "visible" : "hidden";
    const element = progress.current?.getElement();
    if (element) {
      element.style.setProperty("visibility", visibility);
    }
  }


  const handleRefresh = () => {
    showProgress(true);
    
    const newNRefreshed = nRefreshed + 1;
    setNRefreshed(newNRefreshed);

    // Use setProps to send the new value to Python
    if (setProps) {
      setProps({ n_refreshed: newNRefreshed });
    }
  };


  const handleClear = () => {
    showProgress(true);
    const newNCleared = nCleared + 1;
    setNCleared(newNCleared);

    // Use setProps to send the new value to Python
    if (setProps) {
      setProps({ n_cleared: newNCleared });
    }
  };




  useEffect(() => {
    
    const container = hist.current.getElement();

    const handleDragStart = (ev: DragEvent) => {
      const target = ev.target as HTMLElement;

      const internalNode = findTargetElement(container, target, internalNodes);
      const node = nodes.filter((el) => el.id === internalNode.id)[0];

      if (internalNode && !node) {

        const id = generateUniqueId();
        const frame = internalNode["id"];
        const label = internalNode["label"];
        const app_data = internalNode["data"]


        showProgress(true);

        fetch("/backend/savelayout", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: id, frame: frame, label: label, app: app_data }), // Serialize the object to JSON
        })
          .then(response => {
            showProgress(false);
            if (!response.ok) {
              window.postMessage({
                type: "fetchError",
                status: response.status,
                message: 'Save layout failed with status ' + response.status,
                url: "/backend/savelayout"
              });
              throw new Error("Network response was not ok");
            }
            return response.json(); // Parse the response JSON
          })
          .then(_ => {
            // Handle the response data here if needed
            updateSharedData({
              dragElement: {
                id: id, type: "a", label: label, parent: "history", "app": app_data, "frame": frame, layout: id
              }
            });
          })
          .catch(error => {
            console.error("There was a problem with the fetch operation:", error);
            updateSharedData({ dragElement: {} });
          });


      } else if (node) {
        node.data = { ...internalNode.data, ...node.data };
        updateSharedData({ dragElement: { ...node, "parent": id } });
      } else {
        updateSharedData({ dragElement: {} });
      }
    };

    if (container) {
      container.addEventListener('dragstart', handleDragStart);
    }

    return () => {
      if (container) {
        container.removeEventListener('dragstart', handleDragStart);
      }
    };


  }, [sharedData, internalNodes, nodes]);



  return (
    <div id={id} style={{ width: "100%", height: "100%" }}>
      <ProgressBar ref={progress} mode="indeterminate" style={{ height: "4px", marginTop: "-5px", marginBottom: "3px", visibility: "hidden" }}></ProgressBar>

      {/* Node Context menu */}
      <ContextMenu ref={cm} model={contextMenuItems} ></ContextMenu>

      <Button onClick={handleRefresh} icon="fa fa-sync" className='h-tree-reload' rounded />
      <Button onClick={handleClear} icon="fa fa-broom" className='h-tree-clear' rounded />
      {/* Main Tree View*/}
      <Tree value={internalNodes} ref={hist}


        selectionMode="single"

        dragdropScope={'dashpool'}
        onDragDrop={(e: TreeDragDropEvent) => {

          setInternalNodes(e.value);

          setTimeout(
            () => setProps({ nodeChangeEvent: findTreeViewNode(nodes, e.dragNode.id) }),
            100
          );

        }} filter filterMode="lenient" filterPlaceholder="Filter"


        onNodeDoubleClick={(ev) => {
          const node = findTreeViewNode(nodes, ev.node.id);
          if (node && ["a", "r", "p"].includes(node.type)) {
            setDashpoolEvent("open", node, setProps);
          }
        }}

        className='h-tree-reload'
      />

    </div>
  )
}

History.defaultProps = {
  n_refresh: 0,
  n_cleared: 0,
  nodes: []
};

export default History;
