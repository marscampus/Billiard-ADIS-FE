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
 * Created on Wed Aug 07 2024 - 09:42:16
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { useRouter } from 'next/router';
import { DataTable } from 'primereact/datatable';
import { Calendar } from 'primereact/calendar';
import { startOfMonth } from 'date-fns';
import { Column } from 'primereact/column';
import { convertToISODate, formatAndSetDate } from '../../component/GeneralFunction/GeneralFunction';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import postData from '../../lib/Axios';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function JurnalLainLain() {
    const apiEndPointGet = '/api/jurnal-lain/data';
    const apiEndPointDelete = '/api/jurnal-lain/delete';
    const toast = useRef(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [jurnalLain, setJurnalLain] = useState([]);
    const [jurnalLainTabel, setJurnalLainTabel] = useState([]);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [totalRecords, setTotalRecords] = useState(0);
    const [defaultOption, setDropdownValue] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [jurnalLainTabelFilt, setJurnalLainTabelFilt] = useState([]);
    const [search, setSearch] = useState('');
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const dropdownValues = [
        { name: 'Faktur', label: 'Faktur' },
        { name: 'Rekening', label: 'Rekening' },
        { name: 'Keterangan', label: 'Keterangan' }
    ];

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setJurnalLainTabelFilt(jurnalLainTabel);
    }, [jurnalLainTabel, lazyState]);

    const onPage = (event) => {
        setLazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = jurnalLainTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.Tgl) || x.test(d.Rekening) || x.test(d.NamaPerkiraan) || x.test(d.Debet) || x.test(d.Kredit) : []));
            setSearch(searchVal);
        }

        setJurnalLainTabelFilt(filtered);
    };

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = {
                ...lazyState
            };
            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
            }

            const vaData = await postData(apiEndPointGet, requestBody);
            const json = vaData.data;
            setTotalRecords(json.total_data);
            let fakturTracker = {};
            const updatedJson = json.data.map((item, index) => {
                const faktur = item.Faktur;
                if (fakturTracker[faktur]) {
                    item.Faktur = '';
                } else {
                    fakturTracker[faktur] = true;
                }
                item.ID = index + 1; // Ensure ID field is added
                return item;
            });
            setJurnalLainTabel(updatedJson);
        } catch (error) {
            const e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Dialog Form
    const openNew = () => {
        setSubmitted(false);
        router.push('/jurnal-lain/form');
    };

    // Handle Date
    const handleStartDate = (e) => {
        setStartDate(e.value);
    };
    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setStartDate);
    };
    const handleEndDate = (e) => {
        setEndDate(e.value);
    };
    const handleEndDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setEndDate);
    };

    // Header
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" showIcon />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" showIcon />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} style={{ marginLeft: '5px' }} />
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        console.log(_lazyState);
        onPage(_lazyState);
    };

    // Delete Data
    const deleteJurnalLain = async (rowData) => {
        try {
            const res = await postData(apiEndPointDelete, { faktur: rowData.Faktur });
            showSuccess(res.data.message);
            loadLazyData();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    // Action
    const actionBodyTemplate = (rowData) => {
        return <>{rowData.Faktur && <Button icon="pi pi-trash" severity="danger" rounded onClick={() => deleteJurnalLain(rowData)} />}</>;
    };

    // Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew}></Button>
                </div>
            </React.Fragment>
        );
    };
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Jurnal Lain-Lain</h4>
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>
                    <DataTable
                        value={jurnalLainTabelFilt}
                        // globalFilter={globalFilter}
                        filters={lazyState.filters}
                        header={headerSearch}
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
                        <Column field="ID" header="ID"></Column>
                        <Column field="Faktur" header="FAKTUR"></Column>
                        <Column field="Tgl" header="TANGGAL"></Column>
                        <Column field="Rekening" header="REKENING"></Column>
                        <Column field="NamaPerkiraan" header="KET. PERKIRAAN"></Column>
                        <Column field="Keterangan" header="KETERANGAN"></Column>
                        <Column
                            field="Debet"
                            body={(rowData) => {
                                const value = rowData.Debet ? parseInt(rowData.Debet).toLocaleString() : '';
                                return value;
                            }}
                            header="DEBET"
                        ></Column>
                        <Column
                            field="Kredit"
                            body={(rowData) => {
                                const value = rowData.Kredit ? parseInt(rowData.Kredit).toLocaleString() : '';
                                return value;
                            }}
                            header="KREDIT"
                        ></Column>
                        <Column field="UserName" header="USERNAME"></Column>
                        <Column header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                </div>
            </div>
        </div>
    );
}
