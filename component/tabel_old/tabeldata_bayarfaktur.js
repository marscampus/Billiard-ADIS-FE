
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export default function TabelData({ onValue, onTotalRecords, onKlik, onLoading, onLazyState, onColumn, onPages, setRekeningDialog, handleRekeningData }) {
    const [globalFilter, setGlobalFilter] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);

    const onPage = (event) => {
        onPages(event);
    }

    const dropdownValues = [
        { name: "KODE", label: "KODE" },
        { name: "KETERANGAN", label: "KETERANGAN" },
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };

            _lazyState["filters"] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState["filters"][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const onSearch = (e) => {
        let _lazyState = { ...onLazyState };
        _lazyState['filters']['search'] = e;
        onPage(_lazyState);
    }
    const onRowSelectRekening = (event) => {
        const selectedKode = event.data.KODE;
        const selectedRekening = onValue.find((rekening) => rekening.KODE === selectedKode);
        // return;
        handleRekeningData(selectedRekening.KODE, selectedRekening.KETERANGAN);
        setRekeningDialog(false);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    return (
        <DataTable
            value={onValue}
            lazy
            dataKey="KODE"
            paginator
            size='small'
            rows={10}
            className="datatable-responsive"
            first={onLazyState.first}
            totalRecords={onTotalRecords}
            onPage={onPage}
            loading={onLoading}
            filters={onLazyState.filters}
            // header={header}
            selectionMode="single"
            onRowSelect={onRowSelectRekening}
        >
            {onColumn.map((col, i) => (
                <Column headerStyle={{ textAlign: "center" }} field={col.field} header={col.header} key={i}></Column>
            ))}

        </DataTable>
    )
}
