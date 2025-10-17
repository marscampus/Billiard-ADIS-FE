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
 * Created on Fri May 03 2024 - 06:32:51
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { useRouter } from 'next/router';
import { getSessionServerSide } from '../../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'jspdf-autotable';
import { Toolbar } from 'primereact/toolbar';
import Gudang from '../../../component/gudang';
import postData from '../../../../lib/Axios';
import FakturKirim from '../../../component/fakturKirim';
import { convertToISODate, formatDatePdf, formatDateSave, formatDateTable, getDBConfig, getEmail, getUserName, setLastFaktur } from '../../../../component/GeneralFunction/GeneralFunction';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../../component/PDFViewer';
import { Dropdown } from 'primereact/dropdown';
import jsPDF from 'jspdf';
import AdjustPrintMarginPDF from '../../../component/adjustPrintMarginPDF';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/transaksistock/mutasi-gudang');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

export default function MutasiGudangTerima() {
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointGetDataFakturTerima = '/api/terima-stock/get-data-faktur-kirim';
    const apiEndPointStore = '/api/terima-stock/store';
    const apiEndPointGetDataEditTerima = '/api/terima-stock/get-data-edit';
    const apiEndPointUpdate = '/api/terima-stock/update';
    const apiEndPointGetDataFaktur = '/api/mutasi-stock/get-data';

    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [terimaStock, setTerimaStock] = useState([]);
    const [addTerimaStock, setAddTerimaStock] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [faktur, setFaktur] = useState(null);
    const [fakturKirim, setFakturKirim] = useState(null);
    const [fakturKirimDialog, setFakturKirimDialog] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [kodeDariGudang, setKodeDariGudang] = useState('');
    const [ketDariGudang, setKetDariGudang] = useState('');
    const [kodeKeGudang, setKodeKeGudang] = useState('');
    const [ketKeGudang, setKetKeGudang] = useState('');
    const [timer, setTimer] = useState(null);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    // PDF OLD
    const [today, setToday] = useState(new Date());
    const [namaToko, setNamaToko] = useState(null);
    const [alamatToko, setAlamatToko] = useState(null);
    const [teleponToko, setTeleponToko] = useState(null);
    const [kotaToko, setKotaToko] = useState(null);
    const [marginTop, setMarginTop] = useState(10); // JSPDF
    const [marginLeft, setMarginLeft] = useState(10); // JSPDF
    const [marginRight, setMarginRight] = useState(10); // JSPDF
    const [marginBottom, setMarginBottom] = useState(10); // JSPDF
    const [tableWidth, setTableWidth] = useState(800); // JSPDF
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ]; // JSPDF
    const orientationOptions = [
        { label: 'Potret', value: 'portrait' },
        { label: 'Lanskap', value: 'landscape' }
    ]; // JSPDF
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    }; // JSPDF
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    }; // JSPDF
    // JSPDF
    // PDF OLD
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const hidePreview = async () => {
        setShowPreview(false);
        await setLastFaktur('BA');
        router.push('/transaksistock/mutasi-gudang');
    };

    const hidePDF = async () => {
        setjsPdfPreviewOpen(false);
        await setLastFaktur('BA');
        router.push('/transaksistock/mutasi-gudang');
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        const { status } = router.query;
        const Faktur = localStorage.getItem('Faktur');
        if (status === 'update') {
            setFaktur(Faktur);
            getDataEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false);
        }

        // Komponen Handle Slip Gudang
        const komponenPDF = async () => {
            try {
                const nama = await getDBConfig('msNamaToko');
                setNamaToko(nama);
                const alamat = await getDBConfig('msAlamat');
                setAlamatToko(alamat);
                const telepon = await getDBConfig('msTelepon');
                setTeleponToko(telepon);
                const kota = await getDBConfig('msKota');
                setKotaToko(kota);
            } catch (error) { }
        };
        komponenPDF();
    }, []);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                Kode: 'BA',
                Len: 6
            };
            const vaData = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaData.data;
            setFaktur(json);
            setTerimaStock((prevTerimaStock) => ({
                ...prevTerimaStock,
                Faktur: json
            }));
        } catch (error) {
            console.log('Error while loading data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Edit in Cell
    const cellEditor = (options) => {
        return textEditor(options);
    };

    // Yang Handle Get Data Edit
    const getDataEdit = async () => {
        setLoading(true);
        const Faktur = localStorage.getItem('Faktur');
        try {
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(apiEndPointGetDataEditTerima, requestBody);
            const json = vaData.data;
            setTerimaStock(json);
            setAddTerimaStock(json.tabelTerimaStock);
        } catch (error) {
            console.log('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Save
    const createDataObject = (_terimaStock, _addTerimaStock) => {
        let data = {
            Faktur: isUpdateMode ? _terimaStock.Faktur : faktur,
            FakturKirim: isUpdateMode ? _terimaStock.FakturKirim : fakturKirim,
            Tgl: isUpdateMode ? _terimaStock.Tgl : convertToISODate(_terimaStock.Tgl || new Date()),
            KeGudang: terimaStock.KeGudang,
            DariGudang: terimaStock.DariGudang,
            tabelTerimaStock: _addTerimaStock
                .map((item) => {
                    const Qty = item.QtyTerima !== null ? item.QtyTerima : 0;
                    if (Qty > 0) {
                        return {
                            Kode: item.Kode,
                            Expired: item.Expired,
                            Qty: item.QtyTerima,
                            Satuan: item.Satuan
                        };
                    } else {
                        return null;
                    }
                })
                .filter((item) => item !== null)
        };
        return data;
    };

    const saveTerimaStock = async (e) => {
        e.preventDefault();
        let _terimaStock = { ...terimaStock };
        let _addTerimaStock = [...addTerimaStock];
        let _data = createDataObject(_terimaStock, _addTerimaStock);
        if (_data.Faktur == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.FakturKirim == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Kirim Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Tgl == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tanggal Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.KeGudang == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.tabelTerimaStock.length <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong!', life: 3000 });
            return;
        }
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaData = await postData(endPoint, _data);
            const json = vaData.data;
            if (json.status === 'success') {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
                isUpdateMode ? router.push('/transaksistock/mutasi-gudang') : handleAdjust();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
        }
    };
    const onQtyUpdate = (updatedAddStock) => {
        setAddTerimaStock(updatedAddStock);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field } = e;
        const editedQty = parseFloat(newValue.replace(',', '.'));

        // Mendapatkan kode dan tanggal kadaluarsa dari baris yang diedit
        const { Kode, Expired } = rowData;

        // Mencari indeks dari entri yang sesuai dalam addTerimaStock
        const rowIndex = addTerimaStock.findIndex((item) => item.Kode === Kode && item.Expired === Expired);

        if (rowIndex !== -1) {
            // Mendapatkan QtyKirim dari baris yang sesuai
            const qtyKirim = addTerimaStock[rowIndex].QtyKirim;

            if (!isNaN(editedQty)) {
                // Validasi editedQty <= qtyKirim
                if (editedQty > qtyKirim) {
                    toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Jumlah Terima Tidak Boleh Melebihi QTY KIRIM', life: 3000 });
                    return { QtyTerima: qtyKirim };
                }

                if (editedQty === 0 || editedQty === '') {
                    deleteSelectedRow(rowData);
                } else {
                    // Mengupdate QtyTerima jika kode dan tanggal kadaluarsa cocok
                    const updatedAddTerimaStock = [...addTerimaStock];
                    updatedAddTerimaStock[rowIndex].QtyTerima = editedQty;

                    setAddTerimaStock(updatedAddTerimaStock);

                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddTerimaStock);
                    }
                }
            } else {
                console.log('Invalid input. Please enter a valid number for Qty.');
            }
        } else {
            console.log('Row not found.');
        }
    };

    //  Yang Handle Laporan
    const handleAdjust = async () => {
        cetakSlip();
    };

    // Yang Handle Cetak Slip
    const cetakSlip = async () => {
        try {
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            let requestBody = {
                Faktur: isUpdateMode ? terimaStock.Faktur : faktur
            };
            const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
            const jsonHeader = vaTable.data;
            const jsonDetail = vaTable.data.data;
            const marginLeftInMm = parseFloat(marginLeft);
            const marginTopInMm = parseFloat(marginTop);
            const marginRightInMm = parseFloat(marginRight);
            const marginBottomInMm = parseFloat(marginBottom);
            const tableWidthInMm = parseFloat(tableWidth);

            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const userName = await getUserName(await getEmail());
            const yOffsetForm = marginTop + 25;
            const lineHeightForm = 4;

            const labelXPosition = marginLeft + 14;
            const label2XPosition = pageWidth - 90; // Posisi label2 di sebelah kanan
            const valueXPosition = labelXPosition + 40; // Posisi nilai di sebelah kiri
            const value2XPosition = label2XPosition + 40; // Posisi nilai di sebelah kanan

            const judulLaporan = '';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = jsonDetail.map((item) => [item.No, item.Kode, item.Nama, parseInt(item.HJ).toLocaleString(), parseInt(item.Qty).toLocaleString(), item.Satuan, parseInt(item.TotalHJ).toLocaleString()]);

            tableData.push(['', '', 'Total Items : ' + parseInt(jsonHeader.total_data).toLocaleString(), '', parseInt(jsonHeader.total).toLocaleString(), '', parseInt(jsonHeader.total_HJ).toLocaleString()]);

            doc.setFontSize(10);
            const dataGrid = [
                {
                    label: 'Faktur',
                    value: faktur,
                    label2: 'Tanggal',
                    value2: formatDatePdf(jsonHeader.tgl)
                },
                {
                    label: 'Dari',
                    value: jsonHeader.gudang_kirim,
                    label2: 'Ke',
                    value2: jsonHeader.gudang_terima
                }
            ];
            dataGrid.forEach((item, index) => {
                const yPosition = yOffsetForm + index * lineHeightForm;
                doc.text(item.label.toString(), labelXPosition, yPosition);
                doc.text(' : ', valueXPosition, yPosition, 'center');
                doc.text(item.value.toString(), valueXPosition + 5, yPosition);
                if (item.label2) {
                    // Cetak label2 dan value2 di sebelah kanan
                    doc.text(item.label2.toString(), label2XPosition, yPosition);
                    doc.text(' : ', value2XPosition, yPosition, 'center');
                    doc.text(item.value2.toString(), value2XPosition + 5, yPosition);
                }
            });

            doc.autoTable({
                startY: 45,
                head: [['NO', 'ITEM', 'NAMA BARANG', 'HARGA', 'QTY', 'UOM', 'TOTAL']],
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
                    0: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    6: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawCell: (data) => {
                    if (data.row.index !== null && data.cell.raw !== null) {
                        const { doc, row, column, styles } = data;
                        doc.setFillColor(255, 255, 255);
                    }
                },
                didDrawRow: (data) => {
                    if (data.row.index !== null) {
                        const rowData = tableData[data.row.index];
                        if (rowData && rowData.Keterangan === 'ASET') {
                            // Jika Jenis === 'I', maka set gaya teks menjadi bold
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
                didDrawPage: async function (data) {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });

            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) { }
    };

    // Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...terimaStock };
        _data[`${name}`] = val;
        setTerimaStock(_data);
    };

    // Yang Handle Faktur Kirim
    const toggleFakturKirim = () => {
        setFakturKirimDialog(true);
    };

    const handleFakturKirimData = (fakturKirim) => {
        setFakturKirim(fakturKirim);
        onRowSelectFakturKirim(fakturKirim);
    };

    const onRowSelectFakturKirim = async (fakturKirim) => {
        let requestBody = {
            Faktur: fakturKirim
        };
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetDataFakturTerima, requestBody);
            const json = vaTable.data;
            setTerimaStock(json);
            const addTerima = json.tabelTerimaStock;
            let _data = [...addTerima];
            for (let i = 0; i < _data.length; i++) {
                const data = _data[i];
            }
            setAddTerimaStock(() => {
                const updatedAddItem = _data.map((data, index) => {
                    return {
                        Kode: data.Kode,
                        Nama: data.Nama,
                        Satuan: data.Satuan,
                        Expired: data.Expired,
                        QtyKirim: data.QtyKirim,
                        QtyTerima: data.QtyKirim
                    };
                });
                return updatedAddItem;
            });
        } catch (error) {
            console.error('Error while loading data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const actionBodyTabel = (rowData) => {
        return <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />;
    };

    const textEditor = (options) => {
        return <InputText value={options.value} keyfilter={/^[0-9,.]*$/} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const deleteSelectedRow = (rowData) => {
        const updatedAddTerimaStock = addTerimaStock.filter((row) => row !== rowData);
        setAddTerimaStock(updatedAddTerimaStock);
    };

    const rightFooterTemplate = (rowData) => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveTerimaStock} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/transaksistock/mutasi-gudang');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>{isUpdateMode ? 'Edit' : 'Add'} Terima Stock dari Gudang Lain</h4>
                <Toast ref={toast}></Toast>
                <div>
                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="faktur">Faktur</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={isUpdateMode ? terimaStock.Faktur : faktur} />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="tanggal">Tanggal </label>
                                    <div className="p-inputgroup">
                                        <Calendar
                                            disabled={readOnlyEdit}
                                            value={terimaStock.Tgl && terimaStock.Tgl ? new Date(terimaStock.Tgl) : new Date()}
                                            onChange={(e) => onInputChange(e, 'Tgl')}
                                            id="tgl"
                                            showIcon
                                            dateFormat="dd-mm-yy"
                                        ></Calendar>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="gudang">Dari Gudang</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={terimaStock.DariGudang} />
                                        <InputText readOnly value={terimaStock.KetDariGudang} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="fakturKirim">Faktur Kirim</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={isUpdateMode ? terimaStock.FakturKirim : fakturKirim}></InputText>
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleFakturKirim} disabled={readOnlyEdit} />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="gudang">Ke Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={terimaStock.KeGudang} />
                                    <InputText readOnly value={terimaStock.KetKeGudang} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr></hr>
                <DataTable
                    loading={loading}
                    value={addTerimaStock}
                    size="small"
                    lazy
                    dataKey="Kode"
                    rows={10}
                    editMode="cell"
                    className="datatable-responsive editable-cells-"
                    responsiveLayout="scroll"
                    first={lazyState.first}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    scrollable
                    scrollHeight="200px"
                >
                    <Column field="Kode" header="BARCODE"></Column>
                    <Column field="Nama" header="NAMA"></Column>
                    <Column field="Satuan" header="SATUAN"></Column>
                    <Column field="QtyKirim" header="QTY KIRIM"></Column>
                    <Column
                        field="QtyTerima"
                        header="QTY TERIMA"
                        editor={(options) => cellEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.QtyTerima ? parseFloat(rowData.QtyTerima).toLocaleString() : '0';
                            return value;
                        }}
                    ></Column>
                    <Column header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
                <br></br>
                <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
            </div>
            <FakturKirim fakturKirimDialog={fakturKirimDialog} setFakturKirimDialog={setFakturKirimDialog} btnFakturKirim={toggleFakturKirim} handleFakturKirimData={handleFakturKirimData}></FakturKirim>
            <AdjustPrintMarginPDF loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} />
            <Dialog visible={jsPdfPreviewOpen} onHide={hidePDF} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}
