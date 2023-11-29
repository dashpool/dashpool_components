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
import { MultiSelect } from 'primereact/multiselect';
import { SelectItem } from 'primereact/selectitem';
import { ProgressBar } from 'primereact/progressbar';


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

  const progress = useRef<ProgressBar>(null);

  const [contextMenuItems, _setContextMenuItems] = useState<MenuItem[]>([]);


  const showProgress = (show: boolean) => {
    const visibility = show ? "visible" : "hidden";
    const element = progress.current?.getElement();
    if (element) {
      element.style.setProperty("visibility", visibility);
    }
  }

  useEffect(() => {
    showProgress(false);
    setInternalNodes(buildExplorerTree(nodes));
  }, [props.nodes])

  const handleRefresh = () => {
    showProgress(true);
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


        let node = findTreeViewNode(nodes, currentNode.id);
        node.label = label;

        const new_event = { nodeChangeEvent: { id: currentNode.id, label: label } };

        setTimeout(() => {
          props.setProps(new_event)
        }, 100);

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



  const updateNodeSharing = (key: string, users: string[], groups: string[]) => {
    // Function to recursively find and update the node

    const findAndUpdateNode = (currentNode: TreeNode) => {
      if (currentNode.key === key) {
        // Update the node value

        currentNode.data = currentNode.data ?? {};
        currentNode.data["shared_users"] = users;
        currentNode.data["shared_groups"] = groups;

        const node_style = (
          currentNode.data?.shared_users?.length || currentNode.data?.shared_groups?.length
        ) ? { color: "#f5681b", fontWeight: 500 } : {};

        currentNode.style = node_style;


        let node = findTreeViewNode(nodes, currentNode.id);
        node.data = node.data ?? {};
        node.data["shared_users"] = users;
        node.data["shared_groups"] = groups;

        const new_event = { nodeChangeEvent: { id: currentNode.id, shared_groups: groups, shared_users: users } };

        setTimeout(() => {
          props.setProps(new_event)
        }, 100);

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
      output.push({ label: 'Open', icon: 'fas fa-box-open', command: (e) => setDashpoolEvent("open", inputNode, setProps) });
    }

    if (!key.startsWith("s") && !key.startsWith("h")) {
      output.push({ label: 'Share', icon: 'fas fa-share-alt', command: (e) => openSharingModal(node) });
      output.push({ separator: true })
    }


    if (!key.startsWith("s") && !key.startsWith("h")) {
      output.push({ label: 'Rename', icon: 'fas fa-edit', command: (e) => openRenameModal(node) });
    }

    if (!key.startsWith("s") && !key.startsWith("h") && !key.startsWith("f")) {
      output.push({
        label: 'Duplicate', icon: 'fas fa-copy', command: (e) => {
          const newNode = duplicateNode(node);
          openRenameModal(newNode)
        }
      });
    }

    if (!key.startsWith("s") && !key.startsWith("h")) {
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


  // duplicate Node

  // Function to handle folder creation and close the modal
  // returns the new node
  const duplicateNode = (inNode: TreeNode): TreeNode =>   {

    console.log(inNode);

    let oldid = inNode.id;
    let id = generateUniqueId();

    let baseNode = nodes.filter(n => n.id == oldid)[0];


    let newTreeViewNode: TreeViewNode = {
      ...baseNode, id: id
    }
    nodes.push(newTreeViewNode);


    let newInternalNodes = buildExplorerTree(nodes);
    setInternalNodes(newInternalNodes);

    setTimeout(
      () => setProps({ nodeChangeEvent: newTreeViewNode }),
      100
    );

    const {node: newTreeNode} = findTreeNode(newInternalNodes, id);
    return newTreeNode;
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



  // START sharing modal stuff

  const [isSharingModalVisible, setSharingModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [optionsUsers, setOptionsUsers] = useState<SelectItem[]>([]);
  const [optionsGroups, setOptionsGroups] = useState<SelectItem[]>([]);

  // Function to open the sharing modal and set the selected node
  const openSharingModal = (node: MenuItem) => {
    setSelectedNode(node);

    const sharedUsers = node.data?.shared_users || [];
    const sharedGroups = node.data?.shared_groups || [];
    const oUsers: SelectItem[] = sharedData.users.map((user) => ({
      label: user,
      value: user
    }));
    const oGroups: SelectItem[] = sharedData.groups.map((group) => ({
      label: group.name,
      value: group.id
    }));

    // Set the selected users and groups in the state
    setSelectedUsers(sharedUsers);
    setSelectedGroups(sharedGroups);
    setOptionsUsers(oUsers);
    setOptionsGroups(oGroups);

    setSharingModalVisible(true);
  };

  // Function to close the sharing modal
  const closeSharingModal = () => {
    setSharingModalVisible(false);
  };


  // Function to handle saving the shared data
  const handleSaveSharing = () => {
    // Update the selectedNode with the selectedUsers and selectedGroups
    updateNodeSharing(selectedNode.key,
      selectedUsers,
      selectedGroups)

    // Close the sharing modal
    closeSharingModal();
  };

  // END sharing modal stuff



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

      if (sharedData && sharedData.dragElement && sharedData.dragElement.parent != id && sharedData.dragElement.id) {

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

  
  const handleKeyDown = (event) => {
    if (event.key === 'Delete' && selectedKey !== null) {
      // Delete the selected node
      const { node } = findTreeNode(internalNodes, selectedKey.split("-")[1]);
      deleteNode(node);
      setSelectedKey(null);
    }
  };



  return (
    <div id={id} style={{ width: "100%", height: "100%" }} onKeyDown={handleKeyDown}>
      <ProgressBar ref={progress} mode="indeterminate" style={{ height: "4px", marginTop: "-5px", marginBottom: "3px", visibility: "hidden" }}></ProgressBar>

      {/* Node Context menu */}
      <ContextMenu ref={cm} model={contextMenuItems} ></ContextMenu>

      <Button onClick={handleRefresh} icon="fa fa-sync" className='e-tree-reload' rounded />
      {/* Main Tree View*/}
      <Tree value={internalNodes} dragdropScope={'dashpool'} ref={explorer}
        className='e-tree-reload'

       
        

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
          setSelectedKey(e.value);
          if (filteredNodes.length > 0) { setSelectedNode(filteredNodes[0]) }
        }}


        onDragDrop={(e: TreeDragDropEvent) => {

          setInternalNodes(e.value);

          const { parent } = findTreeNode(e.value, e.dragNode.id);
          let node = findTreeViewNode(nodes, e.dragNode.id);
          node.parent = parent;


          const new_event = { nodeChangeEvent: { id: node.id, parent: parent } };

          setTimeout(() => {
            props.setProps(new_event)
          }, 100);


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
        style={{ width: '500px' }}
        visible={isRenameModalVisible}
        onHide={cancelRename}
        header="Rename"
        modal
        footer={
          <div style={{ marginRight: "-8px" }}>
            <Button onClick={cancelRename} className="p-button-secondary">
              Cancel
            </Button>
            <Button onClick={handleRename} className="p-button-primary">
              Rename
            </Button>
          </div>
        }
      >
        <p>New name:</p>
        <InputText
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className='w-100'
        />
      </Dialog>


      {/* Create Folder Modal */}
      <Dialog
        style={{ width: '500px' }}
        visible={isCreateFolderModalVisible}
        onHide={cancelCreateFolder}
        header="Create New Folder"
        modal
        footer={
          <div style={{ marginRight: "-8px" }}>
            <Button onClick={cancelCreateFolder} className="p-button-secondary">
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} className="p-button-primary">
              Create
            </Button>
          </div>
        }
      >
        <p>New folder name:</p>
        <InputText
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Enter here"
          className='w-100'
        />
      </Dialog>


      {/* Share Modal */}
      <Dialog
        style={{ width: '500px' }}
        visible={isSharingModalVisible}
        onHide={closeSharingModal}
        header={"Share " + selectedNode?.label}
        modal
        footer={
          <div style={{ marginRight: "-8px" }}>
            <Button onClick={closeSharingModal} className="p-button-secondary">
              Cancel
            </Button>          
            <Button onClick={handleSaveSharing} className="p-button-primary">
              Save
            </Button>
          </div>
        }
      >
        {/* MultiSelect for selecting users */}
        <div className="p-field">
          <label htmlFor="users" className='w-100'>Users</label>
          <MultiSelect
            id="users"
            options={optionsUsers}
            value={selectedUsers}
            onChange={(e) => setSelectedUsers(e.value)}
            filter
            placeholder="Select Users"
            className='w-100'
            maxSelectedLabels={3}
          />
        </div>

        {/* MultiSelect for selecting groups */}
        <div className="p-field mt-3">
          <label htmlFor="groups" className='w-100'>Groups</label>
          <MultiSelect
            id="groups"
            options={optionsGroups}
            value={selectedGroups}
            onChange={(e) => setSelectedGroups(e.value)}
            filter
            placeholder="Select Groups"
            className="w-100"
            maxSelectedLabels={3}
          />
        </div>


      </Dialog>


    </div>

  )
}

Explorer.defaultProps = {};

export default Explorer;
