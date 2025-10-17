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
 * Created on Sat May 18 2024 - 02:44:55
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../../utilities/servertool';
import { useRouter } from 'next/router';
import React, { lazy, useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { getEmail, getTglTransaksi, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'jspdf-autotable';
import Gudang from '../../../component/gudang';
import postData from '../../../../lib/Axios';
import { ProgressSpinner } from 'primereact/progressspinner';
import jsPDF from 'jspdf';
import { Footer, Header, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../../component/PDFViewer';
import AdjustPrintMarginExcel from '../../../component/adjustPrintMarginExcel';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanInventori() {
    const apiEndPointGet = '/api/laporan/transaksi-stock/inventori';
    const apiEndPointGetExcel = '/api/laporan/transaksi-stock/inventori/excel';

    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [defaultOption, setDropdownValue] = useState(null);
    const [inventori, setInventori] = useState([]);
    const [inventoriTabel, setInventoriTabel] = useState([]);
    const [inventoriTabelFilt, setInventoriTabelFilt] = useState([]);
    const [bulan, setBulan] = useState('');
    const [tahun, setTahun] = useState('');
    const [yearOptions, setYearOptions] = useState([]);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [totalSaldoAwal, setTotalSaldoAwal] = useState(0);
    const [totalSaldoPembelian, setTotalSaldoPembelian] = useState(0);
    const [totalSaldoRtnPembelian, setTotalSaldoRtnPembelian] = useState(0);
    const [totalSaldoPenjualan, setTotalSaldoPenjualan] = useState(0);
    const [totalSaldoRtnPenjualan, setTotalSaldoRtnPenjualan] = useState(0);
    const [totalSaldoMutasiKe, setTotalSaldoMutasiKe] = useState(0);
    const [totalSaldoMutasiDari, setTotalSaldoMutasiDari] = useState(0);
    const [totalSaldoPackingMasuk, setTotalSaldoPackingMasuk] = useState(0);
    const [totalSaldoPackingKeluar, setTotalSaldoPackingKeluar] = useState(0);
    const [totalSaldoAdjustment, setTotalSaldoAdjustment] = useState(0);
    const [totalSaldoStockAkhir, setTotalSaldoStockAkhir] = useState(0);
    const [totalSaldoNilaiStock, setTotalSaldoNilaiStock] = useState(0);
    const [totalSaldoNilaiAdjustment, setTotalSaldoNilaiAdjustment] = useState(0);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const months = [
        { label: 'Januari', value: '01' },
        { label: 'Februari', value: '02' },
        { label: 'Maret', value: '03' },
        { label: 'April', value: '04' },
        { label: 'Mei', value: '05' },
        { label: 'Juni', value: '06' },
        { label: 'Juli', value: '07' },
        { label: 'Agustus', value: '08' },
        { label: 'September', value: '09' },
        { label: 'Oktober', value: '10' },
        { label: 'November', value: '11' },
        { label: 'Desember', value: '12' }
    ];
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
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

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    useEffect(() => {
        // Yang Handle Tahun
        const getYear = async () => {
            try {
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 20 }, (_, index) => currentYear - index);
                const yearOptions = years.map((year) => ({ label: year.toString(), value: year }));
                setYearOptions(yearOptions);
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        };
        getYear();
    }, [lazyState, showPreview]);

    //Yang Handle Gudang
    const btnGudang = () => {
        setGudangDialog(true);
    };

    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setInventori((prevStockOpname) => ({
            ...prevStockOpname,
            Gudang: gudangKode
        }));
    };

    //  Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _inventori = { ...inventori };
        _inventori[`${name}`] = val;
        setInventori((prevState) => ({
            ...prevState,
            [name]: val
        }));
        setInventori(_inventori);
    };

    // Yang Handle Data
    const loadLazyData = async () => {
        try {
            setLoading(true);
            if (!inventori.Bulan) {
                // Tampilkan pesan error
                toast.current.show({
                    severity: 'error',
                    summary: 'Error Message',
                    detail: 'Bulan Belum Dipilih',
                    life: 3000
                });
                setLoading(false);
                return;
            }

            if (!inventori.Tahun) {
                // Tampilkan pesan error
                toast.current.show({
                    severity: 'error',
                    summary: 'Error Message',
                    detail: 'Tahun Belum Dipilih',
                    life: 3000
                });
                setLoading(false);
                return;
            }

            if (!gudangKode) {
                // Tampilkan pesan error
                toast.current.show({
                    severity: 'error',
                    summary: 'Error Message',
                    detail: 'Gudang Belum Dipilih',
                    life: 3000
                });
                setLoading(false);
                return;
            }

            const requestBody = {
                ...lazyState,
                Bulan: inventori.Bulan,
                Tahun: inventori.Tahun,
                Gudang: gudangKode
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;

            setBulan(inventori.Bulan);
            setTahun(inventori.Tahun);

            setInventoriTabel(json.data);
            setTotalSaldoAwal(json.total.TotalSaldoAwal);
            setTotalSaldoPembelian(json.total.TotalSaldoPembelian);
            setTotalSaldoRtnPembelian(json.total.TotalSaldoReturPembelian);
            setTotalSaldoPenjualan(json.total.TotalSaldoPenjualan);
            setTotalSaldoRtnPenjualan(json.total.TotalSaldoRtnPenjualan);
            setTotalSaldoMutasiKe(json.total.TotalSaldoMutasiKe);
            setTotalSaldoMutasiDari(json.total.TotalSaldoMutasiDari);
            setTotalSaldoPackingMasuk(json.total.TotalSaldoPackingMasuk);
            setTotalSaldoPackingKeluar(json.total.TotalSaldoPackingKeluar);
            setTotalSaldoAdjustment(json.total.TotalSaldoAdjustment);
            setTotalSaldoStockAkhir(json.total.TotalStockAkhir);
            setTotalSaldoNilaiStock(json.total.TotalNilaiStock);
            setTotalSaldoNilaiAdjustment(json.total.TotalNilaiAdjustment);
            setTotalRecords(json.total_data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

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

    const onPage1 = (event) => {
        setlazyState({
            ...lazyState,
            first: event.first,
            rows: event.rows,
            page: event.page
        });
    };

    // Yang Handle Preview
    const btnAdjust = () => {
        if (inventoriTabelFilt.length == 0 || !inventoriTabelFilt) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    // Yang Handle PDF
    const exportPDF = async (dataAdjust) => {
        try {
            const inventoriPDF = inventoriTabelFilt ? JSON.parse(JSON.stringify(inventoriTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);

            const doc = new jsPDF({
                orientation: dataAdjust.orientation,
                unit: 'mm',
                format: dataAdjust.format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!inventoriPDF || inventoriPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Rekapitulasi Inventory';
            const periodeLaporan = 'Periode ' + bulan + ' ' + tahun;
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = inventoriPDF.map((item) => [
                item.No,
                item.Kode,
                item.Barcode,
                item.Nama,
                item.Gudang,
                item.Satuan,
                parseInt(item.HargaBeli).toLocaleString(),
                parseInt(item.HargaPokok).toLocaleString(),
                parseInt(item.HargaJual).toLocaleString(),
                parseInt(item.SaldoAwal).toLocaleString(),
                parseInt(item.Pembelian).toLocaleString(),
                parseInt(item.RetPembelian).toLocaleString(),
                parseInt(item.Penjualan).toLocaleString(),
                parseInt(item.RetPenjualan).toLocaleString(),
                parseInt(item.MutasiKe).toLocaleString(),
                parseInt(item.MutasiDari).toLocaleString(),
                parseInt(item.PackingMasuk).toLocaleString(),
                parseInt(item.PackingKeluar).toLocaleString(),
                parseInt(item.Adjustment).toLocaleString(),
                parseInt(item.StokAkhir).toLocaleString(),
                parseInt(item.NilaiStock).toLocaleString(),
                parseInt(item.NilaiAdjustment).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [
                    [
                        'NO',
                        'KODE',
                        'BARCODE',
                        'NAMA PRODUK',
                        'GUDANG',
                        'SATUAN',
                        'HARGA BELI',
                        'HARGA POKOK',
                        'HARGA JUAL',
                        'SALDO AWAL',
                        'PEMBELIAN',
                        'RET. PEMBELIAN',
                        'PENJUALAN',
                        'RET. PENJUALAN',
                        'MUTASI KE',
                        'MUTASI DARI',
                        'PACKING MASUK',
                        'PACKING KELUAR',
                        'ADJUSTMENT',
                        'STOCK AKHIR',
                        'NILAI STOCK',
                        'NILAI ADJUSTMENT'
                    ]
                ],
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
                columnStyles: {
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' },
                    9: { halign: 'right' },
                    10: { halign: 'right' },
                    11: { halign: 'right' },
                    12: { halign: 'right' },
                    13: { halign: 'right' },
                    14: { halign: 'right' },
                    15: { halign: 'right' },
                    16: { halign: 'right' },
                    17: { halign: 'right' },
                    18: { halign: 'right' },
                    19: { halign: 'right' },
                    20: { halign: 'right' },
                    21: { halign: 'right' }
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
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.log(error);
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = async () => {
        try {
            exportToXLSX(inventoriTabelFilt, 'laporan-rekap-inventori.xlsx');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
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

    useEffect(() => {
        setInventoriTabelFilt(inventoriTabel);
    }, [inventoriTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = inventoriTabel.filter((d) => (x ? x.test(d.Kode) || x.test(d.Barcode) || x.test(d.Nama) || x.test(d.Gudang) || x.test(d.Satuan) : []));
            setSearch(searchVal);
        }

        setInventoriTabelFilt(filtered);
    };

    // Yang Handle Pencarian
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:align-items-center">
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                    <InputText readOnly id="gudang_kode" value={gudangKode} placeholder="Gudang" />
                    <Button icon="pi pi-search" className="p-button" onClick={btnGudang} />
                    <InputText readOnly id="ket-Gudang" value={gudangKet} placeholder="Ket Gudang" />
                </div>
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                    <Dropdown
                        id="Bulan"
                        name="Bulan"
                        value={inventori.Bulan}
                        options={months}
                        onChange={(e) => onInputChange(e, 'Bulan')}
                        placeholder="Pilih Bulan"
                        optionLabel="label"
                        style={{ marginRight: '0.5rem', marginLeft: '0.5rem', width: '100px' }}
                    />
                    <Dropdown id="Tahun" name="Tahun" value={inventori.Tahun} options={yearOptions} onChange={(e) => onInputChange(e, 'Tahun')} placeholder="Pilih Tahun" style={{ marginRight: '0.5rem', width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <span className="block p-input-icon-left" style={{ marginRight: '0.5rem' }}>
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Rekapitulasi Inventori</h4>
                <hr />
                <Toast ref={toast}></Toast>
                <DataTable
                    value={inventoriTabelFilt}
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
                    frozenFooter
                >
                    <Column field="No" header="NO."></Column>
                    <Column field="Kode" header="KODE"></Column>
                    <Column field="Barcode" header="BARCODE"></Column>
                    <Column field="Nama" header="NAMA"></Column>
                    <Column field="Gudang" header="GUDANG"></Column>
                    <Column field="Satuan" header="SATUAN" footer={'TOTAL'}></Column>
                    <Column
                        field="HargaBeli"
                        body={(rowData) => {
                            const value = rowData.HargaBeli ? parseFloat(rowData.HargaBeli).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA BELI"
                    ></Column>
                    <Column
                        field="HargaPokok"
                        body={(rowData) => {
                            const value = rowData.HargaPokok ? parseFloat(rowData.HargaPokok).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA POKOK"
                    ></Column>
                    <Column
                        field="HargaJual"
                        body={(rowData) => {
                            const value = rowData.HargaJual ? parseFloat(rowData.HargaJual).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA JUAL"
                    ></Column>
                    <Column
                        field="SaldoAwal"
                        body={(rowData) => {
                            const value = rowData.SaldoAwal ? parseFloat(rowData.SaldoAwal).toLocaleString() : 0;
                            return value;
                        }}
                        header="SALDO AWAL"
                        footer={parseFloat(totalSaldoAwal).toLocaleString()}
                    ></Column>
                    <Column
                        field="Pembelian"
                        body={(rowData) => {
                            const value = rowData.Pembelian ? parseFloat(rowData.Pembelian).toLocaleString() : 0;
                            return value;
                        }}
                        header="PEMBELIAN"
                        footer={parseFloat(totalSaldoPembelian).toLocaleString()}
                    ></Column>
                    <Column
                        field="RetPembelian"
                        body={(rowData) => {
                            const value = rowData.RetPembelian ? parseFloat(rowData.RetPembelian).toLocaleString() : 0;
                            return value;
                        }}
                        header="RET. PEMBELIAN"
                        footer={parseFloat(totalSaldoRtnPembelian).toLocaleString()}
                    ></Column>
                    <Column
                        field="Penjualan"
                        body={(rowData) => {
                            const value = rowData.Penjualan ? parseFloat(rowData.Penjualan).toLocaleString() : 0;
                            return value;
                        }}
                        header="PENJUALAN"
                        footer={parseFloat(totalSaldoPenjualan).toLocaleString()}
                    ></Column>
                    <Column
                        field="RetPenjualan"
                        body={(rowData) => {
                            const value = rowData.RetPenjualan ? parseFloat(rowData.RetPenjualan).toLocaleString() : 0;
                            return value;
                        }}
                        header="RET. PENJUALAN"
                        footer={parseFloat(totalSaldoRtnPenjualan).toLocaleString()}
                    ></Column>
                    <Column
                        field="MutasiKe"
                        body={(rowData) => {
                            const value = rowData.MutasiKe ? parseFloat(rowData.MutasiKe).toLocaleString() : 0;
                            return value;
                        }}
                        header="MUTASI KE"
                        footer={parseFloat(totalSaldoMutasiKe).toLocaleString()}
                    ></Column>
                    <Column
                        field="MutasiDari"
                        body={(rowData) => {
                            const value = rowData.MutasiDari ? parseFloat(rowData.MutasiDari).toLocaleString() : 0;
                            return value;
                        }}
                        header="MUTASI DARI"
                        footer={parseFloat(totalSaldoMutasiDari).toLocaleString()}
                    ></Column>
                    <Column
                        field="PackingMasuk"
                        body={(rowData) => {
                            const value = rowData.PackingMasuk ? parseFloat(rowData.PackingMasuk).toLocaleString() : 0;
                            return value;
                        }}
                        header="PACKING MASUK"
                        footer={parseFloat(totalSaldoPackingMasuk).toLocaleString()}
                    ></Column>
                    <Column
                        field="PackingKeluar"
                        body={(rowData) => {
                            const value = rowData.PackingKeluar ? parseFloat(rowData.PackingKeluar).toLocaleString() : 0;
                            return value;
                        }}
                        header="PACKING KELUAR"
                        footer={parseFloat(totalSaldoPackingKeluar).toLocaleString()}
                    ></Column>
                    <Column
                        field="Adjustment"
                        body={(rowData) => {
                            const value = rowData.Adjustment ? parseFloat(rowData.Adjustment).toLocaleString() : 0;
                            return value;
                        }}
                        header="ADJUSTMENT"
                        footer={parseFloat(totalSaldoAdjustment).toLocaleString()}
                    ></Column>
                    <Column
                        field="StokAkhir"
                        body={(rowData) => {
                            const value = rowData.StokAkhir ? parseFloat(rowData.StokAkhir).toLocaleString() : 0;
                            return value;
                        }}
                        header="STOCK AKHIR"
                        footer={parseFloat(totalSaldoStockAkhir).toLocaleString()}
                    ></Column>
                    <Column
                        field="NilaiStock"
                        body={(rowData) => {
                            const value = rowData.NilaiStock ? parseFloat(rowData.NilaiStock).toLocaleString() : 0;
                            return value;
                        }}
                        header="NILAI STOCK"
                        footer={parseFloat(totalSaldoNilaiStock).toLocaleString()}
                    ></Column>
                    <Column
                        field="NilaiAdjustment"
                        body={(rowData) => {
                            const value = rowData.NilaiAdjustment ? parseFloat(rowData.NilaiAdjustment).toLocaleString() : 0;
                            return value;
                        }}
                        header="NILAI ADJUSTMENT"
                        footer={parseFloat(totalSaldoNilaiAdjustment).toLocaleString()}
                    ></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>
            </div>
            {loading && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.5)', zIndex: 9999 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <ProgressSpinner />
                    </div>
                </div>
            )}
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} btnAdjust={btnAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
            <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData}></Gudang>
        </div>
    );
}
