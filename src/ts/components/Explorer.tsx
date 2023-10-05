import React from 'react';
import { useState } from "react";
import { useRef } from 'react';
import { useEffect } from 'react';

import { Tree, TreeDragDropEvent } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';

import { ContextMenu } from 'primereact/contextmenu';
import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

import { useDashpoolData } from './DashpoolProvider';
import { setDashpoolEvent, DashpoolEvent, TreeViewNode, findTreeViewNode, buildExplorerTree, findTargetElement, generateUniqueId, findTreeNode } from '../helper';



type ExplorerProps = {
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
   * Event if a Tree Node changes
   */
  nodeChangeEvent?: TreeViewNode;

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
 * A component to mimic a file explorer
 */
const Explorer = (props: ExplorerProps) => {
  const { id, nodes, setProps } = props;
  const { sharedData, updateSharedData } = useDashpoolData();

  const [nRefreshed, setNRefreshed] = useState(props.n_refreshed || 0);

  let tree = buildExplorerTree(nodes);
  const [internalNodes, setInternalNodes] = useState(tree);

  const cm = useRef<ContextMenu>(null);
  const explorer = useRef<Tree>(null);

  const [contextMenuItems, _setContextMenuItems] = useState<MenuItem[]>([]);


  useEffect(() => {
    setInternalNodes(buildExplorerTree(nodes));
  }, [props.nodes])

  const handleRefresh = () => {
    const newNRefreshed = nRefreshed + 1;
    setNRefreshed(newNRefreshed);

    // Use setProps to send the new value to Python
    if (setProps) {
      setProps({ n_refreshed: newNRefreshed });
    }
  };



  const deleteNode = (nodeToDelete: TreeNode) => {
    // Function to recursively find and delete the node

    const newNodes = nodes.filter((el) => el.id !== nodeToDelete.id);

    const findAndDeleteNode = (currentNode: TreeNode) => {
      if (currentNode.children) {
        // Recursively check children
        currentNode.children = currentNode.children.filter(childNode => {
          if (childNode.key === nodeToDelete.key) {
            setTimeout(
              () => setProps({
                nodeChangeEvent: { id: childNode.id, parent: "trash" },
                nodes: newNodes
              }),
              100
            );
            return false; // Remove the node
          }
          findAndDeleteNode(childNode); // Recursively check children of children
          return true; // Keep the node
        });
      }
    };

    // Clone the existing nodes array to avoid mutating the state directly
    const updatedNodes = [...internalNodes];

    // Find and delete the node
    findAndDeleteNode(updatedNodes[0]); // Only delete your own components in home

    // Update the state with the modified nodes array
    setInternalNodes(updatedNodes);
  };


  const updateNodeLabel = (key: string, label: string) => {
    // Function to recursively find and update the node

    const findAndUpdateNode = (currentNode: TreeNode) => {
      if (currentNode.key === key) {
        // Update the node value
        currentNode.label = label;



        setTimeout(
          () => {
            let node = findTreeViewNode(nodes, currentNode.id);
            node.label = label;

            setProps({ nodeChangeEvent: findTreeViewNode(nodes, currentNode.id) });
          },
          100
        );

      }

      if (currentNode.children) {
        // Recursively check children
        currentNode.children.forEach(childNode => {
          findAndUpdateNode(childNode); // Recursively check children of children
        });
      }
    };

    // Clone the existing nodes array to avoid mutating the state directly
    const updatedNodes = [...internalNodes];

    // Find and update the node
    findAndUpdateNode(updatedNodes[0]); // Only update your own components in home



    // Update the state with the modified nodes array
    setInternalNodes(updatedNodes);
  };




  const setContextMenu = (node: TreeNode): boolean => {
    const key = node.key.toString();

    const inputNode = findTreeViewNode(nodes, node.id);

    if (key === "s") {
      // home node
      return false;
    }

    let output: MenuItem[] = [];
    if (key.startsWith("a") || key.startsWith("p") || key.startsWith("r")) {
      output.push({ label: 'Open', icon: 'fas fa-box-open', command: (e) =>  setDashpoolEvent("open", inputNode, setProps) });
    }

    if (!key.startsWith("s") && !key.startsWith("h")) {
      output.push({ label: 'Share', icon: 'fas fa-share-alt' });
      output.push({ separator: true })
    }


    if (!key.startsWith("s") && !key.startsWith("h")) {
      output.push({ label: 'Rename', icon: 'fas fa-edit', command: (e) => openRenameModal(node) });
      output.push({ label: 'Delete', icon: 'fas fa-trash', command: (e) => deleteNode(node) });
    }

    if (key.startsWith("f") || key.startsWith("h")) {
      output.push({ label: 'New Folder', icon: 'fas fa-folder-plus', command: (e) => openCreateFolderModal(node) });
    }

    _setContextMenuItems(output);
    return output.length > 0;
  }


  //Rename Modal
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [newLabel, setNewLabel] = useState<string>("");

  const openRenameModal = (node: MenuItem) => {
    setSelectedNode(node);
    setNewLabel(node.label);
    setRenameModalVisible(true);
  };

  // Function to handle renaming and close the modal
  const handleRename = () => {
    // Your logic to update the label of the selectedNode
    // For example: selectedNode.label = newName;
    updateNodeLabel(selectedNode.key, newLabel);


    setRenameModalVisible(false);
  };

  // Function to close the modal without renaming
  const cancelRename = () => {
    setRenameModalVisible(false);
  };


  // Create Folder Modal
  const [isCreateFolderModalVisible, setCreateFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Function to open the Create Folder Modal
  const openCreateFolderModal = (node: MenuItem) => {
    setSelectedNode(node);
    setNewFolderName('');
    setCreateFolderModalVisible(true);
  };

  // Function to handle folder creation and close the modal



  const handleCreateFolder = () => {

    let id = generateUniqueId();

    let newFolder: TreeNode = {
      children: [],
      data: undefined,
      draggable: true,
      droppable: true,
      icon: "far fa-folder",
      id: id,
      key: "f-" + id,
      label: newFolderName,
    }
    selectedNode.children.push(newFolder)

    let newFolderNode: TreeViewNode = {
      parent: selectedNode.id,
      type: "f",
      id: id,
      label: newFolderName
    }
    nodes.push(newFolderNode);

    // Close the modal
    setCreateFolderModalVisible(false);

    setTimeout(
      () => setProps({ nodeChangeEvent: newFolderNode }),
      100
    );
  };

  // Function to close the modal without creating a folder
  const cancelCreateFolder = () => {
    setCreateFolderModalVisible(false);
  };





  useEffect(() => {

    const container = explorer.current.getElement();

    const handleDragStart = (ev: DragEvent) => {
      const target = ev.target as HTMLElement;

      const internalNode = findTargetElement(container, target, internalNodes);
      const node = nodes.filter((el) => el.id === internalNode.id)[0];
      if (node) {
        updateSharedData({ dragElement: { ...node, "parent": id } });
      }
    };

    const handleDrop = (ev: DragEvent) => {

      if (sharedData && sharedData.dragElement && sharedData.dragElement.parent != id) {

        const element = sharedData.dragElement;
        // Handle the drop event here

        const target = ev.target as HTMLElement;
        const res = findTargetElement(container, target, internalNodes);

        let id = generateUniqueId();
        let key = element.type + "-" + id;

        let newNode = { ...element, id: id, parent: res.id };
        nodes.push(newNode);
        let newInternalNodes = buildExplorerTree(nodes);
        setInternalNodes(newInternalNodes);
        setSelectedKey(res.key);


        setTimeout(
          () => {
            setSelectedKey(key);
            setProps({ nodeChangeEvent: findTreeViewNode(nodes, id) });
          },
          100
        );

        setTimeout(
          () => {
            setSelectedKey(null);
          },
          1000
        );

        ev.preventDefault();
        ev.stopPropagation();
      }

    };



    if (container) {
      container.addEventListener('drop', handleDrop);
      container.addEventListener('dragstart', handleDragStart);
    }

    return () => {
      if (container) {
        container.removeEventListener('drop', handleDrop);
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
      <Tree value={internalNodes} dragdropScope={'dashpool'} ref={explorer}
        className='p-tree-reload'


        onNodeDoubleClick={(ev) => {
          const node = findTreeViewNode(nodes, ev.node.id);
          if (node && ["a", "r", "p"].includes(node.type)) {
            setDashpoolEvent("open", node, setProps);
          }
        }}

        selectionMode="single"
        selectionKeys={selectedKey}
        onSelectionChange={(e) => {
          const filteredNodes = nodes.filter((n) => n.type + "-" + n.id == e.value);
          if (filteredNodes.length > 0) { setSelectedNode(filteredNodes[0]) }
        }}


        onDragDrop={(e: TreeDragDropEvent) => {

          setInternalNodes(e.value);

          const { parent } = findTreeNode(e.value, e.dragNode.id);
          let node = findTreeViewNode(nodes, e.dragNode.id);
          node.parent = parent;

          setTimeout(
            () => {
              setProps({ nodeChangeEvent: findTreeViewNode(nodes, e.dragNode.id) });
            },
            100
          );

        }}
        filter
        filterMode="lenient"
        filterPlaceholder="Filter"
        onContextMenu={(e) => {
          e.originalEvent.preventDefault();
          if (setContextMenu(e.node)) {
            e.originalEvent.persist();
            cm.current.show(e.originalEvent);
          }
        }}
      />



      {/* Rename Modal */}
      <Dialog
        visible={isRenameModalVisible}
        onHide={cancelRename}
        header="Rename"
        modal
        footer={
          <div>
            <Button onClick={handleRename} className="p-button-primary">
              Rename
            </Button>
            <Button onClick={cancelRename} className="p-button-secondary">
              Cancel
            </Button>
          </div>
        }
      >
        <InputText
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
      </Dialog>


      {/* Create Folder Modal */}
      <Dialog
        visible={isCreateFolderModalVisible}
        onHide={cancelCreateFolder}
        header="Create New Folder"
        modal
        footer={
          <div>
            <Button onClick={handleCreateFolder} className="p-button-primary">
              Create
            </Button>
            <Button onClick={cancelCreateFolder} className="p-button-secondary">
              Cancel
            </Button>
          </div>
        }
      >
        <InputText
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Enter folder name"
        />
      </Dialog>



    </div>

  )
}

Explorer.defaultProps = {};

export default Explorer;
