import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

export default function Bank({ bankDialog, setBankDialog, btnBank, handleBankData }) {
    const apiEndPointGetBank = '/api/bank/get';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingBank, setLoadingBank] = useState(false);
    const [bankTabel, setBankTabel] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
    };

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    useEffect(() => {
        if (bankDialog && btnBank) {
            toggleBank();
        }
    }, [bankDialog, btnBank, lazyState]);

    const loadLazyData = async () => {
        setLoadingBank(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetBank
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetBank, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setBankTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingBank(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Bank >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerBank = (
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
    const toggleBank = async (event) => {
        setLoadingBank(true);
        // setBankDialog(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetBank
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetBank, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setBankTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingBank(false);
        }
        setLoadingBank(false);
    };
    const onRowSelectBank = (event) => {
        const selectedKode = event.data.KODE;
        const selectedBank = bankTabel.find((bank) => bank.KODE === selectedKode);
        handleBankData(selectedBank.KODE, selectedBank.KETERANGAN, selectedBank.ADMINISTRASI);
        setBankDialog(false);
    };

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Bank  */}
                <Dialog visible={bankDialog} header="Bank" modal className="p-fluid" onHide={() => setBankDialog(false)}>
                    <DataTable
                        size="small"
                        value={bankTabel}
                        lazy
                        dataKey="KODE"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loadingBank}
                        header={headerBank}
                        onRowSelect={onRowSelectBank}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}
