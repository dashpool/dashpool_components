import React from 'react';
import { useState } from "react";
import { useRef } from 'react';
import { useEffect } from 'react';
import { Tree, TreeDragDropEvent } from 'primereact/tree';
import { ContextMenu } from 'primereact/contextmenu';
import { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
import { useDashpoolData } from './DashpoolProvider';

import { setDashpoolEvent, DashpoolEvent, TreeViewNode, findTreeViewNode, buildHistoryTree, findTargetElement } from '../helper';



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

  let tree = buildHistoryTree(nodes);
  const [internalNodes, setInternalNodes] = useState(tree);

  const cm = useRef<ContextMenu>(null);
  const hist = useRef<Tree>(null);


  const [contextMenuItems, _setContextMenuItems] = useState<MenuItem[]>([]);


  const handleRefresh = () => {
    const newNRefreshed = nRefreshed + 1;
    setNRefreshed(newNRefreshed);

    // Use setProps to send the new value to Python
    if (setProps) {
      setProps({ n_refreshed: newNRefreshed });
    }
  };


  useEffect(() => {
    const container = hist.current.getElement();

    const handleDragStart = (ev: DragEvent) => {
      const target = ev.target as HTMLElement;

      const internalNode = findTargetElement(container, target, internalNodes);
      const node = nodes.filter((el) => el.id === internalNode.id)[0];
      if (node) {
        updateSharedData({ dragElement: { ...node, "parent": id } });
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
      {/* Node Context menu */}
      <ContextMenu ref={cm} model={contextMenuItems} ></ContextMenu>

      <Button onClick={handleRefresh} icon="fa fa-sync" className='p-tree-reload' rounded />
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

        className='p-tree-reload'
      />



    </div>

  )
}

History.defaultProps = {
  n_refresh: 0,
  nodes: []
};

export default History;
