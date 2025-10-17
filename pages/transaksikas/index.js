/* eslint-disable */
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
import axios from 'axios';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import { convertToISODate, formatAndSetDate, formatColumnValue, formatDate, formatRibuan, getDBConfig } from '../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../component/jsPDF/PDFViewer';
import { exportToXLSX } from '../../component/exportXLSX/exportXLSX';
import { startOfMonth } from 'date-fns';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/transaksikas');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function kasPage() {
    //hubungan dengan path api disini
    const apiDirPath = '/api/_apibase_crud_faktur/';
    //read
    const apiEndPointGet = '/api/kas/get';
    //delete
    const apiEndPointDelete = '/api/kas/delete';

    let emptykas = {
        ID: null,
        Faktur: null,
        Tgl: null,
        RekeningJumlah: null,
        RekeningKredit: null,
        Jumlah: null,
        Kredit: null,
        Keterangan: null
    };

    const toast = useRef(null);
    const dt = useRef(null);

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const [loadingPreview, setLoadingPreview] = useState(true);
    const [deleteKasDialog, setDeleteKasDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [kas, setKas] = useState(emptykas);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [kasTabel, setKasTabel] = useState([]);
    const [kasTabelFilt, setKasTabelFilt] = useState([]);
    const [tglAwal, setTglAwal] = useState(startOfMonth(new Date()));
    const [tglAkhir, setTglAkhir] = useState(new Date());
    const [search, setSearch] = useState('');
    const [jenisTransaksiKasDialog, setJenisTransaksiKasDialog] = useState(false);

    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false); // JSPDF
    const [marginTop, setMarginTop] = useState(10); // JSPDF
    const [marginLeft, setMarginLeft] = useState(10); // JSPDF
    const [marginRight, setMarginRight] = useState(10); // JSPDF
    const [marginBottom, setMarginBottom] = useState(10); // JSPDF
    const [tableWidth, setTableWidth] = useState(800); // JSPDF
    const [orientation, setOrientation] = useState('portrait'); // JSPDF
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4'); // JSPDF
    const [pdfUrl, setPdfUrl] = useState(''); // JSPDF
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
    // const [showPreview, setShowPreview] = useState(false);
    // JSPDF
    function handleHidePreview() {
        // JSPDF
        setShowPreview(false); // JSPDF
    } // JSPDF

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        setKasTabelFilt(kasTabel);
    }, [kasTabel, lazyState]);

    const fetchData = async () => {
        try {
            await Promise.all([komponenPDF(), loadLazyData()]);
            setLoadingPreview(false); // Setelah selesai loading, ubah status menjadi false
        } catch (error) {
            console.error('Error fetching data:', error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setLoadingPreview(false); // Handle error, dan set status loading menjadi false
        }
    };

    useEffect(() => {
        fetchData();
    }, [lazyState]);

    const router = useRouter();
    const openNewPenerimaan = () => {
        setKas(emptykas);
        setSubmitted(false);
        router.push('/transaksikas/addPenerimaanKas');
    };

    const openNew = () => {
        setKas(emptykas);
        setSubmitted(false);
        setJenisTransaksiKasDialog(true);
    };

    const openNewPengeluaran = () => {
        setKas(emptykas);
        setSubmitted(false);
        router.push('/transaksikas/addPengeluaranKas');
    };

    const hideDeleteKasDialog = () => {
        setDeleteKasDialog(false);
    };

    const [today, setToday] = useState(new Date());
    const [namaKoperasi, setNamaKoperasi] = useState('');
    const [alamatKoperasi, setAlamatKoperasi] = useState('');
    const [teleponKoperasi, setTeleponKoperasi] = useState('');
    const [kotaKoperasi, setKotaKoperasi] = useState('');
    const formatDatePdf = (date) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    };

    const komponenPDF = async () => {
        try {
            const config = await getDBConfig('nama_hotel', 'alamat_hotel', 'no_telp', 'kota');
            setNamaKoperasi(config.nama_hotel);
            setAlamatKoperasi(config.alamat_hotel);
            setTeleponKoperasi(config.no_telp);
            setKotaKoperasi(config.kota);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            console.error('Error fetching data:', error);
        }
    };

    const exportPDF = async () => {
        const kasTabelCopy = JSON.parse(JSON.stringify(kasTabelFilt));
        kasTabelCopy.forEach((item) => {
            if (isNaN(item.Tgl)) {
                item.Tgl = formatDate(item.Tgl);
            } else {
                item.Tgl = '';
            }
        });

        const totalPenerimaan = () => {
            const total = kasTabelFilt?.reduce((sum, item) => sum + (item.Penerimaan || 0), 0) || 0;
            return formatRibuan(total);
        };

        const totalPengeluaran = () => {
            const total = kasTabelFilt?.reduce((sum, item) => sum + (item.Pengeluaran || 0), 0) || 0;
            return formatRibuan(total);
        };

        const tableData = kasTabelCopy.map((item) => [item.Faktur, item.Tgl, item.Rekening, formatColumnValue(item.Penerimaan), formatColumnValue(item.Pengeluaran), item.Keterangan]);
        tableData.push(['', '', 'Total : ', totalPenerimaan(), totalPengeluaran(), '']);

        let format = 'a4';
        if (selectedPaperSize === 'Letter') {
            format = 'letter';
        } else if (selectedPaperSize === 'Legal') {
            format = 'legal';
        }

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

        if (!kasTabelCopy || kasTabelCopy.length === 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
        }

        const headerTitle = `${namaKoperasi}`;
        const address = `${alamatKoperasi}`;
        const phoneNumber = `No. Telp : ${teleponKoperasi}`;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(headerTitle, 14, 15 + marginTopInMm - 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(address, 14, 20 + marginTopInMm - 10);
        doc.text(phoneNumber, 14, 25 + marginTopInMm - 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Laporan Mutasi Kas', doc.internal.pageSize.width / 2, 35 + marginTopInMm - 10, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(' Tanggal ' + formatDate(tglAwal), doc.internal.pageSize.width / 2, 41 + marginTopInMm - 10, { align: 'center' });
        // Tambahkan informasi rata kanan
        const pageString = 'Page ' + doc.internal.getNumberOfPages();
        const infoText = `${pageString}`;

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(11);

        doc.text(infoText, pageWidth - 14, 15 + marginTopInMm - 10, {
            align: 'right'
        });

        doc.autoTable({
            startY: 45 + marginTopInMm - 10,
            head: [['Faktur', 'Tgl', 'Rekening', 'Penerimaan', 'Pengeluaran', 'Keterangan']],
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
                1: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' }
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
            }
        });

        // Form Pengesahan
        var tableDataPengesahan = [
            ['', 'Menyetujui,', '    ', '                                  ', '    ', `${kotaKoperasi}, ${formatDatePdf(today)}`],
            ['', '    ', '    ', '                                  ', '    ', `${namaKoperasi}`],
            ['', '    ', '    ', '                                  ', '    ', 'Pembuat'],
            ['', '..............', '    ', '                                  ', '    ', '    ']
        ];
        var totalColumns = tableDataPengesahan[0].length; // Jumlah total kolom dalam tabel                             // lembar pengesahan
        var options = {
            // lembar pengesahan
            startY: doc.autoTable.previous.finalY + 10, // lembar pengesahan
            theme: 'plain', // lembar pengesahan
            margin: {
                top: marginTopInMm,
                left: marginLeftInMm,
                right: marginRightInMm
            }, // lembar pengesahan
            styles: {
                width: '100%',
                cellWidth: 'auto',
                valign: 'middle',
                halign: 'center',
                columnWidth: 'auto' // lembar pengesahan
            } // lembar pengesahan
        }; // lembar pengesahan
        doc.autoTable({
            // lembar pengesahan
            body: tableDataPengesahan, // lembar pengesahan
            ...options // lembar pengesahan
        });

        const pdfDataUrl = doc.output('datauristring');
        setPdfUrl(pdfDataUrl);
        setjsPdfPreviewOpen(true);
        setShowPreview(false);
    };

    const [showPreview, setShowPreview] = useState(false);

    // Fungsi untuk menampilkan popup iframe
    function handleShowPreview() {
        setShowPreview(true);
    }

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const editKas = async (rowData) => {
        const { Faktur } = rowData;
        try {
            localStorage.setItem('Faktur', Faktur);
            if (Faktur.startsWith('KM')) {
                router.push('/transaksikas/addPenerimaanKas?status=update');
            } else {
                router.push('/transaksikas/addPengeluaranKas?status=update');
            }
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || error.message || 'Terjadi Kesalahan');
        }
    };

    const confirmDeleteKas = (Kas) => {
        setKas(Kas);
        setDeleteKasDialog(true);
    };

    const deleteKas = async () => {
        const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointDelete, 'X-DELETEINDEX': kas.Faktur };
        try {
            const vaDelete = await axios.post(apiDirPath, kas, { headers: header });
            showSuccess('Berhasil Hapus Data');
            setKas(emptykas);
            setDeleteKasDialog(false);
            refreshTabel();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    // Toolbar diatas data tabel --------------------------------------------------//
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <Button label="Add" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew}></Button>
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-1 mt-1">
                <div className="p-inputgroup">
                    <React.Fragment>
                        {loadingPreview ? (
                            // Tampilkan indikator loading jika masih dalam proses loading
                            <div>
                                <i className="pi pi-spinner pi-spin" style={{ fontSize: '1.5em', marginRight: '8px' }} />
                                <span style={{ marginLeft: '3px' }}>Loading...</span>
                            </div>
                        ) : (
                            // Tampilkan button preview jika sudah selesai loading
                            <Button label="Preview" icon="pi pi-file" className="p-button-success mr-2" onClick={handleShowPreview} />
                        )}
                    </React.Fragment>
                </div>
            </div>
        );
    };

    // Footer --------------------------------------------------//

    const deleteKasDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteKasDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteKas} />
        </>
    );

    const onPage = (event) => {
        setlazyState(event);
    };

    const actionBodyTemplate = (rowData) => {
        if (rowData.Faktur == ' ') {
            return ''; // Jika tanggal tidak valid, kembalikan string kosong
        }
        return (
            <>
                <div style={{ display: 'flex', 'align-items': 'center', gap: '3px' }}>
                    <Button icon="pi pi-pencil" severity="success" style={{ width: '37px', height: '37px', 'font-size': '14px' }} rounded className="mr-1" onClick={() => editKas(rowData)} title="Edit" />
                    <Button icon="pi pi-trash" severity="warning" style={{ width: '37px', height: '37px', 'font-size': '14px' }} rounded onClick={() => confirmDeleteKas(rowData)} title="Delete" />
                </div>
            </>
        );
    };

    const loadLazyData = async () => {
        setLoading(true);
        const requestData = {
            TglAwal: convertToISODate(tglAwal),
            TglAkhir: convertToISODate(tglAkhir)
        };
        try {
            const vaTable = await postData(apiEndPointGet, requestData);
            const json = vaTable.data;

            // // Menghitung total Penerimaan
            // let totalPenerimaan = 0;
            // json.data.forEach((item) => {
            //     totalPenerimaan += item.Penerimaan;
            // });

            // // Menghitung total Pengeluaran
            // let totalPengeluaran = 0;
            // json.data.forEach((item) => {
            //     totalPengeluaran += item.Pengeluaran;
            // });

            // // Menambahkan baris total ke data
            // const totalRow = {
            //     Faktur: ' ',
            //     Tgl: ' ',
            //     Rekening: 'Total',
            //     Penerimaan: totalPenerimaan,
            //     Pengeluaran: totalPengeluaran,
            //     Keterangan: ' '
            // };
            // json.data.push(totalRow);

            console.log(json.data);
            // setTotalRecords(json.totals);
            setKasTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            console.log(error);
        }
        setLoading(false);
    };

    const handleStartDateChange = (e) => {
        setTglAwal(e.value);
    };
    const handleEndDateChange = (e) => {
        setTglAkhir(e.value);
    };
    const handleInputAwalChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTglAwal);
    };
    const handleInputAkhirChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTglAkhir);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-row md:justify-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar value={tglAwal} onChange={handleStartDateChange} placeholder="Start Date" onInput={handleInputAwalChange} dateFormat="dd-mm-yy" style={{ width: '120px' }} />
                    <Calendar value={tglAkhir} onChange={handleEndDateChange} placeholder="End Date" onInput={handleInputAkhirChange} dateFormat="dd-mm-yy" style={{ width: '120px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <div className="flex flex-row">
                    {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih kolom" /> */}
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                    </span>
                </div>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = kasTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.Tgl) || x.test(d.Rekening) || x.test(d.Penerimaan) || x.test(d.Pengeluaran) || x.test(d.Keterangan) : []));
            setSearch(searchVal);
        }

        setKasTabelFilt(filtered);
    };

    const nominalPenerimaanBodyTemplate = (rowData) => {
        let formattedValue = 0;
        if (rowData.Penerimaan === 0) {
            formattedValue = '';
        } else {
            formattedValue = formatRibuan(rowData.Penerimaan);
        }
        return formattedValue;
    };

    const tglBodyTemplate = (rowData) => {
        const date = new Date(rowData.Tgl);
        if (isNaN(date)) {
            return ''; // Jika tanggal tidak valid, kembalikan string kosong
        }
        const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        return formattedDate;
    };

    const nominalPengeluaranBodyTemplate = (rowData) => {
        let formattedValue = 0;
        if (rowData.Pengeluaran === 0) {
            formattedValue = '';
        } else {
            formattedValue = formatRibuan(rowData.Pengeluaran);
        }
        return formattedValue;
    };

    const penerimaanFooterTemplate = () => {
        const total = kasTabelFilt?.reduce((sum, item) => sum + (item.Penerimaan || 0), 0) || 0;
        return formatRibuan(total);
    };

    const pengeluaranFooterTemplate = () => {
        const total = kasTabelFilt?.reduce((sum, item) => sum + (item.Pengeluaran || 0), 0) || 0;
        return formatRibuan(total);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Transaksi Kas</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

                    <DataTable
                        size="small"
                        ref={dt}
                        value={kasTabelFilt}
                        lazy
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={kasTabelFilt.length}
                        onPage={onPage}
                        loading={loading}
                        header={header}
                        filters={lazyState.filters}
                        emptyMessage="Data Kosong"
                    >
                        <Column field="Faktur" header="FAKTUR"></Column>
                        <Column field="Tgl" header="TANGGAL" body={tglBodyTemplate}></Column>
                        <Column field="Rekening" header="REKENING" footer={'Total :'}></Column>
                        <Column field="Penerimaan" body={nominalPenerimaanBodyTemplate} footer={penerimaanFooterTemplate} style={{ textAlign: 'right' }} header="PENERIMAAN"></Column>
                        <Column field="Pengeluaran" body={nominalPengeluaranBodyTemplate} footer={pengeluaranFooterTemplate} style={{ textAlign: 'right' }} header="PENGELUARAN"></Column>
                        <Column field="Keterangan" header="KETERANGAN"></Column>
                        <Column field="ACTION" header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                </div>
            </div>
            <Dialog visible={deleteKasDialog} header="Confirm" modal footer={deleteKasDialogFooter} onHide={hideDeleteKasDialog}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {kas && (
                        <span>
                            Yakin ingin menghapus <strong>{kas.Faktur}</strong>
                        </span>
                    )}
                </div>
            </Dialog>
            {/* Dialog Jenis Transaksi Kas*/}
            <Dialog visible={jenisTransaksiKasDialog} header="Pilih Jenis Transaksi Kas" modal onHide={() => setJenisTransaksiKasDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <Button label="Penerimaan Kas" icon="pi pi-plus" className="p-button-info mr-2" onClick={openNewPenerimaan} />
                    <Button label="Pengeluaran Kas" icon="pi pi-minus" className="p-button-warning mr-2" onClick={openNewPengeluaran} />
                </div>
            </Dialog>
            <Dialog
                visible={showPreview}
                onHide={() => setShowPreview(false)}
                header="Report Type" // Ini adalah judul dialog
                style={{ width: '90%' }}
            >
                <div className="card">
                    <div class="grid">
                        <div class="col-12 md:col-9 lg:col-9">
                            <div className="card">
                                <div class="grid">
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Atas</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginTop" value={marginTop} onChange={(e) => setMarginTop(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Bawah</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginBottom" value={marginBottom} onChange={(e) => setMarginBottom(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Lebar Tabel</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="tableWidth" value={tableWidth} onChange={(e) => setTableWidth(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="grid">
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Kanan</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginRight" value={marginRight} onChange={(e) => setMarginRight(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Kiri</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginLeft" value={marginLeft} onChange={(e) => setMarginLeft(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">&nbsp;</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-3 lg:col-3">
                            <div className="card">
                                <div class="grid">
                                    <div class="col-12 md:col-12 lg:col-12">
                                        <label htmlFor="rekening">Ukuran Kertas</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <Dropdown id="paperSize" value={selectedPaperSize} options={paperSizes} onChange={handlePaperSizeChange} optionLabel="name" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-12 lg:col-12">
                                        <label htmlFor="rekening">Orientasi</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <Dropdown id="orientation" value={orientation} options={orientationOptions} onChange={handleOrientationChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ backgroundColor: '#fAfAfA' }}>
                    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}></div>
                        <div className="flex flex-row md:justify-between md:align-items-center">
                            <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
                                <Button label="Export PDF" icon="pi pi-file" className="p-button-danger mr-2" onClick={exportPDF} />
                                <Button label="Export XLSX" icon="pi pi-upload" className="p-button-info mr-2" onClick={() => exportToXLSX(kasTabelFilt, 'transaksi-kas.xlsx')} />
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}
