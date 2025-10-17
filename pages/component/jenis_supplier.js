import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

export default function Supplier({ supplierDialog, setSupplierDialog, btnSupplier, handleSupplierData }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetSupplier = '/api/jenis_supplier/get';

    const [totalRecords, setTotalRecords] = useState(0);
    const [search, setSearch] = useState('');
    const [loadingSupplier, setLoadingSupplier] = useState(false);
    const [supplierTabel, setSupplierTabel] = useState([]);
    const [supplierTabelFilt, setSupplierTabelFilt] = useState([]);
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
        if (supplierDialog && btnSupplier) {
            toggleSupplier();
        }
    }, [supplierDialog, btnSupplier, lazyState]);

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const [timer, setTimer] = useState(null);
    // const inputChanged = (e) => {
    //     clearTimeout(timer);

    //     const newTimer = setTimeout(() => {
    //         let _lazyState = { ...lazyState };
    //         console.log('_lazyState[]', _lazyState['filters']);

    //         _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
    //         // if (selectedSesi) {
    //         //     // Add selectedSesi to filters if available
    //         //     _lazyState.filters["selectedSesi"] = selectedSesi;
    //         // }
    //         if (defaultOption != null && defaultOption.name != null) {
    //             _lazyState['filters'][defaultOption.name] = e;
    //         }
    //         onPage(_lazyState);
    //     }, 500);

    //     setTimer(newTimer);
    // };

    useEffect(() => {
        setSupplierTabelFilt(supplierTabel);
    }, [supplierTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = supplierTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KODE_TOKO) || x.test(d.NAMA) || x.test(d.Penerimaan) || x.test(d.Pengeluaran) || x.test(d.Keterangan) : []));
            setSearch(searchVal);
        }

        setSupplierTabelFilt(filtered);
    };
    const headerSupplier = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp; */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );
    const toggleSupplier = async (event) => {
        setLoadingSupplier(true);
        // setSupplierDialog(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetSupplier
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetSupplier, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setSupplierTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingSupplier(false);
        }
        setLoadingSupplier(false);
    };
    const onRowSelectSupplier = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSupplier = supplierTabel.find((supplier) => supplier.KODE === selectedKode);
        handleSupplierData(selectedSupplier.KODE, selectedSupplier.KETERANGAN, selectedSupplier.ALAMAT);
        setSupplierDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Supplier  */}
                <Dialog visible={supplierDialog} header="Supplier" modal className="p-fluid" onHide={() => setSupplierDialog(false)}>
                    <DataTable
                        size="small"
                        value={supplierTabelFilt}
                        lazy
                        dataKey="KODE"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loadingSupplier}
                        header={headerSupplier}
                        onRowSelect={onRowSelectSupplier}
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
