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
 * Created on Fri Jul 19 2024 - 03:29:58
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { TabPanel, TabView } from 'primereact/tabview'; //------------------------------< Combobox Dialog >
// import jsPDF from 'jspdf';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import { convertToISODate, formatAndSetDate, formatDate, subtractOneDay } from '../../../component/GeneralFunction/GeneralFunction.js';
// import { exportToCSV, exportToXLSX } from '../../../component/exportXLSX/exportXLSX.js';
// import { Panel } from 'primereact/panel';
// import autoTable from 'jspdf-autotable';
// import { Footer, Header, addPageInfo } from '../../../../component/exportPDF/exportPDF.js';
import { startOfMonth } from 'date-fns';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanLabaRugi() {
    const apiEndPointGet = '/api/laporan/laba-rugi/get';
    const toast = useRef(null);
    const [labaRugiHarianTabel, setLabaRugiHarianTabel] = useState([]);
    const [labaRugiPendapatanTabel, setLabaRugiPendapatanTabel] = useState([]);
    const [labaRugiHPPTabel, setLabaRugiHPPTabel] = useState([]);
    const [labaRugiBiayaTabel, setLabaRugiBiayaTabel] = useState([]);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const dropdownValues = [
        { name: 'Kode', label: 's.KODE' },
        { name: 'Barcode', label: 's.KODE_TOKO' },
        { name: 'Nama', label: 's.NAMA' }
    ];

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const requestData = {
                TglAwal: convertToISODate(startDate),
                TglAkhir: convertToISODate(endDate)
            };

            // Memanggil endpoint API
            const vaTable = await postData(apiEndPointGet, requestData);
            const json = vaTable.data.data;

            // Memisahkan data berdasarkan awalan rekening
            const pendapatan = [];
            const hpp = [];
            const biaya = [];

            console.log(json);

            json.forEach((item) => {
                const rekening = item.Kode;
                if (rekening.startsWith('4')) {
                    pendapatan.push(item);
                } else if (rekening.startsWith('5')) {
                    biaya.push(item);
                }
            });

            // Menetapkan data ke state yang sesuai
            setLabaRugiPendapatanTabel(pendapatan);
            setLabaRugiBiayaTabel(biaya);
            // GABUNGAN
            setLabaRugiHarianTabel(json);
        } catch (error) {
            console.error('Error loading data:', error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
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

    // Yang Handle TabView
    const toggleDataTable = async (event) => {
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        loadLazyData();
        setLoadingItem(false);
    };

    // Yang Handle Pencarian
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:align-items-center">
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                    {/* <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} /> */}
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" style={{ marginRight: '0.5rem' }} /> */}
                <span className="block p-input-icon-left" style={{ marginRight: '0.5rem' }}>
                    <i className="pi pi-search" />
                    {/* <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." /> */}
                </span>
            </div>
        </div>
    );

    // Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <div className="formgrid grid" style={{ width: '100%' }}>
                        {/* Antara Tanggal */}
                        <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                            <label style={{ marginBottom: '0' }}>Antara Tanggal</label>
                        </div>
                        <div className="field col-9 mb-2 lg:col-9">
                            <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                <div className="field col-5 mb-2 lg:col-5" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Calendar
                                        style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}
                                        name="startDate"
                                        value={startDate}
                                        onInput={handleStartDateChange}
                                        onChange={handleStartDate}
                                        placeholder="Start Date"
                                        dateFormat="dd-mm-yy"
                                        showIcon
                                    />
                                </div>
                                <label style={{ margin: '2px' }}>s.d.</label>
                                <div className="field col-5 mb-2 lg:col-5" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Calendar
                                        style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}
                                        name="endDate"
                                        value={endDate}
                                        onInput={handleEndDateChange}
                                        onChange={handleEndDate}
                                        placeholder="End Date"
                                        dateFormat="dd-mm-yy"
                                        showIcon
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    };
    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Refresh" icon="pi pi-refresh" className="p-button-primary mr-2 ml-2" onClick={loadLazyData} />
            </React.Fragment>
        );
    };

    // Yang Handle Bold
    const rowClass = (rowData) => {
        return rowData.JenisRekening === 'I' ? 'bold-row' : '2';
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Laba Rugi</h4>
                <hr></hr>
                <Toast ref={toast}></Toast>
                <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
                <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                    {/* LABA RUGI HARIAN */}
                    <TabPanel header="Laba Rugi Harian">
                        <DataTable
                            size="small"
                            value={labaRugiHarianTabel}
                            // header={headerSearch}
                            scrollable
                            scrollHeight="550px"
                            loading={loading}
                            emptyMessage="Data Kosong"
                            className="datatable-responsive"
                            filter
                            // globalFilter={globalFilter}
                            // filterOptions={filterOptions}
                            // filters={lazyState.filters}
                            // filterMode="match"
                            rowClassName={rowClass}
                        >
                            <Column field="Kode" header="KODE" body={(rowData) => (rowData.Jenis === 'I' ? <b>{rowData.Kode}</b> : rowData.Kode)}></Column>
                            <Column field="Keterangan" header="KETERANGAN" body={(rowData) => (rowData.Jenis === 'I' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}></Column>
                            <Column
                                field="SaldoAwal"
                                header={subtractOneDay(startDate)}
                                body={(rowData) => {
                                    const formattedValue =
                                        rowData.SaldoAwal !== 0 && !isNaN(rowData.SaldoAwal)
                                            ? rowData.SaldoAwal < 0
                                                ? `(${Math.abs(rowData.SaldoAwal).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})` // Menghapus "IDR" dan mengganti koma dengan titik
                                                : rowData.SaldoAwal.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.') // Menghapus "IDR" dan mengganti koma dengan titik
                                            : null;
                                    return formattedValue && rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            ></Column>
                            <Column
                                field="Mutasi"
                                header="MUTASI"
                                body={(rowData) => {
                                    const formattedValue =
                                        rowData.Mutasi !== 0 && !isNaN(rowData.Mutasi)
                                            ? rowData.Mutasi < 0
                                                ? `(${Math.abs(rowData.Mutasi).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})` // Menghapus "IDR" dan mengganti koma dengan titik
                                                : rowData.Mutasi.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.') // Menghapus "IDR" dan mengganti koma dengan titik
                                            : null;
                                    return formattedValue && rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            ></Column>
                            <Column
                                field="SaldoAkhir"
                                header={formatDate(endDate)}
                                body={(rowData) => {
                                    const formattedValue =
                                        rowData.SaldoAkhir !== 0 && !isNaN(rowData.SaldoAkhir)
                                            ? rowData.SaldoAkhir < 0
                                                ? `(${Math.abs(rowData.SaldoAkhir).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})` // Menghapus "IDR" dan mengganti koma dengan titik
                                                : rowData.SaldoAkhir.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.') // Menghapus "IDR" dan mengganti koma dengan titik
                                            : null;
                                    return formattedValue && rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            ></Column>
                        </DataTable>
                    </TabPanel>
                    {/* LABA RUGI SALDO */}
                    <TabPanel header="Laba Rugi Saldo">
                        <div className="field col-12 mb-2 lg:col-12">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-6">
                                    <h2>Pendapatan</h2>
                                    <div className="">
                                        <DataTable
                                            size="small"
                                            value={labaRugiPendapatanTabel}
                                            // header={headerSearch}
                                            scrollable
                                            scrollHeight="550px"
                                            loading={loading}
                                            emptyMessage="Data Kosong"
                                            className="datatable-responsive"
                                            filter
                                            // globalFilter={globalFilter}
                                            // filterOptions={filterOptions}
                                            // filters={lazyState.filters}
                                            // filterMode="match"
                                            rowClassName={rowClass}
                                        >
                                            <Column field="Kode" header="KODE" body={(rowData) => (rowData.Jenis === 'I' ? <b>{rowData.Kode}</b> : rowData.Kode)}></Column>
                                            <Column field="Keterangan" header="KETERANGAN" body={(rowData) => (rowData.Jenis === 'I' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}></Column>

                                            <Column
                                                field="SaldoAkhir"
                                                header={formatDate(endDate)}
                                                body={(rowData) => {
                                                    const formattedValue =
                                                        rowData.SaldoAkhir !== 0 && !isNaN(rowData.SaldoAkhir)
                                                            ? rowData.SaldoAkhir < 0
                                                                ? `(${Math.abs(rowData.SaldoAkhir).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})` // Menghapus "IDR" dan mengganti koma dengan titik
                                                                : rowData.SaldoAkhir.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.') // Menghapus "IDR" dan mengganti koma dengan titik
                                                            : null;
                                                    return formattedValue && rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                                }}
                                            ></Column>
                                        </DataTable>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-6">
                                    <h2>Biaya</h2>
                                    <div className="">
                                        <DataTable
                                            size="small"
                                            value={labaRugiBiayaTabel}
                                            // header={headerSearch}
                                            scrollable
                                            scrollHeight="550px"
                                            loading={loading}
                                            emptyMessage="Data Kosong"
                                            className="datatable-responsive"
                                            filter
                                            // globalFilter={globalFilter}
                                            // filterOptions={filterOptions}
                                            // filters={lazyState.filters}
                                            // filterMode="match"
                                            rowClassName={rowClass}
                                        >
                                            <Column field="Kode" header="KODE" body={(rowData) => (rowData.Jenis === 'I' ? <b>{rowData.Kode}</b> : rowData.Kode)}></Column>
                                            <Column field="Keterangan" header="KETERANGAN" body={(rowData) => (rowData.Jenis === 'I' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}></Column>

                                            <Column
                                                field="SaldoAkhir"
                                                header={formatDate(endDate)}
                                                body={(rowData) => {
                                                    const formattedValue =
                                                        rowData.SaldoAkhir !== 0 && !isNaN(rowData.SaldoAkhir)
                                                            ? rowData.SaldoAkhir < 0
                                                                ? `(${Math.abs(rowData.SaldoAkhir).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})` // Menghapus "IDR" dan mengganti koma dengan titik
                                                                : rowData.SaldoAkhir.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.') // Menghapus "IDR" dan mengganti koma dengan titik
                                                            : null;
                                                    return formattedValue && rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                                }}
                                            ></Column>
                                        </DataTable>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
}
