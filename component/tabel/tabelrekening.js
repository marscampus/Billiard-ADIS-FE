import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

export default function TableRekening({onValue,onEdit}){
    const dt = useRef(null);
    const [globalFilter, setGlobalFilter] = useState(null);

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-end md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded onClick={()=>{onEdit(rowData)}} className="mr-2"  />
                <Button icon="pi pi-trash" severity="warning" rounded  />
            </>
        );
    };

    return(
        <DataTable
            ref={dt}
            value={onValue}
            // selection={selectedProducts}
            // onSelectionChange={(e) => setSelectedProducts(e.value)}
            dataKey="id"
            paginator   
            rows={10}
            // rowsPerPageOptions={[5, 10, 25]}
            className="datatable-responsive"
            // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            // currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            globalFilter={globalFilter}
            emptyMessage="No products found."
            header={header}
            responsiveLayout="scroll"
        >
            <Column field='id' header='KODE' />
            <Column field='title' header='KETERANGAN' />
            <Column field='category' header='JENIS REKENING'/>
            <Column field='ACTION' header='ACTION' body={actionBodyTemplate}/>
        </DataTable>
    )
}