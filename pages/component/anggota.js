import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import postData from '../../lib/Axios';

export default function Anggota({ anggotaDialog, setAnggotaDialog, handleAnggotaData }) {
    const apiEndPointGetAnggota = '/api/anggota/get';

    const searchTimer = useRef(null)
    const [anggotaTabel, setAnggotaTabel] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingAnggota, setLoadingAnggota] = useState(false);
    const [defaultOption, setDefaultOption] = useState({ name: 'nama', label: 'nama' });
    const [searchValue, setSearchValue] = useState('');
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 5,
        page: 1,
        sortField: null,
        sortOrder: null,
        searchField: 'nama',
        searchValue: ''
    });

    // Load data function
    const loadAnggota = useCallback(async (state) => {
        if (!anggotaDialog) return;

        setLoadingAnggota(true);
        try {
            const params = {
                page: state.page,
                per_page: state.rows,
                sort_field: state.sortField,
                sort_order: state.sortOrder,
                search_field: state.searchField,
                search_value: state.searchValue
            };

            const response = await postData(apiEndPointGetAnggota, params);
            const json = response.data;

            setAnggotaTabel(json.data || []);
            setTotalRecords(json.total || 0);
            setLazyState(state);
        } catch (error) {
            console.error('Error:', error);
            setAnggotaTabel([]);
            setTotalRecords(0);
        } finally {
            setLoadingAnggota(false);
        }
    }, [anggotaDialog, apiEndPointGetAnggota]);

    // Handle page change
    const onPage = (event) => {
        const newState = {
            ...lazyState,
            first: event.first,
            rows: event.rows,
            page: Math.floor(event.first / event.rows) + 1
        };
        loadAnggota(newState);
    };

    const handleSearch = (value) => {
        setSearchValue(value);
    };


    // Handle dropdown change
    const handleDropdownChange = (e) => {
        const newOption = e.value;
        setDefaultOption(newOption);

        const newState = {
            ...lazyState,
            first: 0,
            page: 1,
            searchField: newOption.name,
            searchValue: searchValue
        };
        loadAnggota(newState);
    };

    // Load data when dialog opens
    useEffect(() => {
        if (anggotaDialog) {
            const initialState = {
                first: 0,
                rows: 10,
                page: 1,
                sortField: null,
                sortOrder: null,
                searchField: 'nama',
                searchValue: ''
            };
            setSearchValue('');
            loadAnggota(initialState);
        }
    }, [anggotaDialog, loadAnggota]);

    // Handle row selection
    const onRowSelectAnggota = (event) => {
        handleAnggotaData(event.data);
        setAnggotaDialog(false);
    };

    const dropdownOptions = [
        { name: 'kode', label: 'Kode' },
        { name: 'nama', label: 'Nama' },
        { name: 'telepon', label: 'Telepon' }
    ];

    const headerAnggota = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
            <div className="flex flex-column md:flex-row md:align-items-center gap-2">
                <Dropdown
                    value={defaultOption}
                    onChange={handleDropdownChange}
                    options={dropdownOptions}
                    optionLabel="label"
                    placeholder="Pilih Kolom"
                    className="w-full md:w-10rem"
                />
                <span className="p-inputgroup w-full md:w-auto">
                    <InputText
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Cari..."
                        className="w-full"
                    />
                    <Button className="pi pi-search" onClick={() => {
                        const newState = {
                            ...lazyState,
                            first: 0,
                            page: 1,
                            searchField: defaultOption.name,
                            searchValue: searchValue
                        };

                        loadAnggota(newState);
                    }} />
                </span>
            </div>
        </div>
    );

    return (
        <Dialog
            visible={anggotaDialog}
            header="Data Anggota"
            modal
            className="p-fluid"
            style={{ width: '80vw' }}
            onHide={() => setAnggotaDialog(false)}
        >
            <DataTable
                value={anggotaTabel}
                lazy
                filterDisplay="menu"
                dataKey="kode"
                paginator
                first={lazyState.first}
                rows={lazyState.rows}
                totalRecords={totalRecords}
                onPage={onPage}
                loading={loadingAnggota}
                header={headerAnggota}
                emptyMessage="Tidak ada data ditemukan"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
                rowsPerPageOptions={[5, 10, 20, 50]}
                selectionMode="single"
                onRowSelect={onRowSelectAnggota}
                metaKeySelection={false}
            >
                <Column field="kode" header="Kode" sortable style={{ minWidth: '100px' }} />
                <Column field="nama" header="Nama" sortable style={{ minWidth: '200px' }} />
                <Column field="telepon" header="Telepon" sortable style={{ minWidth: '150px' }} />
            </DataTable>
        </Dialog>
    );
}