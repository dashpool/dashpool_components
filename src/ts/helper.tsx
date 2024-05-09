
import { TreeNode } from 'primereact/treenode';
import { FrameInfo, AppInfo } from './components/DashpoolProvider';



type TreeViewNode = {
    id: string;
    type: string;
    label: string;
    app?: any;
    shared?: string[];
    icon?: string;
    frame?: string;
    data?: any;
    parent?: string;
    layout?: string;
}


type DashpoolEvent = {
    timestamp: Number;
    type: string;
    data?: any;
}

const newDashpoolEvent = (type: string, data: any): DashpoolEvent => {
    return {
        timestamp: +new Date,
        type: type,
        data: data
    }
}

const setDashpoolEvent = (type: string, data: any, setProps: any) => {
    if (setProps) {
        setProps({ dashpoolEvent: newDashpoolEvent(type, data) });
    }
}


// Define icons for different types
const iconMapping: { [key: string]: string } = {
    a: 'far fa-window-maximize',
    p: 'fas fa-chart-line',
    r: 'far fa-file-powerpoint',
    s: 'far fa-user',
    f: 'far fa-folder',
    l: 'fas fa-border-all',
    d: ''
};

function findTreeNode(tree: TreeNode[], idToFind: string): { node: TreeNode, parent: string } | undefined {
    // Recursive function to search for the node with the specified ID
    function findNodeRecursive(nodes: TreeNode[], parent?: string): { node: TreeNode, parent: string } | undefined {
        for (const node of nodes) {
            if (node.id === idToFind) {

                return { node: node, parent: parent };
            }

            if (node.children.length > 0) {
                const foundNode = findNodeRecursive(node.children, node.id);
                if (foundNode) {
                    return foundNode;
                }
            }
        }

        return undefined;
    }

    // Call the recursive function starting from the root nodes
    for (const rootNode of tree) {
        const result = findNodeRecursive([rootNode]);
        if (result) {
            return result;
        }
    }

    return undefined; // Node with the specified ID not found
}



function findTreeViewNode(nodes: TreeViewNode[], idToFind: string): TreeViewNode | undefined {

    const matched = nodes.filter((el) => el.id == idToFind);
    if (matched.length > 0) {
        return matched[0];
    }
    return undefined;

}



function buildExplorerTree(treeViewNodes: TreeViewNode[]): TreeNode[] {
    const treeMap = new Map<string, TreeNode>();

    // Create the root node
    const rootNode: TreeNode = {
        id: 'h',
        key: 'h',
        label: 'Home',
        icon: 'fas fa-home',
        children: [],
        droppable: true,
        draggable: false,
    };

    // Create the shared folder node
    const sharedNode: TreeNode = {
        id: 's',
        key: 's',
        label: 'Shared',
        icon: 'fas fa-users',
        children: [],
        droppable: false,
        draggable: false,
    };

    const unprocessedNodes = [...treeViewNodes];

    let tries = 100;

    while (unprocessedNodes.length > 0 && tries > 0) {
        tries = tries - 1;
        for (let i = 0; i < unprocessedNodes.length; i++) {
            const node = unprocessedNodes[i];

            const node_style = (
                node.data?.shared_users?.length || node.data?.shared_groups?.length
            ) ? { color: "#f5681b", fontWeight: 500 } : {};


            const treeNode: TreeNode = {
                id: node.id,
                key: node.type + '-' + node.id,
                label: node.label,
                data: node.data,
                icon: iconMapping[node.type],
                children: [],
                droppable: node.type === 'f',
                draggable: true,
                style: node_style
            };

            // Check if the node has a parent
            if (node.parent && node.parent != "h") {
                // Find the parent TreeNode in the map
                const parentTreeNode = treeMap.get(node.parent);


                // Add the current node to the parent's children
                if (parentTreeNode) {
                    parentTreeNode.children.push(treeNode);
                    unprocessedNodes.splice(i, 1); // Remove the processed node
                    i--; // Decrement i to account for the removed node

                    // Store the TreeNode in the map
                    treeMap.set(node.id, treeNode);
                }
            } else {
                // If the node doesn't have a parent, it belongs to either sharedNode or rootNode
                if (node.type === 's') {
                    treeNode.droppable = false;
                    treeNode.draggable = false;
                    sharedNode.children.push(treeNode); // Add to sharedNode
                    unprocessedNodes.splice(i, 1); // Remove the processed node
                    i--; // Decrement i to account for the removed node

                    // Store the TreeNode in the map
                    treeMap.set(node.id, treeNode);
                } else {
                    rootNode.children.push(treeNode); // Add to rootNode
                    unprocessedNodes.splice(i, 1); // Remove the processed node
                    i--; // Decrement i to account for the removed node

                    // Store the TreeNode in the map
                    treeMap.set(node.id, treeNode);
                }
            }
        }
    }

    // Function to set droppable property recursively
    const setDroppableRecursively = (node: TreeNode) => {
        node.droppable = false;
        node.draggable = false;
        if (node.key[0] != "s") {
            node.key = "s-" + node.key;
        }
        node.children.forEach((childNode) => {
            setDroppableRecursively(childNode);
        });
    };

    // Set droppable property to false for all sharedNode elements
    sharedNode.children.forEach((childNode) => {
        setDroppableRecursively(childNode);
    });

    // Convert the Map to an array of root nodes
    const tree = [rootNode, sharedNode];

    return tree;
}



