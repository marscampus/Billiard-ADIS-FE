import React, { useState, useEffect } from 'react';
import { Tree } from 'primereact/tree';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { NodeService } from '../../../demo/service/NodeService';

const TreeDemo = () => {
    const [treeNodes, setTreeNodes] = useState([]);
    const [selectedTreeNodeKeys, setSelectedTreeNodeKeys] = useState(null);
    const [treeTableNodes, setTreeTableNodes] = useState([]);
    const [selectedTreeTableNodeKeys, setSelectedTreeTableNodeKeys] = useState([]);

    useEffect(() => {
        const nodeService = new NodeService();
        nodeService.getTreeNodes().then((data) => setTreeNodes(data));
        nodeService.getTreeTableNodes().then((data) => setTreeTableNodes(data));
    }, []);

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Tree</h5>
                    <Tree value={treeNodes} selectionMode="checkbox" selectionKeys={selectedTreeNodeKeys} onSelectionChange={(e) => setSelectedTreeNodeKeys(e.value)} />
                </div>
            </div>
            <div className="col-12">
                <div className="card">
                    <h5>TreeTable</h5>
                    <TreeTable value={treeTableNodes} header="FileSystem" selectionMode="checkbox" selectionKeys={selectedTreeTableNodeKeys} onSelectionChange={(e) => setSelectedTreeTableNodeKeys(e.value)}>
                        <Column headerStyle={{ textAlign: "center" }} field="name" header="Name" expander />
                        <Column headerStyle={{ textAlign: "center" }} field="size" header="Size" />
                        <Column headerStyle={{ textAlign: "center" }} field="type" header="Type" />
                    </TreeTable>
                </div>
            </div>
        </div>
    );
};

export default TreeDemo;
