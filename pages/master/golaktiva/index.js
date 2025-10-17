/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Tue Mar 26 2024 - 03:36:42
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import axios from 'axios';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import { ProgressSpinner } from 'primereact/progressspinner';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';
import jsPDF from 'jspdf';
import { getEmail, getUserName } from '../../../component/GeneralFunction/GeneralFunction';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
// modified by aradhea
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
};

export default function GolonganAktiva() {
    //hubungan dengan path api disini
    const apiDirPath = '/api/_apibase_crud/';
    //create
    const apiEndPointStore = '/api/golonganaktiva/store';
    //read
    const apiEndPointGet = '/api/golonganaktiva/get';
    //update
    const apiEndPointUpdate = '/api/golonganaktiva/update';
    //delete
    const apiEndPointDelete = '/api/golonganaktiva/delete';
    //helper table
    const apiDirPathHelper = '/api/_apibase_helper/';
    const apiEndPointGetRekening = '/api/rekening/get_rekening';

    let emptygolonganaktiva = {
        Kode: null,
        Keterangan: null,
        RekeningDebet: null,
        RekeningKredit: null
    };

    const toast = useRef(null);
    const dt = useRef(null);
    const [golonganaktivaDialog, setgolonganaktivaDialog] = useState(false);
    const [deleteGolonganAktivaDialog, setDeleteGolonganAktivaDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [golonganaktiva, setGolonganAktiva] = useState(emptygolonganaktiva);
    const [defaultOption, setDropdownValue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [golonganaktivaTabel, setGolonganAktivaTabel] = useState(null);
    const [golonganaktivaTabelFilt, setGolonganAktivaTabelFilt] = useState(null);
    const [golonganaktivaTabelCopy, setGolonganAktivaTabelCopy] = useState(null);
    const [satuanTabel, setSatuanTabel] = useState(null);
    const [rekening1, setRekening1] = useState(null);
    const [rekening2, setRekening2] = useState(null);
    const [rekening3, setRekening3] = useState(null);
    const [rekening4, setRekening4] = useState(null);
    const [rekening5, setRekening5] = useState(null);
    const [rekening6, setRekening6] = useState(null);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    // PDF
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [rekeningDebetDialog, setRekeningDebetDialog] = useState(false);
    const [rekeningKreditDialog, setRekeningKreditDialog] = useState(false);
    const [statusAction, setStatusAction] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [lazyStateRekening, setlazyStateRekening] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [rekeningTable, setRekeningTable] = useState([]);
    const [activeFormField, setActiveFormField] = useState(null);
    const [activeIndexRekening, setActiveIndexRekening] = useState(0);
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field: 'Kode', header: 'Kode' },
        { field: 'Keterangan', header: 'Keterangan' },
        { field: 'Jenis', header: 'Jenis' }
    ];

    const dropdownValues = [
        { name: 'Kode', label: 'Kode' },
        { name: 'Keterangan', label: 'Keterangan' },
        { name: 'RekeningDebet', label: 'Rekening Debet' },
        { name: 'RekeningKredit', label: 'Rekening Kredit' }
    ];

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    //filter helper rekening
    const [globalFilter, setGlobalFilter] = useState('');
    const onFilterInput = (event) => {
        setGlobalFilter(event.target.value);
    };
    const clearFilter = () => {
        setGlobalFilter('');
    };
    const filterOptions = {
        global: { value: globalFilter, matchMode: 'contains' }
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const openNew = () => {
        setGolonganAktiva(emptygolonganaktiva);
        setSubmitted(false);
        setgolonganaktivaDialog(true);
        setStatusAction('store');
    };

    const hideDialog = () => {
        setSubmitted(false);
        setgolonganaktivaDialog(false);
    };

    const hideDeleteGolonganAktivaDialog = () => {
        setDeleteGolonganAktivaDialog(false);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _golonganaktiva = { ...golonganaktiva };
        _golonganaktiva[`${name}`] = val;

        setGolonganAktiva(_golonganaktiva);
    };

    const saveGolonganAktiva = async (e) => {
        let _golAktiva = { ...golonganaktiva };
        try {
            let endPoint;
            if (statusAction === 'update') {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const response = await postData(endPoint, _golAktiva);
            showSuccess(response.data?.message || 'Transaksi Berhasil');
            refreshTabel();
            setgolonganaktivaDialog(false);
        } catch (error) {
            showError(error.response?.data?.message || error?.message || 'Terjadi Kesalahan');
        }
    };

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    useEffect(() => {
        setGolonganAktivaTabelFilt(golonganaktivaTabel);
    }, [golonganaktivaTabel, lazyState]);

    const editGolonganAktiva = (golonganaktiva) => {
        setGolonganAktiva({ ...golonganaktiva });
        setgolonganaktivaDialog(true);
        setStatusAction('update');
    };

    const confirmDeleteGolonganAktiva = (golonganaktiva) => {
        setGolonganAktiva(golonganaktiva);
        setDeleteGolonganAktivaDialog(true);
    };

    const deleteGolonganAktiva = async () => {
        try {
            const response = await postData(apiEndPointDelete, { Kode: golonganaktiva.Kode });
            showSuccess(response.data?.message || 'Transaksi Berhasil');
            setGolonganAktiva(emptygolonganaktiva);
            setDeleteGolonganAktivaDialog(false);
            refreshTabel();
        } catch (error) {
            showError(error.response?.data?.message || error?.message || 'Terjadi Kesalahan');
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Add" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                </div>
            </React.Fragment>
        );
    };

    const golonganaktivaDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveGolonganAktiva} />
        </>
    );

    const deleteGolonganAktivaDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteGolonganAktivaDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteGolonganAktiva} />
        </>
    );

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editGolonganAktiva(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteGolonganAktiva(rowData)} />
            </>
        );
    };

    //##################################################################################################################################################################

    const bodyJenisRekening = (rowData) => {
        return <span>{rowData.Jenis == 'I' ? 'Induk' : 'Detail'}</span>;
    };
    //--------------------------------------------------------------------------< Combobox Rekening Debet >

    //--------------------------------------------------------------------------< Combobox Rekening Kredit >

    //##################################################################################################################################################################

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGet, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setGolonganAktivaTabel(json.data);
        } catch (error) {
            showError(error.response?.data?.message || error?.message || 'Terjadi Kesalahan');
        }
        setLoading(false);
    };

    const [inputValue, setInputValue] = useState('');
    const [timer, setTimer] = useState(null);

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    {/* <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                 <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                 <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh}/> */}
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = golonganaktivaTabel.filter((d) => (x ? x.test(d.Kode) || x.test(d.Keterangan) || x.test(d.RekeningDebet) || x.test(d.RekeningKredit) : []));
            setSearch(searchVal);
        }

        setGolonganAktivaTabelFilt(filtered);
    };

    // const filterDataByType = (type) => {
    //     return rekeningTable.filter((item) => {
    //         // Ambil angka pertama dari KODE
    //         const firstDigit = parseInt(item.KODE.charAt(0));
    //         // Cocokkan dengan jenis aset
    //         return firstDigit === type;
    //     });
    // };

    const [searchText, setSearchText] = useState('');
    const [selectedColumn, setSelectedColumn] = useState({ name: 'KODE', label: 'Kode' });
    const dropdownValuesRekening = [
        { name: 'KODE', label: 'Kode' },
        { name: 'KETERANGAN', label: 'Keterangan' },
        { name: 'JENISREKENING', label: 'Jenis Rekening' }
    ];

    // const headerRekening = (
    //     <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
    //         <h5 className="m-0"></h5>
    //         <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
    //             <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" />
    //             <span className="block mt-2 md:mt-0 p-input-icon-left">
    //                 <i className="pi pi-search" />
    //                 <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
    //             </span>
    //         </div>
    //     </div>
    // );

    // const headerRekening = (
    //     <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
    //         <h5 className="m-0"></h5>
    //         <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
    //             <Dropdown value={selectedColumn} onChange={(e) => setSelectedColumn(e.value)} options={dropdownValuesRekening} optionLabel="label" placeholder="Pilih kolom" />
    //             <span className="block mt-2 md:mt-0 p-input-icon-left">
    //                 <i className="pi pi-search" />
    //                 <InputText type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." />
    //             </span>
    //         </div>
    //     </div>
    // );

    // const filterRekening = (data, type) => {
    //     // Filter berdasarkan jenis rekening terlebih dahulu
    //     let filteredData = data.filter((item) => parseInt(item.KODE.charAt(0)) === type);

    //     // Filter berdasarkan input pencarian
    //     if (selectedColumn && searchText) {
    //         const field = selectedColumn.name;
    //         const searchLower = searchText.toLowerCase();
    //         filteredData = filteredData.filter((item) => String(item[field]).toLowerCase().includes(searchLower));
    //     }

    //     return filteredData;
    // };

    // const toggleDataTableRekening = async (event) => {
    //     setActiveIndexRekening(event.index);
    //     let _lazyStateRekening = { ...lazyStateRekening };
    //     _lazyStateRekening['filters']['KODE'] = event.index + 1;
    //     setlazyStateRekening(_lazyStateRekening);
    // };
    const toggleDataTableRekening = async (event) => {
        setActiveIndexRekening(event.index);
        setSearchText(''); // Reset pencarian saat ganti tab
        setSelectedColumn(dropdownValuesRekening[0]); // Reset kolom filter
    };

    //  Yang Handle DataTable
    const MyDataTable = ({ formField, onRowSelect }) => {
        const [searchText, setSearchText] = useState('');
        const [selectedColumn, setSelectedColumn] = useState({ name: 'KODE', label: 'Kode' });
        const dropdownValuesRekening = [
            { name: 'KODE', label: 'Kode' },
            { name: 'KETERANGAN', label: 'Keterangan' },
            { name: 'JENISREKENING', label: 'Jenis Rekening' }
        ];

        // Filter client-side berdasarkan active tab dan search text
        const filteredData = useMemo(() => {
            const type = activeIndexRekening + 1; // 1=Aset, 2=Kewajiban, dst
            return rekeningTable.filter((item) => {
                // Filter utama berdasarkan jenis rekening
                const isTypeMatch = parseInt(item.KODE.charAt(0)) === type;

                // Filter search text
                const fieldValue = String(item[selectedColumn.name]).toLowerCase();
                const isSearchMatch = searchText ? fieldValue.includes(searchText.toLowerCase()) : true;

                return isTypeMatch && isSearchMatch;
            });
        }, [rekeningTable, activeIndexRekening, searchText, selectedColumn]);

        const toolbarTemplate = (
            <div className="flex w-full gap-2">
                <Dropdown value={selectedColumn} onChange={(e) => setSelectedColumn(e.value)} options={dropdownValuesRekening} optionLabel="label" placeholder="Filter by" className="w-10rem" />
                <div className="w-full">
                    {/* <i className="pi pi-search" /> */}
                    <InputText value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full" placeholder="Search..." />
                </div>
            </div>
        );
        return (
            <div className="card">
                <Toolbar className="mb-4" start={toolbarTemplate} />
                <TabView activeIndex={activeIndexRekening} onTabChange={toggleDataTableRekening}>
                    <TabPanel header="ASET">
                        {loading && (
                            <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            </div>
                        )}
                        {!loading && (
                            <DataTable
                                value={filteredData}
                                // filters={lazyState.filters}
                                onRowSelect={(event) => onRowSelect(event, formField)}
                                selectionMode="single"
                                loading={loading}
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                size="small"
                            >
                                <Column field="KODE" header="KODE" />
                                <Column field="KETERANGAN" header="KETERANGAN" />
                                <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                            </DataTable>
                        )}
                    </TabPanel>
                    <TabPanel header="KEWAJIBAN">
                        {loading && (
                            <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            </div>
                        )}
                        {!loading && (
                            <DataTable
                                value={filteredData}
                                // filters={lazyState.filters}
                                onRowSelect={(event) => onRowSelect(event, formField)}
                                selectionMode="single"
                                loading={loading}
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                size="small"
                            >
                                <Column field="KODE" header="KODE" />
                                <Column field="KETERANGAN" header="KETERANGAN" />
                                <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                            </DataTable>
                        )}
                    </TabPanel>
                    <TabPanel header="MODAL">
                        {loading && (
                            <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            </div>
                        )}
                        {!loading && (
                            <DataTable
                                value={filteredData}
                                // filters={lazyState.filters}
                                onRowSelect={(event) => onRowSelect(event, formField)}
                                selectionMode="single"
                                loading={loading}
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                size="small"
                            >
                                <Column field="KODE" header="KODE" />
                                <Column field="KETERANGAN" header="KETERANGAN" />
                                <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                            </DataTable>
                        )}
                    </TabPanel>
                    <TabPanel header="PENDAPATAN">
                        {loading && (
                            <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            </div>
                        )}
                        {!loading && (
                            <DataTable
                                value={filteredData}
                                // filters={lazyState.filters}
                                onRowSelect={(event) => onRowSelect(event, formField)}
                                selectionMode="single"
                                loading={loading}
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                size="small"
                            >
                                <Column field="KODE" header="KODE" />
                                <Column field="KETERANGAN" header="KETERANGAN" />
                                <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                            </DataTable>
                        )}
                    </TabPanel>

                    <TabPanel header="BIAYA">
                        {loading && (
                            <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            </div>
                        )}
                        {!loading && (
                            <DataTable
                                value={filteredData}
                                // filters={lazyState.filters}
                                onRowSelect={(event) => onRowSelect(event, formField)}
                                selectionMode="single"
                                loading={loading}
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                size="small"
                            >
                                <Column field="KODE" header="KODE" />
                                <Column field="KETERANGAN" header="KETERANGAN" />
                                <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                            </DataTable>
                        )}
                    </TabPanel>
                </TabView>
            </div>
        );
    };

    const onSearch = (e) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = e;
        }
        onPage(_lazyState);
    };

    //  Yang Handle Rekening
    const toggleRekening = async (event, formField) => {
        setLoadingItem(true);
        setRekeningDialog(true);
        setActiveFormField(formField);
        try {
            const vaTable = await postData(apiEndPointGetRekening, lazyStateRekening);
            const json = vaTable.data;
            setRekeningTable(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 });
        }
        setLoadingItem(false);
    };

    const handleSearchButtonClick = (formField) => (event) => {
        toggleRekening(event, formField);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        //  Menentukan FormField yang Sesuai
        switch (formField) {
            // ----------------------------------Pembelian
            case 'RekeningDebet':
                setGolonganAktiva((p) => ({
                    ...p,
                    RekeningDebet: selectedRow.KODE,
                    KetRekeningDebet: selectedRow.KETERANGAN
                }));
                break;
            case 'RekeningKredit':
                setGolonganAktiva((p) => ({
                    ...p,
                    RekeningKredit: selectedRow.KODE,
                    KetRekeningKredit: selectedRow.KETERANGAN
                }));
                break;
            default:
                break;
        }
        setRekeningDialog(false);
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (golonganaktivaTabelFilt.length == 0 || !golonganaktivaTabelFilt) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        try {
            const rekeningPDF = golonganaktivaTabelFilt ? JSON.parse(JSON.stringify(golonganaktivaTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!rekeningPDF || rekeningPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Golongan Aktiva';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = rekeningPDF.map((item) => [item.Kode, item.Keterangan, item.RekeningDebet, item.RekeningKredit]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'KETERANGAN', 'REKENING DEBET', 'REKENING KREDIT']],
                body: tableData,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            console.log(error);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(golonganaktivaTabel, 'master-golongan-aktiva.xlsx');
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
                <div className="card">
                    <h4>Master Golongan Aktiva</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={golonganaktivaTabelFilt}
                        filters={lazyState.filters}
                        header={header}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                        paginator
                        paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords} // Total number of records
                        size="small"
                        loading={loading}
                        emptyMessage="Data Kosong"
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                    >
                        {/* <Column field="NO" header="#" body={(rowData) => coa.indexOf(rowData) + 1}></Column> */}
                        <Column field="Kode" header="KODE"></Column>
                        <Column field="Keterangan" header="KETERANGAN"></Column>
                        <Column field="RekeningDebet" header="REKENING DEBET"></Column>
                        <Column field="RekeningKredit" header="REKENING KREDIT"></Column>
                        <Column header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>
                    <Dialog visible={golonganaktivaDialog} style={{ width: '650px' }} header="Data Golongan Aktiva" modal className="p-fluid" footer={golonganaktivaDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="kode">Kode</label>
                            <InputText
                                id="kode"
                                readOnly={statusAction === 'update'}
                                value={golonganaktiva.Kode}
                                onChange={(e) => onInputChange(e, 'Kode')}
                                required
                                autoFocus
                                className={classNames({
                                    'p-invalid': submitted && !golonganaktiva.Kode
                                })}
                            />
                            {submitted && !golonganaktiva.Kode && <small className="p-invalid">Kode is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="keterangan">Keterangan</label>
                            <InputText
                                id="keterangan"
                                value={golonganaktiva.Keterangan}
                                onChange={(e) => onInputChange(e, 'Keterangan')}
                                required
                                className={classNames({
                                    'p-invalid': submitted && !golonganaktiva.name
                                })}
                            />
                            {submitted && !golonganaktiva.keterangan && <small className="p-invalid">keterangan is required.</small>}
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="satuan3">Rekening Debet</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        style={{ width: '20%', borderRadius: '5px' }}
                                        id="satuan3"
                                        value={golonganaktiva.RekeningDebet}
                                        onChange={(e) => onInputChange(e, 'RekeningDebet')}
                                        className={classNames({
                                            'p-invalid': submitted && !golonganaktiva.RekeningDebet
                                        })}
                                    />
                                    <Button
                                        icon="pi pi-search"
                                        className="p-button"
                                        style={{
                                            'margin-left': '5px',
                                            'margin-right': '5px',
                                            borderRadius: '5px'
                                        }}
                                        onClick={handleSearchButtonClick('RekeningDebet')}
                                    />
                                    <InputText style={{ width: '60%', borderRadius: '5px' }} disabled id="ket-Satuan" value={golonganaktiva.KetRekeningDebet} />
                                </div>
                                {submitted && !golonganaktiva.RekeningDebet && <small className="p-invalid">required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="satuan3">Rekening Kredit</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        style={{ width: '20%', borderRadius: '5px' }}
                                        id="satuan3"
                                        value={golonganaktiva.RekeningKredit}
                                        onChange={(e) => onInputChange(e, 'RekeningKredit')}
                                        className={classNames({
                                            'p-invalid': submitted && !golonganaktiva.RekeningKredit
                                        })}
                                    />
                                    <Button
                                        icon="pi pi-search"
                                        className="p-button"
                                        style={{
                                            'margin-left': '5px',
                                            'margin-right': '5px',
                                            borderRadius: '5px'
                                        }}
                                        onClick={handleSearchButtonClick('RekeningKredit')}
                                    />
                                    <InputText style={{ width: '60%', borderRadius: '5px' }} disabled id="ket-Satuan" value={golonganaktiva.KetRekeningKredit} />
                                </div>
                                {submitted && !golonganaktiva.RekeningKredit && <small className="p-invalid">required.</small>}
                            </div>
                        </div>
                    </Dialog>

                    <Dialog visible={rekeningDialog} style={{ width: '450px' }} header="Rekening" modal className="p-fluid" onHide={() => setRekeningDialog(false)}>
                        {activeFormField === 'RekeningDebet' && <MyDataTable formField="RekeningDebet" onRowSelect={onRowSelectKode} />}
                        {activeFormField === 'RekeningKredit' && <MyDataTable formField="RekeningKredit" onRowSelect={onRowSelectKode} />}
                    </Dialog>

                    <Dialog visible={deleteGolonganAktivaDialog} header="Confirm" modal footer={deleteGolonganAktivaDialogFooter} onHide={hideDeleteGolonganAktivaDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {golonganaktiva && (
                                <span>
                                    Yakin ingin menghapus <strong>{golonganaktiva.Kode} ?</strong>
                                </span>
                            )}
                        </div>
                    </Dialog>

                    <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>

                    <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                        <div className="p-dialog-content">
                            <PDFViewer pdfUrl={pdfUrl} />
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