function buildHistoryTree(treeViewNodes: TreeViewNode[], frameInfo: FrameInfo[], appInfo: AppInfo[], hiddenFrames: string[]): TreeNode[] {
    const frameGroups: { [key: string]: TreeNode } = {};

    treeViewNodes.forEach((node) => {
        const frame = node.frame || 'NoFrame';
        const url = node.data.url;
        const baseurl = url.slice(0, url.lastIndexOf('/') + 1);

        let app_name = 'NoApp';
        let app_icon = 'fa-solid fa-cube';
        let app_data = {};

        const matchingFrameInfo = frameInfo.filter((el) => el.id === frame);
        const node_style = (matchingFrameInfo.length == 0) ? { color: "#a1a1a1", background: "#f5f5f5" } : {};

        // Check if the node contains app information
        if (node.app) {
            app_name = node.app.name || app_name;
            app_icon = node.app.icon || app_icon;
            app_data = node.app;
        } else {
            const matchingAppInfo = appInfo.filter((el) => el.url === baseurl);

            // Use matchingAppInfo if available
            if (matchingAppInfo.length > 0) {
                app_name = matchingAppInfo[0].name;
                app_icon = matchingAppInfo[0].icon;
            }
        }
        // Use matchingFrameInfo if available
        if (matchingFrameInfo.length > 0) {
            app_name = matchingFrameInfo[0].name;
            app_icon = matchingFrameInfo[0].icon;
        }

        if (!frameGroups[frame]) {
            frameGroups[frame] = {
                id: frame,
                key: frame,
                label: app_name,
                icon: app_icon,
                children: [],
                droppable: false,
                draggable: true,
                data: app_data,
                style: node_style
            };
        }

        const treeNode: TreeNode = {
            id: node.id,
            key: node.type + '-' + node.id,
            label: node.label,
            data: { ...app_data, ...node.data },
            icon: iconMapping[node.type],
            children: [],
            droppable: false,
            draggable: true
        };

        frameGroups[frame].children.push(treeNode);
    });

    // also add frames without nodes
    frameInfo.forEach((frame) => {
        if (!frameGroups[frame.id] && !hiddenFrames.includes(frame.id)) {

            try {
                const url = frame.url;
                const baseurl = url.slice(0, url.lastIndexOf('/') + 1);
                const matchingAppInfo = appInfo.filter((el) => el.url === baseurl);

                if (matchingAppInfo.length > 0) {
                    frameGroups[frame.id] = {
                        id: frame.id,
                        key: frame.id,
                        label: frame.name,
                        icon: frame.icon,
                        children: [],
                        droppable: false,
                        draggable: true,
                        data: matchingAppInfo[0],
                        style: { color: "#a1a1a1" }
                    };
                }
            } catch (e) {

            }
        }
    });

    return Object.values(frameGroups);
}




function findTargetElement(container: HTMLElement, target: HTMLElement, treeNodes: TreeNode[]): TreeNode | null {

    if (!target.classList.contains("p-treenode-content")) {
        target = target.parentElement;
    }

    function findElementRecursive(node: HTMLElement, tNodes: TreeNode[]): TreeNode | null {
        const children = Array.from(node.querySelectorAll(":scope > .p-treenode"));
        for (let idx = 0; idx < children.length; idx++) {
            const child = children[idx] as HTMLElement;
            const possible_target = child.children[0] as HTMLElement;

            if (possible_target === target) {
                return tNodes[idx];
            }

            const realChildren = Array.from(child.querySelectorAll(":scope > .p-treenode-children"));

            if (realChildren.length > 0 && tNodes[idx].children) {
                const nodeChildren = tNodes[idx].children;

                const result = findElementRecursive(realChildren[0] as HTMLElement, nodeChildren);
                if (result !== null) {
                    return result;
                }
            }
        }
        return null;
    }

    const startNode = container.querySelector(".p-tree-container") as HTMLElement;

    return findElementRecursive(startNode, treeNodes);
}


const generateUniqueId = () => {
    return new Date().getTime().toString(36) + Math.random().toString(36).substring(2);
};


export { newDashpoolEvent, setDashpoolEvent, TreeViewNode, DashpoolEvent, findTreeViewNode, buildExplorerTree, buildHistoryTree, findTargetElement, generateUniqueId, iconMapping, findTreeNode }