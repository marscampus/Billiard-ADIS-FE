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
 * Created on Wed Jun 12 2024 - 09:30:38
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { startOfMonth } from 'date-fns';
import { convertToISODate, convertUndefinedToNull, formatAndSetDate, formatCurrency, formatDate, formatDateTable, formatNumber, formatRibuan, getEmail, getUserName, getZFormat, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Panel } from 'primereact/panel';
import { InputText } from 'primereact/inputtext';
import Supplier from '../../../component/supplier';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import PDFViewer from '../../../../component/PDFViewer';
import postData from '../../../../lib/Axios';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'react-thermal-printer';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import jsPDF from 'jspdf';
import { addPageInfo, Footer, Header, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';
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

export default function LaporanDaftarPembelian() {
    const apiEndPointGet = '/api/laporan/pembelian/daftar';
    const apiEndPointStore = '/api/laporan/pembelian/store';
    const apiEndPointUpd = '/api/laporan/pembelian/update';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [daftarPembelian, setDaftarPembelian] = useState([]);
    const [daftarPembelianTabel, setDaftarPembelianTabel] = useState([]);
    const [daftarPembelianTabelFilt, setDaftarPembelianTabelFilt] = useState([]);
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [defaultOption, setDropdownValue] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');

    // Entry Pajak (Dialog)
    const [entryPajak, setEntryPajak] = useState([]);
    const [pembayaran, setPembayaran] = useState(0);
    const [fakturBeli, setFakturBeli] = useState('');
    const [namaSupplier, setNamaSupplier] = useState('');
    const [alamatSupplier, setAlamatSupplier] = useState('');
    const [NPWP, setNPWP] = useState('');
    const [PPN, setPPN] = useState(0);
    const [tgl, setTgl] = useState(new Date());
    const [tglTerimaPajak, setTglTerimaPajak] = useState(new Date());
    const [tglTerimaFaktur, setTglTerimaFaktur] = useState(new Date());
    const [noSeri, setNoSeri] = useState('');
    const [jumlah, setJumlah] = useState(0);

    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [pdfUrl, setPdfUrl] = useState('');

    const dropdownValues = [
        { name: 'FKT PEMBELIAN', label: 'tpe.Faktur' },
        { name: 'FKT PO', label: 'tpo.Faktur' },
        { name: 'FKT BAYAR', label: 'kh.FKT' }
    ];

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

    useEffect(() => {
        setDaftarPembelianTabelFilt(daftarPembelianTabel);
    }, [daftarPembelianTabel, lazyState]);

    useEffect(() => {
        const fetchData = async () => {
            await setDaftarPembelian({ Status: 'S' });
        };

        fetchData();
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                ...lazyState,
                TglAwal: convertToISODate(startDate),
                TglAkhir: convertToISODate(endDate),
                Supplier: supplierKode || '',
                Status: daftarPembelian.Status || ''
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setDaftarPembelianTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Inputan Tanggal
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

    // Yang Handle Supplier
    const btnSupplier = () => {
        setSupplierDialog(true);
    };

    const handleSupplierData = (supplierKode, supplierNama) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (daftarPembelianTabelFilt.length == 0 || !daftarPembelianTabelFilt) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    // PDF
    const handleAdjust = async (dataAdjust) => {
        console.log(dataAdjust);
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        try {
            setLoadingPreview(true);
            const daftarPembelianPDF = daftarPembelianTabelFilt ? JSON.parse(JSON.stringify(daftarPembelianTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);

            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!daftarPembelianPDF || daftarPembelianPDF.lenght === 0) {
                // If the table is empty, add a message to the PDF
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });

                // You can also add any other relevant information or styling for an empty table
            }

            const userName = await getUserName(await getEmail());
            const judulLaporan = 'Laporan Daftar Pembelian';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + ' s.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = daftarPembelianPDF.map((item) => [
                item.No,
                formatDateTable(item.Tgl),
                item.FktPembelian,
                item.Supplier,
                item.FktPO,
                formatDateTable(item.TglDO),
                formatDateTable(item.JthTmp),
                parseInt(item.Pembayaran).toLocaleString(),
                parseInt(item.TotalPO).toLocaleString(),
                parseInt(item.TotalTerima).toLocaleString(),
                parseInt(item.SelisihPO).toLocaleString(),
                parseInt(item.PPN).toLocaleString(),
                parseInt(item.Disc).toLocaleString(),
                parseInt(item.Retur).toLocaleString(),
                parseInt(item.TotalBayar).toLocaleString(),
                item.UserName
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO.', 'TGL', 'FKT PEMBELIAN', 'SUPPLIER', 'FKT PO', 'TGL DO', 'JTH TMP', 'PEMBAYARAN', 'TOTAL PO', 'TOTAL TERIMA', 'SELISIH PO', 'PPN', 'DISC', 'RETUR', 'TOTAL BAYAR', 'USERNAME']],
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
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    5: { halign: 'right' },
                    6: { halign: 'right' }
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
            setLoadingExportPDF(false);
            setLoadingPreview(false);
        } catch (error) {
            let e = error?.response?.data || error;
            console.log(e);
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
            setLoadingPreview(false);
        }
    };

    // Yang Handle Export Excel
    const exportExcel = () => {
        exportToXLSX(daftarPembelianTabelFilt, 'laporan-daftar-pembelian.xlsx');
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center w-full">
                <div className="p-inputgroup">{/* Kalender atau elemen lain bisa ditambahkan di sini */}</div>
                <span className="block mt-2 md:mt-0 p-input-icon-left flex-grow-1" style={{ maxWidth: '400px' }}>
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = daftarPembelianTabel.filter((d) =>
                x
                    ? x.test(d.Tgl) ||
                      x.test(d.FktPembelian) ||
                      x.test(d.Supplier) ||
                      x.test(d.FktPO) ||
                      x.test(d.TglDO) ||
                      x.test(d.FktAsli) ||
                      x.test(d.JthTmp) ||
                      x.test(d.Pembayaran) ||
                      x.test(d.TotalPO) ||
                      x.test(d.TotalTerima) ||
                      x.test(d.SelisihPO) ||
                      x.test(d.PPN) ||
                      x.test(d.Disc) ||
                      x.test(d.Retur) ||
                      x.test(d.TotalBayar) ||
                      x.test(d.TglFakturPajak) ||
                      x.test(d.JmlFktPajak) ||
                      x.test(d.NoSeriFktPajak) ||
                      x.test(d.CekFaktur) ||
                      x.test(d.UserName) ||
                      x.test(d.FktBayar) ||
                      x.test(d.TglBayar)
                    : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = daftarPembelianTabel;
            } else {
                filtered = daftarPembelianTabel.filter((d) => (x ? x.test(d.KodeDiskon) : []));
            }
        }

        setDaftarPembelianTabelFilt(filtered);
    };

    const headerSearchAslii = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:align-items-center" style={{ width: '100%' }}>
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>
                    <InputText readOnly value={daftarPembelian.Supplier || supplierKode} placeholder="Supplier" />
                    <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                    <InputText readOnly value={supplierNama} placeholder="Ket Supplier" />
                </div>
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" showIcon />
                    <label style={{ margin: '5px' }}>s.d</label>
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" showIcon />
                </div>
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>
                    <div className="flex align-items-center" style={{ marginRight: '0.5rem' }}>
                        <Checkbox id="checkboxS" value="S" onChange={(e) => onInputChange(e, 'S')} checked={daftarPembelian.Status === 'S'} />
                        <label htmlFor="checkboxS" className="ml-2">
                            Semua
                        </label>
                    </div>
                    <div className="flex align-items-center" style={{ marginRight: '0.5rem' }}>
                        <Checkbox id="checkboxBL" value="BL" onChange={(e) => onInputChange(e, 'BL')} checked={daftarPembelian.Status === 'BL'} />
                        <label htmlFor="checkboxBL" className="ml-2">
                            Belum Lunas
                        </label>
                    </div>
                    <div className="flex align-items-center" style={{ marginRight: '0.5rem' }}>
                        <Checkbox id="checkboxL" value="L" onChange={(e) => onInputChange(e, 'L')} checked={daftarPembelian.Status === 'L'} />
                        <label htmlFor="checkboxL" className="ml-2">
                            Lunas
                        </label>
                    </div>
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" style={{ marginRight: '0.5rem' }} />
                <span className="block p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
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
        onPage(_lazyState);
    };

    //  Yang Handle Inputan
    const onInputChange = (e, value) => {
        const isChecked = e.target.checked;
        const val = isChecked ? value : '';
        setDaftarPembelian((prevState) => ({
            ...prevState,
            Status: val
        }));
    };

    // Yang Handle Footer
    const totData = daftarPembelianTabelFilt ? daftarPembelianTabelFilt.length : 0;

    const totPembayaran =
        daftarPembelianTabelFilt?.reduce((accumulator, item) => {
            const totPembayaranValue = parseFloat(item.Pembayaran);
            return isNaN(totPembayaranValue) ? accumulator : accumulator + totPembayaranValue;
        }, 0) ?? 0;

    const totPO =
        daftarPembelianTabelFilt?.reduce((accumulator, item) => {
            const totPOValue = parseFloat(item.TotalPO);
            return isNaN(totPOValue) ? accumulator : accumulator + totPOValue;
        }, 0) ?? 0;

    const totTerima =
        daftarPembelianTabelFilt?.reduce((accumulator, item) => {
            const totTerimaValue = parseFloat(item.TotalTerima);
            return isNaN(totTerimaValue) ? accumulator : accumulator + totTerimaValue;
        }, 0) ?? 0;

    const totPPN =
        daftarPembelianTabelFilt?.reduce((accumulator, item) => {
            const totPPNValue = parseFloat(item.PPN);
            return isNaN(totPPNValue) ? accumulator : accumulator + totPPNValue;
        }, 0) ?? 0;

    const totDisc =
        daftarPembelianTabelFilt?.reduce((accumulator, item) => {
            const totDiscValue = parseFloat(item.Disc);
            return isNaN(totDiscValue) ? accumulator : accumulator + totDiscValue;
        }, 0) ?? 0;

    const totRetur =
        daftarPembelianTabelFilt?.reduce((accumulator, item) => {
            const totReturValue = parseFloat(item.Retur);
            return isNaN(totReturValue) ? accumulator : accumulator + totReturValue;
        }, 0) ?? 0;

    const totBayar =
        daftarPembelianTabelFilt?.reduce((accumulator, item) => {
            const totBayarValue = parseFloat(item.TotalBayar);
            return isNaN(totBayarValue) ? accumulator : accumulator + totBayarValue;
        }, 0) ?? 0;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                <Column colSpan={5} footer={`${totData.toLocaleString()} Faktur`} />
                <Column colSpan={1} footer={`${totPembayaran.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totPO.toLocaleString()}`} />
                <Column colSpan={2} footer={`${totTerima.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totPPN.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totDisc.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totRetur.toLocaleString()}`} />
                <Column colSpan={8} footer={`${totBayar.toLocaleString()}`} />
            </Row>
        </ColumnGroup>
    );

    // Yang Handle Dialog Entry Pajak
    // Ketika Diklik Dua Kali
    const onRowDoubleClick = (rowData) => {
        setDialogVisible(true);
        setEntryPajak({
            Pembayaran: '',
            FakturBeli: rowData.FktPembelian,
            Supplier: rowData.Supplier,
            Alamat: rowData.AlamatSupplier,
            NPWP: '',
            PPN: rowData.PPN ? parseInt(rowData.PPN).toLocaleString() : 0,
            NoSeri: rowData.NoSeriFktPajak,
            Jumlah: rowData.JmlFktPajak
        });
        setTglTerimaFaktur(rowData.TglFakturPajak ? new Date(rowData.TglFakturPajak) : new Date());
        setTglTerimaPajak(rowData.TglBayar ? new Date(rowData.TglBayar) : new Date());
    };

    //  Ketika Save
    const createDataObject = (_entryPajak) => {
        const data = {
            FktPembelian: _entryPajak.FakturBeli,
            Tgl: convertToISODate(tgl),
            TglTerimaFaktur: tglTerimaFaktur,
            TglTerimaPajak: convertToISODate(tglTerimaPajak),
            Jml: _entryPajak.Jumlah,
            Seri: _entryPajak.NoSeri
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        e.preventDefault();
        let _entryPajak = { ...entryPajak };
        let _data = createDataObject(_entryPajak);
        try {
            const vaTable = await postData(apiEndPointStore, _data);
            let data = vaTable.data;
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Berhasil Disimpan', life: 5000 });
            // setNull();
            setDialogVisible(false);
            window.location.reload();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle Inputan Tanggal Entry Pajak
    const handleTgl = (e) => {
        setTgl(e.value);
    };

    const handleTglChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTgl);
    };

    const handleTglTerima = (e) => {
        setTglTerimaPajak(e.value);
    };

    const handleTglTerimaChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTglTerimaPajak);
    };

    //  Yang Handle Inputan Entry Pajak
    const onInputChangeEntryPajak = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _entryPajak = { ...entryPajak };
        _entryPajak[`${name}`] = val;
        setEntryPajak((prevState) => ({
            ...prevState,
            [name]: val
        }));
        setEntryPajak(_entryPajak);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _entryPajak = { ...entryPajak };
        _entryPajak[`${name}`] = val;

        setEntryPajak(_entryPajak);
    };

    const footer = (
        <div>
            <button type="submit" className="p-button p-component" onClick={saveData}>
                Simpan
            </button>
            <button type="button" className="p-button p-component" onClick={() => setDialogVisible(false)}>
                Batal
            </button>
        </div>
    );

    const handleCheckboxChange = async (e, rowData) => {
        const updatedData = daftarPembelianTabel.map((item) => {
            if (item.FktPembelian === rowData.FktPembelian) {
                return { ...item, CekFaktur: e.checked ? '1' : '0' };
            }
            return item;
        });
        setDaftarPembelianTabel(updatedData);

        try {
            let requestBody = {
                FktPembelian: rowData.FktPembelian,
                CekFkt: e.checked ? '1' : '0'
            };
            const vaTable = await postData(apiEndPointUpd, requestBody);
            let data = vaTable.data;
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Berhasil Disimpan', life: 5000 });
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle CheckBox Tabel
    const checkboxTemplate = (rowData) => {
        return <Checkbox checked={rowData.CekFaktur === '1'} onChange={(e) => handleCheckboxChange(e, rowData)} />;
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
                    <h4>Laporan Daftar Pembelian</h4>
                    <hr />
                    <Toast ref={toast} />
                    <div className="formgrid grid">
                        <div className="field col-4 mb-2 lg:col-4">
                            <label htmlFor="faktur">Periode</label>
                            <div className="p-inputgroup">
                                <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" showIcon />
                                <label style={{ margin: '5px' }}>s.d</label>
                                <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" showIcon />
                            </div>
                        </div>
                        <div className="field col-3 mb-2 lg:col-3">
                            <label htmlFor="faktur">Supplier</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={daftarPembelian.Supplier || supplierKode} placeholder="Supplier" />
                                <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                <InputText readOnly value={supplierNama} placeholder="Ket Supplier" />
                            </div>
                        </div>
                        <div className="field col-3 mb-2 lg:col-3">
                            <label htmlFor="faktur">Status</label>
                            <div className="p-inputgroup">
                                <div className="flex align-items-center mr-2">
                                    <Checkbox id="checkboxS" value="S" onChange={(e) => onInputChange(e, 'S')} checked={daftarPembelian.Status === 'S'} />
                                    <label htmlFor="checkboxS" className="ml-2">
                                        Semua
                                    </label>
                                </div>
                                <div className="flex align-items-center mr-2">
                                    <Checkbox id="checkboxBL" value="BL" onChange={(e) => onInputChange(e, 'BL')} checked={daftarPembelian.Status === 'BL'} />
                                    <label htmlFor="checkboxBL" className="ml-2">
                                        Belum Lunas
                                    </label>
                                </div>
                                <div className="flex align-items-center mr-2">
                                    <Checkbox id="checkboxL" value="L" onChange={(e) => onInputChange(e, 'L')} checked={daftarPembelian.Status === 'L'} />
                                    <label htmlFor="checkboxL" className="ml-2">
                                        Lunas
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="field col-2 mb-2 lg:col-2">
                            <label></label>
                            <div className="p-inputgroup ">
                                <Button label="Refresh" className="p-button-primary p-button-md w-full mr-1" onClick={loadLazyData} />
                            </div>
                        </div>
                    </div>
                    <DataTable
                        // showGridlines
                        value={daftarPembelianTabelFilt}
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
                        footerColumnGroup={footerGroup}
                        loading={loading}
                        emptyMessage="Data Kosong"
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                        onRowDoubleClick={(e) => onRowDoubleClick(e.data)}
                    >
                        <Column field="No" header="NO"></Column>
                        <Column field="Tgl" body={(rowData) => formatDateTable(rowData.Tgl)} header="TANGGAL"></Column>
                        <Column field="FktPembelian" header="FKT PEMBELIAN"></Column>
                        <Column field="Supplier" header="SUPPLIER"></Column>
                        <Column field="FktPO" header="FAKTUR PO"></Column>
                        <Column field="TglDO" body={(rowData) => formatDateTable(rowData.TglDO)} header="TGL DO"></Column>
                        <Column field="FktAsli" header="FKT ASLI"></Column>
                        <Column field="JthTmp" body={(rowData) => formatDateTable(rowData.JthTmp)} header="JTH TMP"></Column>
                        <Column field="Pembayaran" body={(rowData) => (rowData.Pembayaran ? parseInt(rowData.Pembayaran).toLocaleString() : 0)} header="PEMBAYARAN"></Column>
                        <Column field="TotalPO" body={(rowData) => (rowData.TotalPO ? parseInt(rowData.TotalPO).toLocaleString() : 0)} header="TOTAL PO"></Column>
                        <Column field="TotalTerima" body={(rowData) => (rowData.TotalTerima ? parseInt(rowData.TotalTerima).toLocaleString() : 0)} header="TOTAL PENERIMA"></Column>
                        <Column field="SelisihPO" body={(rowData) => (rowData.SelisihPO ? parseInt(rowData.SelisihPO).toLocaleString() : 0)} header="SELISIH PO"></Column>
                        <Column field="PPN" body={(rowData) => (rowData.PPN ? parseInt(rowData.PPN).toLocaleString() : 0)} header="PPN"></Column>
                        <Column field="Disc" body={(rowData) => (rowData.Disc ? parseInt(rowData.Disc).toLocaleString() : 0)} header="DISCOUNT"></Column>
                        <Column field="Retur" body={(rowData) => (rowData.Retur ? parseInt(rowData.Retur).toLocaleString() : 0)} header="RETUR"></Column>
                        <Column field="TotalBayar" body={(rowData) => (rowData.TotalBayar ? parseInt(rowData.TotalBayar).toLocaleString() : 0)} header="TOTAL BAYAR"></Column>
                        <Column field="TglFakturPajak" body={(rowData) => formatDateTable(rowData.TglFakturPajak)} header="TGL FKT PAJAK"></Column>
                        <Column field="JmlFktPajak" body={(rowData) => (rowData.JmlFktPajak ? parseInt(rowData.JmlFktPajak).toLocaleString() : 0)} header="JML FKT PAJAK"></Column>
                        <Column field="NoSeriFktPajak" header="NO SERI FKT PAJAK"></Column>
                        <Column field="CekFaktur" body={checkboxTemplate} header="CEK FKT"></Column>
                        <Column field="UserName" header="USERNAME"></Column>
                        <Column field="FktBayar" header="FKT BAYAR"></Column>
                        <Column field="TglBayar" body={(rowData) => formatDateTable(rowData.TglBayar)} header="TGL BAYAR"></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>
                </div>
            </div>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
            {/* Dialog Entry Pajak */}
            <Dialog header="Entry Pajak" visible={dialogVisible} style={{ width: '45vw' }} footer={footer} onHide={() => setDialogVisible(false)}>
                <div className="card mb-2" style={{ padding: '2px' }}>
                    <div className="field col-12 mb-2 lg:col-12">
                        <div className="formgrid grid">
                            {/* Pembayaran */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>Pembayaran</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputText readOnly value={entryPajak.Pembayaran}></InputText>
                                </div>
                            </div>
                            {/* Faktur Beli */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>Faktur Beli</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputText readOnly value={entryPajak.FakturBeli}></InputText>
                                </div>
                            </div>
                            {/* Supplier */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>Supplier</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputText readOnly value={entryPajak.Supplier}></InputText>
                                </div>
                            </div>
                            {/* Alamat */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>Alamat</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputText readOnly value={entryPajak.Alamat}></InputText>
                                </div>
                            </div>
                            {/* NPWP */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>NPWP</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputText readOnly value={entryPajak.NPWP}></InputText>
                                </div>
                            </div>
                            {/* PPN */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>PPN</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputText readOnly value={entryPajak.PPN} style={{ textAlign: 'right' }}></InputText>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card mb-2" style={{ padding: '2px' }}>
                    <div className="field col-12 mb-2 lg:col-12">
                        <h5 style={{ fontWeight: 'bold' }}>Faktur Pajak</h5>
                        <div className="formgrid grid">
                            {/* Tanggal */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>Tanggal</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '7px' }}>:</label>
                                    <div className="field col-5 mb-2 lg:col-4" style={{ display: 'flex', alignItems: 'center' }}>
                                        <Calendar name="endDate" value={tgl} onInput={handleTglChange} onChange={handleTgl} dateFormat="dd-mm-yy" showIcon />
                                    </div>
                                </div>
                            </div>
                            {/* Tanggal Terima */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>Tanggal Terima</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '7px' }}>:</label>
                                    <div className="field col-5 mb-2 lg:col-4" style={{ display: 'flex', alignItems: 'center' }}>
                                        <Calendar name="endDate" value={tglTerimaPajak} onInput={handleTglTerimaChange} onChange={handleTglTerima} dateFormat="dd-mm-yy" showIcon />
                                    </div>
                                </div>
                            </div>
                            {/* No. Seri */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>No. Seri</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputText value={entryPajak.NoSeri} onChange={(e) => onInputChangeEntryPajak(e, 'NoSeri')}></InputText>
                                </div>
                            </div>
                            {/* Jumlah */}
                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0' }}>Jumlah</label>
                            </div>
                            <div className="field col-10 mb-2 lg:col-10">
                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0', marginRight: '13px' }}>:</label>
                                    <InputNumber value={entryPajak.Jumlah} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'Jumlah')}></InputNumber>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
            <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
        </div>
    );
}
